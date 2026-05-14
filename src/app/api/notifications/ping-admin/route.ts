import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { z } from 'zod'

const schema = z.object({
  title: z.string().max(200),
  body: z.string().max(500),
  actionUrl: z.string().optional(),
})

// ─── POST /api/notifications/ping-admin ───
// HV gửi yêu cầu admin chú ý (vd: đã chuyển khoản, cần xác nhận)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR' } }, { status: 400 })
    }

    const admins = await prisma.user.findMany({
      where: { role: { in: ['admin', 'staff'] }, isActive: true },
      select: { id: true }
    })

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(a => ({
          userId: a.id,
          senderId: user.id,
          type: 'general',
          title: parsed.data.title,
          body: parsed.data.body,
          actionUrl: parsed.data.actionUrl,
        }))
      })
    }

    return NextResponse.json({ data: { sent: admins.length }, error: null })
  } catch (error) {
    await logError({ context: 'notifications.ping_admin', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
