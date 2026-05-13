import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { createRefundSchema } from '@/lib/validations/payment'
import { COURSE_REFUND_TIERS, POOL_TICKET, REFUND_DEADLINE_DAYS } from '@/config/constants'

// Tính số tiền hoàn học phí theo bậc
function calcCourseRefund(coursePrice: number, sessionsAttended: number): { rate: number; amount: number } {
  const tier = COURSE_REFUND_TIERS.find(
    t => sessionsAttended >= t.minSessions && sessionsAttended <= t.maxSessions
  ) ?? COURSE_REFUND_TIERS[COURSE_REFUND_TIERS.length - 1]

  return {
    rate: tier.rate,
    amount: Math.floor(coursePrice * tier.rate)
  }
}

// Tính số tiền hoàn vé bơi
function calcTicketRefund(sessionsUsed: number, totalSessions: number): number {
  // Chỉ tính 10 buổi gốc (bonus 11-12 không tính)
  const countableSessions = Math.min(totalSessions, 10)
  const remaining = Math.max(0, countableSessions - sessionsUsed)
  return Math.floor(remaining * POOL_TICKET.PER_SESSION_VALUE * POOL_TICKET.REFUND_RATE)
}

// ─── POST /api/refunds — Tạo yêu cầu hoàn tiền ────────────
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])

    const body = await request.json()
    const parsed = createRefundSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Thông tin không hợp lệ', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const input = parsed.data

    // Kiểm tra thời hạn 30 ngày
    const student = await prisma.student.findUnique({
      where: { id: input.studentId },
      select: { lastAttendedAt: true, userId: true }
    })

    if (student?.lastAttendedAt) {
      const daysSince = Math.floor((Date.now() - student.lastAttendedAt.getTime()) / 86400000)
      if (daysSince > REFUND_DEADLINE_DAYS) {
        return NextResponse.json(
          { data: null, error: { code: 'DEADLINE_PASSED', message: `Đã quá ${REFUND_DEADLINE_DAYS} ngày kể từ buổi học cuối. Không thể yêu cầu hoàn tiền.` } },
          { status: 400 }
        )
      }
    }

    let courseRefundAmount = 0
    let courseRefundRate = 0
    let courseSessionsAttended = 0
    let ticketRefundAmount = 0
    let ticketSessionsUsed = 0

    // Tính hoàn học phí
    if (input.includeCourseRefund && input.enrollmentId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: input.enrollmentId },
        include: { course: true }
      })

      if (!enrollment) {
        return NextResponse.json(
          { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy khoá học' } },
          { status: 404 }
        )
      }

      // Đếm số buổi đã học
      const attendedCount = await prisma.attendance.count({
        where: { studentId: input.studentId, status: 'present' }
      })

      courseSessionsAttended = attendedCount
      const { rate, amount } = calcCourseRefund(enrollment.totalPaid, attendedCount)
      courseRefundRate = rate
      courseRefundAmount = amount
    }

    // Tính hoàn vé bơi
    if (input.includeTicketRefund && input.poolTicketId) {
      const ticket = await prisma.poolTicket.findUnique({
        where: { id: input.poolTicketId }
      })

      if (!ticket) {
        return NextResponse.json(
          { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy vé bơi' } },
          { status: 404 }
        )
      }

      ticketSessionsUsed = ticket.sessionsUsed
      ticketRefundAmount = calcTicketRefund(ticket.sessionsUsed, ticket.totalSessions)
    }

    const totalRefundAmount = courseRefundAmount + ticketRefundAmount

    const refund = await prisma.refundRequest.create({
      data: {
        studentId: input.studentId,
        enrollmentId: input.enrollmentId || null,
        poolTicketId: input.poolTicketId || null,
        includeCourseRefund: input.includeCourseRefund,
        includeTicketRefund: input.includeTicketRefund,
        courseSessionsAttended,
        courseRefundRate,
        courseRefundAmount,
        ticketSessionsUsed,
        ticketRefundAmount,
        totalRefundAmount,
        reason: input.reason,
        reasonText: input.reasonText || null,
        status: 'pending',
        requestedBy: user.id,
      }
    })

    // Thông báo cho admin
    log.info('refunds.create', `Refund request created for student ${input.studentId}`, {
      total: totalRefundAmount, requestedBy: user.id
    })

    return NextResponse.json({
      data: {
        ...refund,
        breakdown: {
          courseRefundAmount,
          courseRefundRate,
          courseSessionsAttended,
          ticketRefundAmount,
          ticketSessionsUsed,
          totalRefundAmount
        }
      },
      error: null
    }, { status: 201 })

  } catch (error) {
    await logError({ context: 'refunds.create', message: 'Failed to create refund', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}

// ─── GET /api/refunds — Danh sách yêu cầu hoàn tiền ───────
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin'])

    const status = request.nextUrl.searchParams.get('status')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = status ? { status } : {}

    const refunds = await prisma.refundRequest.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      include: {
        student: {
          include: { user: { select: { fullName: true, phone: true } } }
        },
        enrollment: { include: { course: { select: { name: true } } } },
        poolTicket: { select: { ticketType: true, sessionsUsed: true } }
      }
    })

    return NextResponse.json({ data: refunds, error: null })

  } catch (error) {
    await logError({ context: 'refunds.list', message: 'Failed to fetch refunds', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
