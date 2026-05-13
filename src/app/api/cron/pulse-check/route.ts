import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron/auth'

// ─── GET /api/cron/pulse-check — Weekly Monday 6am ───
// Tạo danh sách HV cần follow-up cho admin
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  try {
    const now = Date.now()
    const red = new Date(now - 21 * 86400000)
    const yellow = new Date(now - 14 * 86400000)

    const [absentRed, absentYellow, lowTicket] = await Promise.all([
      // Đỏ: vắng > 21 ngày
      prisma.student.findMany({
        where: {
          status: { in: ['active', 'extension'] },
          lastAttendedAt: { lt: red },
        },
        include: { user: { select: { fullName: true } } },
        take: 30,
      }),
      // Vàng: vắng 14-21 ngày
      prisma.student.findMany({
        where: {
          status: { in: ['active', 'extension'] },
          lastAttendedAt: { lt: yellow, gte: red },
        },
        include: { user: { select: { fullName: true } } },
        take: 30,
      }),
      // Vé sắp hết (≤ 2)
      prisma.poolTicket.findMany({
        where: { isActive: true },
        include: { student: { include: { user: { select: { fullName: true } } } } },
        take: 30,
      }),
    ])

    const lowTicketStudents = lowTicket
      .filter(t => (t.maxSessions - t.sessionsUsed) <= 2)
      .slice(0, 30)

    // Tạo 1 notification tổng hợp cho mọi admin
    const admins = await prisma.user.findMany({
      where: { role: 'admin', isActive: true },
      select: { id: true }
    })

    const summary = [
      absentRed.length > 0 && `🔴 ${absentRed.length} HV vắng > 21 ngày`,
      absentYellow.length > 0 && `🟡 ${absentYellow.length} HV vắng 14-21 ngày`,
      lowTicketStudents.length > 0 && `🟢 ${lowTicketStudents.length} HV sắp hết vé`,
    ].filter(Boolean).join(' · ')

    if (summary && admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(a => ({
          userId: a.id,
          type: 'general',
          title: '📊 Pulse Check tuần này',
          body: summary,
          actionUrl: '/admin/pulse',
        }))
      })
    }

    log.info('cron.pulse_check', `Generated pulse check: ${summary}`)
    return NextResponse.json({
      data: {
        absentRed: absentRed.length,
        absentYellow: absentYellow.length,
        lowTicket: lowTicketStudents.length,
      },
      error: null
    })

  } catch (error) {
    await logError({ context: 'cron.pulse_check', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
