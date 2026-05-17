import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

// ─── GET /api/conversations/unread-count ──────────────────
// Count messages chưa đọc qua participant.lastReadAt. Admin không là
// participant ở conv nào → count = 0 (admin xem qua /admin/messages page).
export async function GET() {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])

    const myParticipations = await prisma.conversationParticipant.findMany({
      where: { userId: user.id, leftAt: null },
      select: { conversationId: true, lastReadAt: true },
    })

    if (myParticipations.length === 0) {
      return NextResponse.json({ data: { count: 0 }, error: null })
    }

    const counts = await Promise.all(
      myParticipations.map(p =>
        prisma.chatMessage.count({
          where: {
            conversationId: p.conversationId,
            senderId: { not: user.id },
            deletedAt: null,
            ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
          },
        }),
      ),
    )

    const count = counts.reduce((s, n) => s + n, 0)
    return NextResponse.json({ data: { count }, error: null })
  } catch (error) {
    await logError({ context: 'conversations.unread-count', message: 'Failed to count unread', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 },
    )
  }
}
