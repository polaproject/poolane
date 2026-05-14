import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { z } from 'zod'
import { buildEnrollmentMemo } from '@/lib/payments/vietqr'
import { sendEmail } from '@/lib/email/client'
import { paymentReceiptEmail } from '@/lib/email/templates'

const schema = z.object({
  enrollmentId: z.string().uuid(),
  amount: z.number().int().positive(),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(300).optional(),
})

// ─── POST /api/payments/confirm-enrollment-transfer ───
// Admin xác nhận đã nhận học phí qua chuyển khoản
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() } }, { status: 400 })
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: parsed.data.enrollmentId },
      include: {
        course: true,
        student: { include: { user: { select: { id: true, fullName: true, email: true } } } }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy khoá' } }, { status: 404 })
    }

    if (enrollment.status === 'cancelled' || enrollment.status === 'refunded') {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_STATUS', message: `Khoá ở trạng thái ${enrollment.status}` } },
        { status: 409 }
      )
    }

    const memo = buildEnrollmentMemo(enrollment.id)
    const debt = enrollment.course.price - enrollment.totalPaid

    if (parsed.data.amount > debt) {
      return NextResponse.json(
        { data: null, error: { code: 'OVERPAY', message: `Số tiền (${parsed.data.amount}) lớn hơn nợ còn (${debt})` } },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Enrollment totalPaid
      const newTotalPaid = enrollment.totalPaid + parsed.data.amount
      const paidFull = newTotalPaid >= enrollment.course.price

      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          totalPaid: newTotalPaid,
          paymentDeadline: paidFull ? null : enrollment.paymentDeadline,
        }
      })

      // 2. Nếu HV ở trạng thái 'enrolled' và đã đóng đủ → chuyển 'active'
      if (paidFull && enrollment.student.status === 'enrolled') {
        await tx.student.update({
          where: { id: enrollment.studentId },
          data: { status: 'active' }
        })
      }

      // 3. Tạo Payment record
      const payment = await tx.payment.create({
        data: {
          studentId: enrollment.studentId,
          amount: parsed.data.amount,
          type: 'course_fee',
          referenceType: 'enrollment',
          referenceId: enrollment.id,
          paymentMethod: 'bank_transfer',
          referenceNumber: parsed.data.referenceNumber || memo,
          recordedBy: user.id,
          notes: parsed.data.notes || `Xác nhận chuyển khoản VietQR học phí ${enrollment.course.code}`,
        }
      })

      // 4. Notification cho HV
      await tx.notification.create({
        data: {
          userId: enrollment.student.user.id,
          studentId: enrollment.studentId,
          senderId: user.id,
          type: 'general',
          title: '✓ Đã xác nhận thanh toán học phí',
          body: paidFull
            ? `Lớp đã nhận ${parsed.data.amount.toLocaleString('vi-VN')}đ — bạn đã đóng đủ học phí ${enrollment.course.name} 💙`
            : `Lớp đã nhận ${parsed.data.amount.toLocaleString('vi-VN')}đ học phí. Còn nợ ${(enrollment.course.price - newTotalPaid).toLocaleString('vi-VN')}đ.`,
          metadata: { paymentId: payment.id, enrollmentId: enrollment.id, paidFull },
        }
      })

      // 5. Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          role: user.role,
          action: 'enrollment.confirm_transfer',
          entityType: 'enrollment',
          entityId: enrollment.id,
          beforeData: { totalPaid: enrollment.totalPaid },
          afterData: { totalPaid: newTotalPaid, paidFull, paymentId: payment.id, memo },
        }
      })

      return { payment, paidFull, newTotalPaid }
    })

    // 6. Email biên lai
    if (enrollment.student.user.email && !enrollment.student.user.email.endsWith('@poolane.local')) {
      const tmpl = paymentReceiptEmail({
        fullName: enrollment.student.user.fullName,
        amount: parsed.data.amount,
        type: `Học phí ${enrollment.course.name}`,
        paymentMethod: 'Chuyển khoản ngân hàng',
        recordedAt: new Date(),
        referenceNumber: parsed.data.referenceNumber || memo,
      })
      sendEmail({ to: enrollment.student.user.email, ...tmpl }).catch(() => {})
    }

    log.info('payment.confirm_enrollment_transfer', `Enrollment ${enrollment.id} +${parsed.data.amount}`, {
      paymentId: result.payment.id,
      paidFull: result.paidFull,
      confirmedBy: user.id,
    })

    return NextResponse.json({
      data: {
        paymentId: result.payment.id,
        enrollmentId: enrollment.id,
        paidFull: result.paidFull,
        newTotalPaid: result.newTotalPaid
      },
      error: null
    })

  } catch (error) {
    await logError({ context: 'payment.confirm_enrollment_transfer', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
