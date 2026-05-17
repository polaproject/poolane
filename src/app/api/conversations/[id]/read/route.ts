import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

type Params = { params: Promise<{ id: string }> }

// ─── PATCH /api/conversations/[id]/read — Đánh dấu đã đọc ─
export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])
    const { id } = await params

    // Verify access
    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: { student: { select: { userId: true } } },
    })
    if (!conv) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy cuộc hội thoại' } },
        { status: 404 }
      )
    }
    const isParticipant =
      user.role === 'admin' ||
      conv.staffUserId === user.id ||
      conv.student.userId === user.id
    if (!isParticipant) {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Không có quyền truy cập' } },
        { status: 403 }
      )
    }

    const result = await prisma.chatMessage.updateMany({
      where: {
        conversationId: id,
        senderId: { not: user.id },
        readAt: null,
        deletedAt: null,
      },
      data: { readAt: new Date() },
    })

    return NextResponse.json({ data: { updated: result.count }, error: null })

  } catch (error) {
    await logError({ context: 'conversations.read', message: 'Failed to mark as read', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
