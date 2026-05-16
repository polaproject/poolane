import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { registerSessionSchema } from '@/lib/validations/session'
import { getTicketAggregate } from '@/lib/ticket-aggregate'

type Params = { params: Promise<{ id: string }> }

// ─── GET /api/sessions/[id]/registrations ─────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireRole(['admin', 'staff'])
    const { id: sessionId } = await params

    const registrations = await prisma.sessionRegistration.findMany({
      where: { sessionId },
      orderBy: { registeredAt: 'asc' },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, phone: true } },
            enrollments: {
              where: { status: { in: ['active', 'extension'] } },
              include: { course: { select: { name: true, code: true } } }
            },
            poolTickets: {
              where: { isActive: true },
              orderBy: { purchasedAt: 'asc' },
              // Cần đủ field cho getTicketAggregate
              select: {
                id: true,
                ticketType: true,
                totalSessions: true,
                maxSessions: true,
                sessionsUsed: true,
                pricePaid: true,
                purchasedAt: true,
                isActive: true,
              }
            }
          }
        },
        course: { select: { name: true, code: true } }
      }
    })

    // Tính skill average cho context
    const enriched = await Promise.all(registrations.map(async (reg) => {
      const latestAssessment = await prisma.assessment.findFirst({
        where: { studentId: reg.studentId },
        orderBy: { assessmentDate: 'desc' },
        include: { scores: true }
      })

      const avgSkill = latestAssessment?.scores.length
        ? latestAssessment.scores.reduce((sum, s) => sum + s.score, 0) / latestAssessment.scores.length
        : null

      const ticketAgg = getTicketAggregate(reg.student.poolTickets)
      const sessionsLeft = ticketAgg.isNoTicket ? null : ticketAgg.sessionsLeft

      return {
        ...reg,
        context: {
          fullName: reg.student.user.fullName,
          phone: reg.student.user.phone,
          avgSkill: avgSkill ? Math.round(avgSkill * 10) / 10 : null,
          sessionsLeft,
          lastAttendedAt: reg.student.lastAttendedAt,
          activeEnrollments: reg.student.enrollments,
          isLowTicket: ticketAgg.isLow,
        }
      }
    }))

    return NextResponse.json({ data: enriched, error: null })

  } catch (error) {
    await logError({ context: 'registrations.list', message: 'Failed to fetch registrations', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}

// ─── POST /api/sessions/[id]/registrations — Học viên đăng ký
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])
    const { id: sessionId } = await params

    const body = await request.json()
    const parsed = registerSessionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Thông tin không hợp lệ' } },
        { status: 400 }
      )
    }

    const studentId = body.studentId || (
      user.role === 'student'
        ? (await prisma.student.findFirst({ where: { userId: user.id } }))?.id
        : null
    )

    if (!studentId) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ học viên' } },
        { status: 404 }
      )
    }

    // Kiểm tra buổi học tồn tại
    const session = await prisma.classSession.findUnique({ where: { id: sessionId } })
    if (!session || session.status === 'cancelled') {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Buổi học không tồn tại hoặc đã huỷ' } },
        { status: 404 }
      )
    }

    // Kiểm tra đã đăng ký chưa
    const existing = await prisma.sessionRegistration.findFirst({
      where: { sessionId, studentId, status: { not: 'withdrawn' } }
    })
    if (existing) {
      return NextResponse.json(
        { data: null, error: { code: 'ALREADY_REGISTERED', message: 'Học viên đã đăng ký buổi này' } },
        { status: 409 }
      )
    }

    // Validate HV có vé bơi đang hoạt động (defense in depth — UI cũng check
    // disable button, nhưng API check để admin/staff không bypass được)
    const activeTicket = await prisma.poolTicket.findFirst({
      where: { studentId, isActive: true },
      orderBy: { purchasedAt: 'desc' },
    })
    if (!activeTicket) {
      return NextResponse.json(
        { data: null, error: { code: 'NO_TICKET', message: 'Học viên chưa có vé bơi hoạt động. Vui lòng mua vé trước khi đăng ký buổi học.' } },
        { status: 400 }
      )
    }
    const sessionsLeft = activeTicket.maxSessions - activeTicket.sessionsUsed
    if (sessionsLeft <= 0) {
      return NextResponse.json(
        { data: null, error: { code: 'TICKET_EXHAUSTED', message: 'Vé bơi của học viên đã hết buổi. Vui lòng mua thêm vé.' } },
        { status: 400 }
      )
    }

    // Kiểm tra sức chứa để quyết định pending hay waitlist
    const approvedCount = await prisma.sessionRegistration.count({
      where: { sessionId, status: 'approved' }
    })
    const isFull = approvedCount >= session.capacity

    const registration = await prisma.sessionRegistration.create({
      data: {
        sessionId,
        studentId,
        courseId: parsed.data.courseId || null,
        status: isFull ? 'waitlist' : 'pending',
        registeredAt: new Date(),
      }
    })

    // Nếu vào waitlist, tính vị trí (FIFO: registeredAt sớm hơn = position thấp hơn)
    let waitlistPosition: number | null = null
    if (registration.status === 'waitlist') {
      waitlistPosition = await prisma.sessionRegistration.count({
        where: {
          sessionId,
          status: 'waitlist',
          registeredAt: { lte: registration.registeredAt },
        },
      })
    }

    log.info('registrations.create', `Student ${studentId} registered for session ${sessionId}`, {
      status: registration.status, registeredBy: user.id, waitlistPosition
    })

    return NextResponse.json(
      { data: { ...registration, waitlistPosition }, error: null },
      { status: 201 }
    )

  } catch (error) {
    await logError({ context: 'registrations.create', message: 'Failed to register', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
