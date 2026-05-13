import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

type Params = { params: Promise<{ id: string }> }

// ─── PATCH /api/notifications/[id] — Đánh dấu đã đọc ─────
export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])
    const { id } = await params

    const notification = await prisma.notification.findFirst({
      where: { id, userId: user.id }
    })

    if (!notification) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy thông báo' } },
        { status: 404 }
      )
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() }
    })

    return NextResponse.json({ data: updated, error: null })

  } catch (error) {
    await logError({ context: 'notifications.read', message: 'Failed to mark as read', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}

// ─── POST /api/notifications/read-all ──────────────────────
// Đặt ở route riêng để tránh conflict
