import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { createPoolTicketSchema } from '@/lib/validations/enrollment'
import { POOL_TICKET } from '@/config/constants'

// ─── POST /api/pool-tickets — Tạo vé bơi ─────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])

    const body = await request.json()
    const parsed = createPoolTicketSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Thông tin không hợp lệ', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const { studentId, ticketType, pricePaid, totalSessions } = parsed.data

    // Kiểm tra student tồn tại
    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy học viên' } },
        { status: 404 }
      )
    }

    // Kiểm tra vé lần đầu
    if (ticketType === 'first') {
      const existingFirst = await prisma.poolTicket.findFirst({
        where: { studentId, ticketType: 'first' }
      })
      if (existingFirst) {
        return NextResponse.json(
          { data: null, error: { code: 'ALREADY_HAS_FIRST_TICKET', message: 'Học viên đã có vé bơi lần đầu' } },
          { status: 409 }
        )
      }
    }

    const sessions = totalSessions ?? POOL_TICKET.SESSIONS_INCLUDED
    const maxSessions = ticketType === 'first' ? POOL_TICKET.MAX_SESSIONS : sessions

    const ticket = await prisma.poolTicket.create({
      data: {
        studentId,
        ticketType,
        totalSessions: sessions,
        maxSessions,
        sessionsUsed: 0,
        pricePaid,
        isActive: true,
      }
    })

    // Ghi payment record
    await prisma.payment.create({
      data: {
        studentId,
        amount: pricePaid,
        type: 'pool_ticket',
        referenceType: 'pool_ticket',
        referenceId: ticket.id,
        paymentMethod: 'cash',
        recordedBy: user.id,
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'pool_ticket.create',
        entityType: 'pool_ticket',
        entityId: ticket.id,
        afterData: { studentId, ticketType, sessions, pricePaid }
      }
    })

    log.info('pool-tickets.create', `Created ${ticketType} ticket for student ${studentId}`, {
      ticketId: ticket.id,
      createdBy: user.id
    })

    return NextResponse.json(
      {
        data: {
          ...ticket,
          sessionsRemaining: ticket.maxSessions - ticket.sessionsUsed,
          isLowStock: (ticket.maxSessions - ticket.sessionsUsed) <= POOL_TICKET.LOW_STOCK_ALERT
        },
        error: null
      },
      { status: 201 }
    )

  } catch (error) {
    await logError({ context: 'pool-tickets.create', message: 'Failed to create pool ticket', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi tạo vé bơi' } },
      { status: 500 }
    )
  }
}

// ─── GET /api/pool-tickets — Vé bơi của học viên ─────────
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'staff'])

    const studentId = request.nextUrl.searchParams.get('studentId')
    if (!studentId) {
      return NextResponse.json(
        { data: null, error: { code: 'MISSING_PARAM', message: 'Thiếu studentId' } },
        { status: 400 }
      )
    }

    const tickets = await prisma.poolTicket.findMany({
      where: { studentId },
      orderBy: { purchasedAt: 'desc' }
    })

    const data = tickets.map(t => ({
      ...t,
      sessionsRemaining: t.maxSessions - t.sessionsUsed,
      isLowStock: (t.maxSessions - t.sessionsUsed) <= POOL_TICKET.LOW_STOCK_ALERT
    }))

    return NextResponse.json({ data, error: null })

  } catch (error) {
    await logError({ context: 'pool-tickets.list', message: 'Failed to fetch pool tickets', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
