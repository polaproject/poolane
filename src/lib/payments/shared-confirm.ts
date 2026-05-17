// Shared logic cho confirm transfer — dùng bởi cả admin manual button + Sepay webhook
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { buildMemo, buildEnrollmentMemo } from '@/lib/payments/vietqr'
import { sendEmail } from '@/lib/email/client'
import { paymentReceiptEmail } from '@/lib/email/templates'
import { createPoolTicketsFromOrder } from '@/lib/payments/pool-ticket-from-order'

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

  // STRICT amount check (Phase 14.1) — chỉ áp cho Sepay automated webhook
  // VietQR cá nhân không lock được amount, user có thể sửa trước khi confirm chuyển.
  // Sepay webhook nhận amount thực → so với order.finalAmount → nếu khác = reject.
  // Admin manual confirm (source='manual') bypass check vì admin đã verify sao kê.
  if (input.source === 'sepay' && input.amount !== order.finalAmount) {
    log.warn('payment.confirm_order', `Sepay amount mismatch: ${input.amount} vs ${order.finalAmount}`, {
      orderId: order.id,
      transferAmount: input.amount,
      expectedAmount: order.finalAmount,
    })
    return {
      ok: false,
      code: 'AMOUNT_MISMATCH',
      message: `Số tiền chuyển khoản (${input.amount.toLocaleString('vi-VN')}đ) không khớp đơn hàng (${order.finalAmount.toLocaleString('vi-VN')}đ)`,
    }
  }

  const memo = buildMemo(order.id)
  const action = input.source === 'sepay' ? 'sepay.confirm_order' : 'order.confirm_transfer'

  let result: { payment: { id: string } }
  try {
    result = await prisma.$transaction(async (tx) => {
    // Compare-and-set: only update if status STILL 'approved' (race-safe).
    // Postgres serialize 2 concurrent UPDATE with WHERE clause → loser sees
    // count=0 và throw CONCURRENT_CONFIRMATION → toàn bộ $transaction rollback.
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: 'approved' },
      data: { status: 'paid' }
    })
    if (updated.count === 0) {
      throw new Error('CONCURRENT_CONFIRMATION')
    }

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

    // Auto-create PoolTicket cho item type='pool_ticket' (Phase 18.2 fix)
    await createPoolTicketsFromOrder(tx, {
      id: order.id,
      studentId: order.studentId,
      orderItems: order.orderItems.map(it => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        product: {
          type: it.product.type,
          sku: it.product.sku,
          sessionsCount: it.product.sessionsCount,
          name: it.product.name,
        },
      })),
    })

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
  } catch (e) {
    if (e instanceof Error && e.message === 'CONCURRENT_CONFIRMATION') {
      log.warn('payment.confirm_order', 'Concurrent confirm detected — already paid', { orderId: order.id })
      return { ok: false, code: 'CONCURRENT', message: 'Đơn đang được xử lý bởi giao dịch khác. Hãy refresh và kiểm tra trạng thái đơn.' }
    }
    throw e
  }

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

  let result: { payment: { id: string }; paidFull: boolean }
  try {
    result = await prisma.$transaction(async (tx) => {
    const newTotalPaid = enrollment.totalPaid + effectiveAmount
    const paidFull = newTotalPaid >= enrollment.course.price

    // Compare-and-set trên totalPaid: nếu txn khác đã cộng vào trong lúc ta đang
    // xử lý → totalPaid khác → updateMany count=0 → throw rollback.
    const updated = await tx.enrollment.updateMany({
      where: { id: enrollment.id, totalPaid: enrollment.totalPaid },
      data: {
        totalPaid: newTotalPaid,
        paymentDeadline: paidFull ? null : enrollment.paymentDeadline,
      }
    })
    if (updated.count === 0) {
      throw new Error('CONCURRENT_CONFIRMATION')
    }

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
  } catch (e) {
    if (e instanceof Error && e.message === 'CONCURRENT_CONFIRMATION') {
      log.warn('payment.confirm_enrollment', 'Concurrent confirm detected', { enrollmentId: enrollment.id })
      return { ok: false, code: 'CONCURRENT', message: 'Khoá đang được xử lý bởi giao dịch khác. Hãy refresh và kiểm tra trạng thái thanh toán.' }
    }
    throw e
  }

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
