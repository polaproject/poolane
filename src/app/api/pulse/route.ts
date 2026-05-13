import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { ABSENCE_ALERT_THRESHOLDS, POOL_TICKET } from '@/config/constants'

// ─── GET /api/pulse — Pulse Check hàng tuần ─────────────
export async function GET() {
  try {
    await requireRole(['admin', 'staff'])

    const now = new Date()
    const yellowCutoff = new Date(now.getTime() - ABSENCE_ALERT_THRESHOLDS.YELLOW_DAYS * 86400000)
    const redCutoff    = new Date(now.getTime() - ABSENCE_ALERT_THRESHOLDS.RED_DAYS    * 86400000)

    // 🔴 Vắng > 21 ngày
    const redStudents = await prisma.student.findMany({
      where: {
        status: { in: ['active', 'extension', 'enrolled'] },
        OR: [
          { lastAttendedAt: { lt: redCutoff } },
          { lastAttendedAt: null, createdAt: { lt: redCutoff } },
        ]
      },
      include: {
        user: { select: { fullName: true, phone: true } },
        enrollments: {
          where: { status: { in: ['active', 'extension'] } },
          include: { course: { select: { name: true, code: true } } }
        },
        poolTickets: {
          where: { isActive: true },
          orderBy: { purchasedAt: 'desc' },
          take: 1,
          select: { sessionsUsed: true, maxSessions: true }
        }
      },
      take: 20
    })

    // 🟡 Vắng 14–21 ngày
    const yellowStudents = await prisma.student.findMany({
      where: {
        status: { in: ['active', 'extension', 'enrolled'] },
        OR: [
          { lastAttendedAt: { gte: redCutoff, lt: yellowCutoff } },
          { lastAttendedAt: null, createdAt: { gte: redCutoff, lt: yellowCutoff } }
        ]
      },
      include: {
        user: { select: { fullName: true, phone: true } },
        enrollments: {
          where: { status: { in: ['active', 'extension'] } },
          include: { course: { select: { name: true, code: true } } }
        },
        poolTickets: {
          where: { isActive: true },
          orderBy: { purchasedAt: 'desc' },
          take: 1,
          select: { sessionsUsed: true, maxSessions: true }
        }
      },
      take: 20
    })

    // 🟢 Vé bơi sắp hết (≤ 2 buổi)
    const lowTicketStudents = await prisma.poolTicket.findMany({
      where: {
        isActive: true,
        student: { status: { in: ['active', 'extension', 'enrolled'] } }
      },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, phone: true } }
          }
        }
      }
    }).then(tickets => tickets.filter(t => (t.maxSessions - t.sessionsUsed) <= POOL_TICKET.LOW_STOCK_ALERT))

    // Tiềm năng chưa được follow-up (> 3 ngày)
    const staleProspects = await prisma.student.findMany({
      where: {
        status: 'prospect',
        createdAt: { lt: new Date(now.getTime() - 3 * 86400000) }
      },
      include: {
        user: { select: { fullName: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Template tin nhắn soạn sẵn
    function makeAbsenceMsg(name: string, daysSince: number, urgency: 'red' | 'yellow'): string {
      if (urgency === 'red') {
        return `${name} ơi, lâu rồi không thấy bạn ở bể! Đã ${daysSince} ngày rồi đó. Bạn có ổn không? Mình vẫn giữ chỗ cho bạn nhé 🏊`
      }
      return `Ê ${name}, tuần này bạn có sắp xếp được không? Mình nhớ bạn rồi đó 😊 Đăng ký buổi học ngay nhé!`
    }

    function makeTicketMsg(name: string, remaining: number): string {
      return `${name} ơi, vé bơi của bạn còn ${remaining} buổi thôi! Nhớ sắp xếp mua thêm để không bị gián đoạn nhé 🌊`
    }

    const formatStudent = (s: typeof redStudents[0], urgency: 'red' | 'yellow') => {
      const daysSince = s.lastAttendedAt
        ? Math.floor((now.getTime() - s.lastAttendedAt.getTime()) / 86400000)
        : Math.floor((now.getTime() - s.createdAt.getTime()) / 86400000)

      const ticket = s.poolTickets[0]
      return {
        id: s.id,
        fullName: s.user.fullName,
        phone: s.user.phone,
        daysSince,
        lastAttendedAt: s.lastAttendedAt,
        enrollments: s.enrollments,
        sessionsLeft: ticket ? ticket.maxSessions - ticket.sessionsUsed : null,
        suggestedMessage: makeAbsenceMsg(s.user.fullName.split(' ').pop() ?? s.user.fullName, daysSince, urgency),
      }
    }

    return NextResponse.json({
      data: {
        generatedAt: now,
        red: redStudents.map(s => formatStudent(s, 'red')),
        yellow: yellowStudents.map(s => formatStudent(s, 'yellow')),
        lowTicket: lowTicketStudents.map(t => ({
          id: t.student.id,
          fullName: t.student.user.fullName,
          phone: t.student.user.phone,
          sessionsLeft: t.maxSessions - t.sessionsUsed,
          suggestedMessage: makeTicketMsg(
            t.student.user.fullName.split(' ').pop() ?? t.student.user.fullName,
            t.maxSessions - t.sessionsUsed
          ),
        })),
        staleProspects: staleProspects.map(s => ({
          id: s.id,
          fullName: s.user.fullName,
          phone: s.user.phone,
          daysSinceSignup: Math.floor((now.getTime() - s.createdAt.getTime()) / 86400000),
          suggestedMessage: `${s.user.fullName.split(' ').pop()} ơi, bạn đã tạo tài khoản tại Poolane rồi! Mình có thể hỗ trợ bạn đăng ký khoá học không? 🌊`,
        })),
        summary: {
          redCount: redStudents.length,
          yellowCount: yellowStudents.length,
          lowTicketCount: lowTicketStudents.length,
          staleProspectsCount: staleProspects.length,
        }
      },
      error: null
    })

  } catch (error) {
    await logError({ context: 'pulse.get', message: 'Failed to generate pulse check', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
