import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

type Params = { params: Promise<{ id: string }> }

// ─── PATCH /api/conversations/[id]/read ───────────────────
// Mark đã đọc — update participant.lastReadAt + ChatMessage.readAt (legacy DM compat)
export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])
    const { id } = await params

    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: { participants: { where: { leftAt: null }, select: { userId: true } } },
    })
    if (!conv) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy cuộc hội thoại' } },
        { status: 404 },
      )
    }

    const isParticipant = conv.participants.some(p => p.userId === user.id)
    if (!isParticipant && user.role !== 'admin') {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Không có quyền truy cập' } },
        { status: 403 },
      )
    }

    // Update participant.lastReadAt (cho group read receipt "Đã xem bởi N/M")
    const now = new Date()
    if (isParticipant) {
      await prisma.conversationParticipant.updateMany({
        where: { conversationId: id, userId: user.id, leftAt: null },
        data: { lastReadAt: now },
      })
    }

    // Update ChatMessage.readAt (cho DM visual single/double tick — giữ logic Phase 19)
    const result = await prisma.chatMessage.updateMany({
      where: {
        conversationId: id,
        senderId: { not: user.id },
        readAt: null,
        deletedAt: null,
      },
      data: { readAt: now },
    })

    return NextResponse.json({ data: { updated: result.count }, error: null })
  } catch (error) {
    await logError({ context: 'conversations.read', message: 'Failed to mark as read', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 },
    )
  }
}
