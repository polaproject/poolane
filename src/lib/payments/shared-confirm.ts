// Shared logic cho confirm transfer — dùng bởi cả admin manual button + Sepay webhook
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { buildMemo, buildEnrollmentMemo } from '@/lib/payments/vietqr'
import { sendEmail } from '@/lib/email/client'
import { paymentReceiptEmail } from '@/lib/email/templates'

interface ConfirmInput {
  amount: number
  referenceNumber?: string | null
  recordedBy: string                  // userId của admin/staff hoặc 'system' khi qua webhook
  recordedByRole: 'admin' | 'staff' | 'system'
  notes?: string | null
  source?: 'manual' | 'sepay'         // để audit log phân biệt
}

export interface ConfirmResult {
  ok: true
  paymentId: string
}

export interface ConfirmError {
  ok: false
  code: string
  message: string
}

// ─── Confirm Order Transfer ───────────────────────────
export async function confirmOrderTransfer(
  orderId: string,
  input: ConfirmInput
): Promise<ConfirmResult | ConfirmError> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: { include: { product: true } },
      student: { include: { user: { select: { id: true, fullName: true, email: true } } } }
    }
  })

  if (!order) return { ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy đơn' }
  if (order.status !== 'approved') {
    return { ok: false, code: 'INVALID_STATUS', message: `Đơn ở trạng thái ${order.status}, chỉ xác nhận được đơn đã duyệt` }
  }

  const memo = buildMemo(order.id)
  const action = input.source === 'sepay' ? 'sepay.confirm_order' : 'order.confirm_transfer'

  const result = await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'paid' }
    })

    const payment = await tx.payment.create({
      data: {
        studentId: order.studentId,
        amount: order.finalAmount,
        type: 'shop',
        referenceType: 'order',
        referenceId: order.id,
        paymentMethod: 'bank_transfer',
        referenceNumber: input.referenceNumber || memo,
        recordedBy: input.recordedBy,
        notes: input.notes || (input.source === 'sepay'
          ? `Sepay tự động xác nhận - đơn ${order.id.slice(0, 8).toUpperCase()}`
          : `Xác nhận chuyển khoản VietQR - đơn ${order.id.slice(0, 8).toUpperCase()}`),
      }
    })

    // Auto-create ImprovementSessionPack + trừ stock cho physical
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

    await tx.notification.create({
      data: {
        userId: order.student.user.id,
        studentId: order.studentId,
        senderId: input.recordedBy === 'system' ? null : input.recordedBy,
        type: 'general',
        title: input.source === 'sepay' ? '⚡ Tự động xác nhận thanh toán' : '✓ Đã xác nhận thanh toán',
        body: `Lớp đã nhận ${order.finalAmount.toLocaleString('vi-VN')}đ cho đơn hàng. Cảm ơn bạn 💙`,
        metadata: { paymentId: payment.id, orderId: order.id, source: input.source ?? 'manual' },
      }
    })

    await tx.auditLog.create({
      data: {
        userId: input.recordedBy === 'system' ? null : input.recordedBy,
        role: input.recordedByRole,
        action,
        entityType: 'order',
        entityId: order.id,
        beforeData: { status: 'approved' },
        afterData: { status: 'paid', memo, paymentId: payment.id, source: input.source ?? 'manual' },
      }
    })

    return { payment }
  })

  // Email biên lai
  if (order.student.user.email && !order.student.user.email.endsWith('@poolane.local')) {
    const tmpl = paymentReceiptEmail({
      fullName: order.student.user.fullName,
      amount: order.finalAmount,
      type: 'Mua hàng (chuyển khoản)',
      paymentMethod: 'Chuyển khoản ngân hàng',
      recordedAt: new Date(),
      referenceNumber: input.referenceNumber || memo,
    })
    sendEmail({ to: order.student.user.email, ...tmpl }).catch(() => {})
  }

  log.info('payment.confirm_order', `Order ${order.id} confirmed via ${input.source ?? 'manual'}`, {
    paymentId: result.payment.id,
    amount: order.finalAmount,
  })

  return { ok: true, paymentId: result.payment.id }
}

// ─── Confirm Enrollment Transfer ──────────────────────
export async function confirmEnrollmentTransferShared(
  enrollmentId: string,
  input: ConfirmInput
): Promise<ConfirmResult | ConfirmError> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: true,
      student: { include: { user: { select: { id: true, fullName: true, email: true } } } }
    }
  })

  if (!enrollment) return { ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy khoá' }
  if (enrollment.status === 'cancelled' || enrollment.status === 'refunded') {
    return { ok: false, code: 'INVALID_STATUS', message: `Khoá ở trạng thái ${enrollment.status}` }
  }

  const memo = buildEnrollmentMemo(enrollment.id)
  const debt = enrollment.course.price - enrollment.totalPaid

  if (debt <= 0) {
    return { ok: false, code: 'PAID_FULL', message: 'Khoá đã đóng đủ' }
  }
  // Cho phép amount > debt nếu source=sepay (HV chuyển dư) — chỉ block manual
  if (input.source !== 'sepay' && input.amount > debt) {
    return { ok: false, code: 'OVERPAY', message: `Số tiền (${input.amount}) lớn hơn nợ còn (${debt})` }
  }

  // Nếu sepay overpay → ghi nhận full debt, dư ghi note
  const effectiveAmount = input.source === 'sepay' && input.amount > debt ? debt : input.amount
  const overpayNote = input.source === 'sepay' && input.amount > debt
    ? ` (HV chuyển dư ${(input.amount - debt).toLocaleString('vi-VN')}đ, ghi nhận đúng nợ)`
    : ''

  const action = input.source === 'sepay' ? 'sepay.confirm_enrollment' : 'enrollment.confirm_transfer'

  const result = await prisma.$transaction(async (tx) => {
    const newTotalPaid = enrollment.totalPaid + effectiveAmount
    const paidFull = newTotalPaid >= enrollment.course.price

    await tx.enrollment.update({
      where: { id: enrollment.id },
      data: {
        totalPaid: newTotalPaid,
        paymentDeadline: paidFull ? null : enrollment.paymentDeadline,
      }
    })

    if (paidFull && enrollment.student.status === 'enrolled') {
      await tx.student.update({
        where: { id: enrollment.studentId },
        data: { status: 'active' }
      })
    }

    const payment = await tx.payment.create({
      data: {
        studentId: enrollment.studentId,
        amount: effectiveAmount,
        type: 'course_fee',
        referenceType: 'enrollment',
        referenceId: enrollment.id,
        paymentMethod: 'bank_transfer',
        referenceNumber: input.referenceNumber || memo,
        recordedBy: input.recordedBy,
        notes: (input.notes || (input.source === 'sepay'
          ? `Sepay tự động xác nhận học phí ${enrollment.course.code}`
          : `Xác nhận chuyển khoản VietQR học phí ${enrollment.course.code}`)) + overpayNote,
      }
    })

    await tx.notification.create({
      data: {
        userId: enrollment.student.user.id,
        studentId: enrollment.studentId,
        senderId: input.recordedBy === 'system' ? null : input.recordedBy,
        type: 'general',
        title: input.source === 'sepay' ? '⚡ Tự động xác nhận học phí' : '✓ Đã xác nhận thanh toán học phí',
        body: paidFull
          ? `Lớp đã nhận ${effectiveAmount.toLocaleString('vi-VN')}đ — bạn đã đóng đủ học phí ${enrollment.course.name} 💙${overpayNote}`
          : `Lớp đã nhận ${effectiveAmount.toLocaleString('vi-VN')}đ học phí. Còn nợ ${(enrollment.course.price - newTotalPaid).toLocaleString('vi-VN')}đ.`,
        metadata: { paymentId: payment.id, enrollmentId: enrollment.id, paidFull, source: input.source ?? 'manual' },
      }
    })

    await tx.auditLog.create({
      data: {
        userId: input.recordedBy === 'system' ? null : input.recordedBy,
        role: input.recordedByRole,
        action,
        entityType: 'enrollment',
        entityId: enrollment.id,
        beforeData: { totalPaid: enrollment.totalPaid },
        afterData: { totalPaid: newTotalPaid, paidFull, paymentId: payment.id, memo, source: input.source ?? 'manual' },
      }
    })

    return { payment, paidFull }
  })

  if (enrollment.student.user.email && !enrollment.student.user.email.endsWith('@poolane.local')) {
    const tmpl = paymentReceiptEmail({
      fullName: enrollment.student.user.fullName,
      amount: effectiveAmount,
      type: `Học phí ${enrollment.course.name}`,
      paymentMethod: 'Chuyển khoản ngân hàng',
      recordedAt: new Date(),
      referenceNumber: input.referenceNumber || memo,
    })
    sendEmail({ to: enrollment.student.user.email, ...tmpl }).catch(() => {})
  }

  log.info('payment.confirm_enrollment', `Enrollment ${enrollment.id} +${effectiveAmount} via ${input.source ?? 'manual'}`, {
    paymentId: result.payment.id,
    paidFull: result.paidFull,
  })

  return { ok: true, paymentId: result.payment.id }
}
