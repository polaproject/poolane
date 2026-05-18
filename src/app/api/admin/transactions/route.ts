import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { createTransactionSchema } from '@/lib/validations/transaction'
import { POOL_TICKET } from '@/config/constants'

/**
 * POST /api/admin/transactions — Admin tạo giao dịch thủ công.
 *
 * Cho phép admin (CHỈ admin, không staff) tạo:
 *   - Payment record + tuỳ chọn `excludeFromRevenue` (carryover, compensation, fix)
 *   - PoolTicket record + tuỳ chọn `isCarryover` (HV cũ chưa nhập vé)
 *   - Hoặc cả 2 (bình thường: HV mua vé tại lớp, ghi nhận cash)
 *
 * Bắt buộc 1 trong 2 toggle ON. Notes bắt buộc cho audit traceability.
 * KHÔNG tạo Payment khi user toggle OFF → doanh thu KHÔNG bị ảnh hưởng.
 *
 * Tất cả wrap trong $transaction để PoolTicket + Payment + audit nhất quán.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin']) // STRICT admin (không staff)
    const body = await request.json()
    const parsed = createTransactionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      )
    }

    const { studentId, notes, payment, poolTicket } = parsed.data

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    })
    if (!student) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy học viên' } },
        { status: 404 },
      )
    }

    // Duplicate check 'first' ticket — same rule as legacy POST /api/pool-tickets
    if (poolTicket?.ticketType === 'first') {
      const exists = await prisma.poolTicket.findFirst({
        where: { studentId, ticketType: 'first' },
      })
      if (exists) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'ALREADY_HAS_FIRST_TICKET',
              message: 'Học viên đã có vé bơi lần đầu',
            },
          },
          { status: 409 },
        )
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      let createdTicket: { id: string; totalSessions: number; sessionsUsed: number; maxSessions: number; isCarryover: boolean } | null = null
      let createdPayment: { id: string; amount: number; type: string } | null = null

      if (poolTicket) {
        const ticket = await tx.poolTicket.create({
          data: {
            studentId,
            ticketType: poolTicket.ticketType,
            totalSessions: poolTicket.totalSessions,
            maxSessions:
              poolTicket.ticketType === 'first'
                ? POOL_TICKET.MAX_SESSIONS
                : poolTicket.totalSessions,
            sessionsUsed: poolTicket.sessionsUsedInitial,
            pricePaid: poolTicket.pricePaid,
            isActive: true,
            isCarryover: poolTicket.isCarryover,
          },
        })
        createdTicket = {
          id: ticket.id,
          totalSessions: ticket.totalSessions,
          sessionsUsed: ticket.sessionsUsed,
          maxSessions: ticket.maxSessions,
          isCarryover: ticket.isCarryover,
        }
      }

      if (payment) {
        const p = await tx.payment.create({
          data: {
            studentId,
            amount: payment.amount,
            type: payment.type,
            // Liên kết tới ticket nếu có để dễ trace
            referenceType: createdTicket ? 'pool_ticket' : null,
            referenceId: createdTicket?.id ?? null,
            paymentMethod: payment.paymentMethod,
            referenceNumber: payment.referenceNumber ?? null,
            recordedBy: user.id,
            notes,
            excludeFromRevenue: payment.excludeFromRevenue,
          },
        })
        createdPayment = { id: p.id, amount: p.amount, type: p.type }
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          role: 'admin',
          action: 'admin.manual_transaction',
          entityType: createdTicket ? 'pool_ticket' : 'payment',
          entityId: createdTicket?.id ?? createdPayment?.id ?? '',
          afterData: {
            studentId,
            notes,
            payment: payment
              ? {
                  amount: payment.amount,
                  type: payment.type,
                  paymentMethod: payment.paymentMethod,
                  excludeFromRevenue: payment.excludeFromRevenue,
                }
              : null,
            poolTicket: poolTicket
              ? {
                  ticketType: poolTicket.ticketType,
                  totalSessions: poolTicket.totalSessions,
                  sessionsUsedInitial: poolTicket.sessionsUsedInitial,
                  isCarryover: poolTicket.isCarryover,
                  pricePaid: poolTicket.pricePaid,
                }
              : null,
          },
        },
      })

      return { ticket: createdTicket, payment: createdPayment }
    })

    // Notification cho HV nếu tạo ticket
    if (result.ticket) {
      const remaining = result.ticket.maxSessions - result.ticket.sessionsUsed
      try {
        await prisma.notification.create({
          data: {
            userId: student.user.id,
            studentId,
            senderId: user.id,
            type: 'general',
            title: result.ticket.isCarryover
              ? '🎫 Lớp đã ghi nhận vé bơi của bạn'
              : '🎫 Vé bơi mới đã được tạo',
            body: `Lớp đã thêm vé ${result.ticket.totalSessions} buổi (đã dùng ${result.ticket.sessionsUsed}, còn ${remaining}). Vé có hiệu lực ngay.`,
            actionUrl: '/student/schedule',
            metadata: { ticketId: result.ticket.id, isCarryover: result.ticket.isCarryover },
          },
        })
      } catch (e) {
        log.warn('admin.transaction.notify', 'Failed to send notification', { err: String(e) })
      }
    }

    log.info('admin.transaction.create', `Created transaction for student ${studentId}`, {
      hasTicket: !!result.ticket,
      hasPayment: !!result.payment,
      excludeRevenue: payment?.excludeFromRevenue ?? false,
      adminId: user.id,
    })

    return NextResponse.json({ data: result, error: null }, { status: 201 })
  } catch (error) {
    await logError({
      context: 'admin.transaction.create',
      message: 'Failed to create manual transaction',
      error,
    })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 },
    )
  }
}
