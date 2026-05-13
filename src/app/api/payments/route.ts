import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { recordPaymentSchema } from '@/lib/validations/payment'

// ─── POST /api/payments — Ghi nhận thanh toán ─────────────
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])

    const body = await request.json()
    const parsed = recordPaymentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Thông tin không hợp lệ', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const input = parsed.data

    // Nếu là học phí → cập nhật enrollment.totalPaid
    if (input.type === 'course_fee' && input.referenceId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: input.referenceId },
        include: { course: true }
      })

      if (enrollment) {
        const newTotalPaid = enrollment.totalPaid + input.amount
        const courseFee = enrollment.course.price

        let newStatus = enrollment.status
        // Nếu đã đóng đủ → update status
        if (newTotalPaid >= courseFee && enrollment.status === 'active') {
          newStatus = 'active' // Đã đóng đủ, vẫn active
        }

        await prisma.enrollment.update({
          where: { id: input.referenceId },
          data: {
            totalPaid: newTotalPaid,
            status: newStatus,
            // Xoá deadline nếu đã đóng đủ
            paymentDeadline: newTotalPaid >= courseFee ? null : enrollment.paymentDeadline,
          }
        })

        // Cập nhật student status nếu cần
        const student = await prisma.student.findUnique({
          where: { id: enrollment.studentId }
        })
        if (student?.status === 'enrolled' && newTotalPaid >= courseFee) {
          await prisma.student.update({
            where: { id: enrollment.studentId },
            data: { status: 'active' }
          })
        }
      }
    }

    // Tạo payment record
    const payment = await prisma.payment.create({
      data: {
        studentId: input.studentId,
        amount: input.amount,
        type: input.type,
        referenceType: input.referenceType || null,
        referenceId: input.referenceId || null,
        paymentMethod: input.paymentMethod,
        referenceNumber: input.referenceNumber || null,
        recordedBy: user.id,
        notes: input.notes || null,
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'payment.record',
        entityType: 'payment',
        entityId: payment.id,
        afterData: { amount: input.amount, type: input.type, method: input.paymentMethod }
      }
    })

    // Thông báo cho học viên
    const student = await prisma.student.findUnique({
      where: { id: input.studentId },
      select: { userId: true }
    })
    if (student) {
      await prisma.notification.create({
        data: {
          userId: student.userId,
          studentId: input.studentId,
          type: 'general',
          title: 'Đã ghi nhận thanh toán ✓',
          body: `Thanh toán ${input.amount.toLocaleString('vi-VN')}đ đã được ghi nhận. Cảm ơn bạn nhé! 💙`,
          metadata: { paymentId: payment.id, amount: input.amount, type: input.type }
        }
      })
    }

    log.info('payments.record', `Recorded ${input.type} payment`, {
      studentId: input.studentId, amount: input.amount, recordedBy: user.id
    })

    return NextResponse.json({ data: payment, error: null }, { status: 201 })

  } catch (error) {
    await logError({ context: 'payments.record', message: 'Failed to record payment', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi ghi nhận thanh toán' } },
      { status: 500 }
    )
  }
}

// ─── GET /api/payments — Lịch sử thanh toán ───────────────
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'staff'])

    const studentId = request.nextUrl.searchParams.get('studentId')
    const where = studentId ? { studentId } : {}

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: 50,
      include: {
        student: { include: { user: { select: { fullName: true } } } }
      }
    })

    return NextResponse.json({ data: payments, error: null })

  } catch (error) {
    await logError({ context: 'payments.list', message: 'Failed to fetch payments', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
