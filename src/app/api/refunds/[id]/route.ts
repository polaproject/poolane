import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { processRefundSchema } from '@/lib/validations/payment'

type Params = { params: Promise<{ id: string }> }

// ─── PATCH /api/refunds/[id] — Xử lý yêu cầu hoàn tiền ───
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin'])
    const { id } = await params

    const body = await request.json()
    const parsed = processRefundSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } },
        { status: 400 }
      )
    }

    const { action, transferReference, processedNotes } = parsed.data

    const refund = await prisma.refundRequest.findUnique({
      where: { id },
      include: {
        student: { select: { userId: true } },
        enrollment: true,
        poolTicket: true
      }
    })

    if (!refund) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy yêu cầu hoàn tiền' } },
        { status: 404 }
      )
    }

    const validTransitions: Record<string, string[]> = {
      pending: ['approve', 'reject'],
      approved: ['transfer'],
    }

    if (!validTransitions[refund.status]?.includes(action)) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_TRANSITION', message: `Không thể ${action} từ trạng thái ${refund.status}` } },
        { status: 400 }
      )
    }

    const newStatus = action === 'approve' ? 'approved'
      : action === 'transfer' ? 'transferred'
      : 'rejected'

    const updated = await prisma.refundRequest.update({
      where: { id },
      data: {
        status: newStatus,
        processedAt: new Date(),
        processedBy: user.id,
        transferReference: action === 'transfer' ? transferReference : null,
        processedNotes: processedNotes || null,
      }
    })

    // Nếu đã chuyển tiền → cập nhật enrollment + pool ticket
    if (action === 'transfer') {
      if (refund.includeCourseRefund && refund.enrollmentId) {
        await prisma.enrollment.update({
          where: { id: refund.enrollmentId },
          data: { status: 'refunded' }
        })
        // Ghi âm payment
        await prisma.payment.create({
          data: {
            studentId: refund.studentId,
            amount: -refund.courseRefundAmount,
            type: 'refund',
            referenceType: 'refund_request',
            referenceId: id,
            paymentMethod: 'bank_transfer',
            referenceNumber: transferReference || undefined,
            recordedBy: user.id,
            notes: `Hoàn học phí - ${processedNotes || ''}`,
            isReversal: true,
          }
        })
      }

      if (refund.includeTicketRefund && refund.poolTicketId) {
        await prisma.poolTicket.update({
          where: { id: refund.poolTicketId },
          data: { isActive: false }
        })
        await prisma.payment.create({
          data: {
            studentId: refund.studentId,
            amount: -refund.ticketRefundAmount,
            type: 'refund',
            referenceType: 'refund_request',
            referenceId: id,
            paymentMethod: 'bank_transfer',
            referenceNumber: transferReference || undefined,
            recordedBy: user.id,
            notes: `Hoàn vé bơi - ${processedNotes || ''}`,
            isReversal: true,
          }
        })
      }

      // Cập nhật student status
      await prisma.student.update({
        where: { id: refund.studentId },
        data: { status: 'refunded' }
      })
    }

    // Thông báo cho học viên
    const notifBody = action === 'approve'
      ? `Yêu cầu hoàn tiền ${refund.totalRefundAmount.toLocaleString('vi-VN')}đ đã được duyệt. Chờ chuyển khoản nhé!`
      : action === 'transfer'
        ? `Đã chuyển khoản ${refund.totalRefundAmount.toLocaleString('vi-VN')}đ về tài khoản của bạn. Cảm ơn bạn đã học cùng Poolane 💙`
        : `Yêu cầu hoàn tiền không được chấp nhận. ${processedNotes || ''}`

    await prisma.notification.create({
      data: {
        userId: refund.student.userId,
        studentId: refund.studentId,
        type: 'general',
        title: action === 'transfer' ? '💸 Đã chuyển tiền hoàn' : action === 'approve' ? '✓ Yêu cầu hoàn tiền được duyệt' : 'Yêu cầu hoàn tiền',
        body: notifBody,
        metadata: { refundId: id, action, amount: refund.totalRefundAmount }
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: `refund.${action}`,
        entityType: 'refund_request',
        entityId: id,
        beforeData: { status: refund.status },
        afterData: { status: newStatus, transferReference }
      }
    })

    log.info('refunds.process', `${action}d refund ${id}`, {
      amount: refund.totalRefundAmount, processedBy: user.id
    })

    return NextResponse.json({ data: updated, error: null })

  } catch (error) {
    await logError({ context: 'refunds.process', message: 'Failed to process refund', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
