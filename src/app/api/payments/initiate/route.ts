import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { z } from 'zod'
import { createPaymentUrl, isMoMoConfigured } from '@/lib/payments/momo'

const initiateSchema = z.object({
  orderId: z.string().uuid().optional(),
  enrollmentId: z.string().uuid().optional(),
  amount: z.number().int().positive().optional(),
}).refine(d => d.orderId || d.enrollmentId, {
  message: 'Cần orderId hoặc enrollmentId',
})

// ─── POST /api/payments/initiate ───
// HV bấm "Thanh toán MoMo" → server tạo MoMo payUrl
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!isMoMoConfigured()) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_CONFIGURED', message: 'MoMo chưa được cấu hình. Vui lòng liên hệ admin.' } },
        { status: 503 }
      )
    }

    const body = await request.json()
    const parsed = initiateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } },
        { status: 400 }
      )
    }

    // Resolve order hoặc enrollment để lấy amount + studentId
    let amount = 0
    let orderInfo = ''
    let studentId: string | null = null
    let referenceType: string
    let referenceId: string

    if (parsed.data.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: parsed.data.orderId },
        include: { student: { select: { id: true, userId: true, user: { select: { fullName: true } } } } }
      })
      if (!order) {
        return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy đơn hàng' } }, { status: 404 })
      }
      // Verify học viên chỉ pay được đơn của mình
      if (user.role === 'student' && order.student.userId !== user.id) {
        return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Không có quyền' } }, { status: 403 })
      }
      if (order.status !== 'approved') {
        return NextResponse.json({ data: null, error: { code: 'INVALID_STATUS', message: `Đơn ở trạng thái ${order.status}, không thể thanh toán` } }, { status: 400 })
      }
      amount = order.finalAmount
      orderInfo = `Thanh toán đơn ${order.id.slice(0, 8).toUpperCase()} - ${order.student.user.fullName}`
      studentId = order.studentId
      referenceType = 'order'
      referenceId = order.id
    } else if (parsed.data.enrollmentId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: parsed.data.enrollmentId },
        include: {
          course: true,
          student: { select: { id: true, userId: true, user: { select: { fullName: true } } } }
        }
      })
      if (!enrollment) {
        return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy đăng ký khoá' } }, { status: 404 })
      }
      if (user.role === 'student' && enrollment.student.userId !== user.id) {
        return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Không có quyền' } }, { status: 403 })
      }
      const remaining = enrollment.course.price - enrollment.totalPaid
      amount = parsed.data.amount ?? remaining
      if (amount <= 0) {
        return NextResponse.json({ data: null, error: { code: 'NO_DEBT', message: 'Khoá học đã đóng đủ' } }, { status: 400 })
      }
      if (amount > remaining) {
        return NextResponse.json({ data: null, error: { code: 'OVER_DEBT', message: `Tối đa ${remaining.toLocaleString('vi-VN')}đ` } }, { status: 400 })
      }
      orderInfo = `${enrollment.course.name} - ${enrollment.student.user.fullName}`
      studentId = enrollment.studentId
      referenceType = 'enrollment'
      referenceId = enrollment.id
    } else {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid' } }, { status: 400 })
    }

    // Generate IDs (must be unique, alphanumeric only theo MoMo spec)
    const ts = Date.now()
    const requestId = `POLA${ts}${Math.random().toString(36).slice(2, 8)}`
    const momoOrderId = `${referenceType}_${referenceId.slice(0, 8)}_${ts}`

    // Tạo MoMo payment URL
    const result = await createPaymentUrl({
      requestId,
      orderId: momoOrderId,
      amount,
      orderInfo,
      extraData: Buffer.from(JSON.stringify({ referenceType, referenceId, studentId })).toString('base64'),
    })

    if (!result.ok || !result.payUrl) {
      return NextResponse.json(
        { data: null, error: { code: 'GATEWAY_ERROR', message: result.error ?? 'Lỗi MoMo' } },
        { status: 502 }
      )
    }

    // Lưu GatewayTransaction để track
    await prisma.gatewayTransaction.create({
      data: {
        gatewayName: 'momo',
        requestId,
        orderId: momoOrderId,
        orderInfo,
        amount,
        status: 'pending',
        studentId,
        referenceType,
        referenceId,
        rawRequest: { requestId, orderId: momoOrderId, amount, orderInfo },
        rawResponse: (result.raw ?? {}) as never,
      }
    })

    log.info('payment.initiate', `MoMo URL created for ${referenceType} ${referenceId}`, { requestId, amount })

    return NextResponse.json({
      data: {
        payUrl: result.payUrl,
        qrCodeUrl: result.qrCodeUrl,
        requestId,
        momoOrderId,
      },
      error: null
    })

  } catch (error) {
    await logError({ context: 'payment.initiate', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
