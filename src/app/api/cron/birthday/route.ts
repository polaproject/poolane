import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron/auth'
import { sendEmail } from '@/lib/email/client'
import { birthdayEmail } from '@/lib/email/templates'

// ─── GET /api/cron/birthday — Daily 6am ───
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  try {
    const today = new Date()
    const m = today.getMonth() + 1
    const d = today.getDate()

    // Query: dob có month+day khớp hôm nay
    // Prisma không có extract function trực tiếp → dùng raw SQL
    const users = await prisma.$queryRaw<Array<{ id: string; email: string; full_name: string }>>`
      SELECT id, email, full_name
      FROM users
      WHERE role = 'student' AND is_active = true
        AND dob IS NOT NULL
        AND EXTRACT(MONTH FROM dob) = ${m}
        AND EXTRACT(DAY FROM dob) = ${d}
    `

    let sent = 0
    for (const u of users) {
      // Tạo notification in-app
      await prisma.notification.create({
        data: {
          userId: u.id,
          type: 'birthday',
          title: '🎂 Chúc mừng sinh nhật!',
          body: `${u.full_name} ơi, lớp chúc bạn một tuổi mới thật khoẻ, thật bình yên!`,
        }
      })

      // Gửi email
      if (u.email && !u.email.endsWith('@poolane.local')) {
        const tmpl = birthdayEmail({ fullName: u.full_name })
        sendEmail({ to: u.email, ...tmpl }).catch(() => {})
      }
      sent++
    }

    log.info('cron.birthday', `Sent ${sent} birthday greetings`)
    return NextResponse.json({ data: { sent, total: users.length }, error: null })

  } catch (error) {
    await logError({ context: 'cron.birthday', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
