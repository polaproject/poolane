import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { z } from 'zod'
import { buildMemo } from '@/lib/payments/vietqr'
import { sendEmail } from '@/lib/email/client'
import { paymentReceiptEmail } from '@/lib/email/templates'

const schema = z.object({
  orderId: z.string().uuid(),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(300).optional(),
})

// ─── POST /api/payments/confirm-transfer ───
// Admin/staff đã đối chiếu sao kê và bấm xác nhận → tạo Payment + paid order
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      include: {
        orderItems: { include: { product: true } },
        student: { include: { user: { select: { id: true, fullName: true, email: true } } } }
      }
    })

    if (!order) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy đơn' } }, { status: 404 })
    }

    if (order.status !== 'approved') {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_STATUS', message: `Đơn ở trạng thái ${order.status}, chỉ xác nhận được đơn đã duyệt` } },
        { status: 409 }
      )
    }

    const memo = buildMemo(order.id)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Order status
      const updated = await tx.order.update({
        where: { id: order.id },
        data: { status: 'paid' }
      })

      // 2. Tạo Payment record
      const payment = await tx.payment.create({
        data: {
          studentId: order.studentId,
          amount: order.finalAmount,
          type: 'shop',
          referenceType: 'order',
          referenceId: order.id,
          paymentMethod: 'bank_transfer',
          referenceNumber: parsed.data.referenceNumber || memo,
          recordedBy: user.id,
          notes: parsed.data.notes || `Xác nhận chuyển khoản VietQR - đơn ${order.id.slice(0, 8).toUpperCase()}`,
        }
      })

      // 3. Auto-create ImprovementSessionPack + trừ stock cho physical
      for (const item of order.orderItems) {
        if (item.product.type === 'improvement_pack' && item.product.sessionsCount) {
          for (let i = 0; i < item.quantity; i++) {
            await tx.improvementSessionPack.create({
              data: {
                studentId: order.studentId,
                orderId: order.id,
                sessionsPurchased: item.product.sessionsCount,
                expiresAt: new Date(Date.now() + 90 * 86400000),
              }
            })
          }
        }
        if (item.product.type === 'physical' && item.product.stockQuantity !== null) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } }
          })
        }
      }

      // 4. Notification cho HV
      await tx.notification.create({
        data: {
          userId: order.student.user.id,
          studentId: order.studentId,
          senderId: user.id,
          type: 'general',
          title: '✓ Đã xác nhận thanh toán',
          body: `Lớp đã nhận ${order.finalAmount.toLocaleString('vi-VN')}đ cho đơn hàng. Cảm ơn bạn 💙`,
          metadata: { paymentId: payment.id, orderId: order.id },
        }
      })

      // 5. Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          role: user.role,
          action: 'order.confirm_transfer',
          entityType: 'order',
          entityId: order.id,
          beforeData: { status: 'approved' },
          afterData: { status: 'paid', memo, paymentId: payment.id },
        }
      })

      return { payment, updated }
    })

    // 6. Email biên lai (fire-and-forget)
    if (order.student.user.email && !order.student.user.email.endsWith('@poolane.local')) {
      const tmpl = paymentReceiptEmail({
        fullName: order.student.user.fullName,
        amount: order.finalAmount,
        type: 'Mua hàng (chuyển khoản)',
        paymentMethod: 'Chuyển khoản ngân hàng',
        recordedAt: new Date(),
        referenceNumber: parsed.data.referenceNumber || memo,
      })
      sendEmail({ to: order.student.user.email, ...tmpl }).catch(() => {})
    }

    log.info('payment.confirm_transfer', `Order ${order.id} confirmed`, {
      paymentId: result.payment.id,
      confirmedBy: user.id,
      amount: order.finalAmount,
    })

    return NextResponse.json({ data: { paymentId: result.payment.id, orderId: order.id }, error: null })

  } catch (error) {
    await logError({ context: 'payment.confirm_transfer', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
