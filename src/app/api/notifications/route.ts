import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

// ─── GET /api/notifications — Danh sách thông báo ─────────
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])

    const unreadOnly = request.nextUrl.searchParams.get('unread') === 'true'
    const where: Parameters<typeof prisma.notification.findMany>[0]['where'] = {
      userId: user.id,
      ...(unreadOnly ? { readAt: null } : {})
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.notification.count({ where: { userId: user.id, readAt: null } })
    ])

    return NextResponse.json({ data: { notifications, unreadCount }, error: null })

  } catch (error) {
    await logError({ context: 'notifications.list', message: 'Failed to fetch notifications', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}

// ─── POST /api/notifications — Broadcast (admin only) ─────
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])

    const { title, body, targetType, targetStudentIds } = await request.json()

    if (!title || !body) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Cần có tiêu đề và nội dung' } },
        { status: 400 }
      )
    }

    // Lấy danh sách user cần gửi
    let userIds: string[] = []

    if (targetType === 'all') {
      const students = await prisma.student.findMany({
        where: { status: { in: ['active', 'extension', 'enrolled'] } },
        select: { userId: true, id: true }
      })
      userIds = students.map(s => s.userId)
    } else if (targetType === 'specific' && targetStudentIds?.length > 0) {
      const students = await prisma.student.findMany({
        where: { id: { in: targetStudentIds } },
        select: { userId: true }
      })
      userIds = students.map(s => s.userId)
    }

    if (userIds.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: 'NO_RECIPIENTS', message: 'Không có người nhận' } },
        { status: 400 }
      )
    }

    // Tạo notifications
    await prisma.notification.createMany({
      data: userIds.map(uid => ({
        userId: uid,
        senderId: user.id,
        type: 'general',
        title,
        body,
        metadata: { broadcast: true, sentBy: user.id }
      }))
    })

    return NextResponse.json({
      data: { sent: userIds.length },
      error: null
    })

  } catch (error) {
    await logError({ context: 'notifications.broadcast', message: 'Failed to broadcast', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
