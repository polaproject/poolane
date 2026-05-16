import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron/auth'
import { sendEmail } from '@/lib/email/client'
import { absenceReminderEmail } from '@/lib/email/templates'
import { getDemoStudentIds } from '@/lib/demo-account'

// ─── GET /api/cron/absence-reminder — Weekly ───
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  try {
    // HV vắng 14-21 ngày → cảnh báo vàng
    const since = new Date(Date.now() - 14 * 86400000)
    const until = new Date(Date.now() - 7 * 86400000)

    // Phase 15.2: Exclude demo accounts khỏi absence reminder
    const demoStudentIds = await getDemoStudentIds(prisma)

    const students = await prisma.student.findMany({
      where: {
        status: { in: ['active', 'extension'] },
        lastAttendedAt: { gte: since, lte: until },
        id: { notIn: demoStudentIds },
      },
      include: { user: { select: { fullName: true, email: true } } },
      take: 50,
    })

    let sent = 0
    for (const s of students) {
      const daysSince = Math.floor((Date.now() - (s.lastAttendedAt?.getTime() ?? Date.now())) / 86400000)

      await prisma.notification.create({
        data: {
          userId: s.userId,
          studentId: s.id,
          type: 'absence',
          title: '🌊 Lớp nhớ bạn',
          body: `Đã ${daysSince} ngày bạn chưa xuống nước. Quay lại khi sẵn sàng nhé!`,
          actionUrl: '/student/schedule',
        }
      })

      if (s.user.email && !s.user.email.endsWith('@poolane.local')) {
        const tmpl = absenceReminderEmail({ fullName: s.user.fullName, daysSince })
        sendEmail({ to: s.user.email, ...tmpl }).catch(() => {})
      }
      sent++
    }

    log.info('cron.absence', `Sent ${sent} absence reminders`)
    return NextResponse.json({ data: { sent }, error: null })

  } catch (error) {
    await logError({ context: 'cron.absence', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
