import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

type Params = { params: Promise<{ id: string }> }

// ─── PATCH /api/conversations/[id]/resolve ─────────────────
// Admin/Staff đóng conversation (DM hoặc group). Block message sending sau đó.
export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff'])
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

    // Admin bypass; staff phải là participant
    if (user.role === 'staff') {
      const isParticipant = conv.participants.some(p => p.userId === user.id)
      if (!isParticipant) {
        return NextResponse.json(
          { data: null, error: { code: 'FORBIDDEN', message: 'Không có quyền' } },
          { status: 403 },
        )
      }
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { isResolved: true, resolvedAt: new Date(), resolvedBy: user.id },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'conversation.resolve',
        entityType: 'conversation',
        entityId: id,
        afterData: { isResolved: true, isGroup: conv.isGroup },
      },
    }).catch(() => null)

    return NextResponse.json({ data: { isResolved: updated.isResolved }, error: null })
  } catch (error) {
    await logError({ context: 'conversations.resolve', message: 'Failed to resolve', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 },
    )
  }
}
