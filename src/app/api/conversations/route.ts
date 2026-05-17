import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

const createConversationSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1).max(19),
  name: z.string().trim().min(1).max(80).optional(),
})

// ─── GET /api/conversations ────────────────────────────────
// Admin: thấy TẤT CẢ. Staff/student: chỉ thấy conversations mình là participant.
export async function GET() {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])

    // Admin xem tất cả; staff/student lọc qua participants
    const where = user.role === 'admin'
      ? {}
      : { participants: { some: { userId: user.id, leftAt: null } } }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        participants: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    })

    // Tính unreadCount: count messages where createdAt > myParticipation.lastReadAt
    const myParticipations = await prisma.conversationParticipant.findMany({
      where: {
        userId: user.id,
        leftAt: null,
        conversationId: { in: conversations.map(c => c.id) },
      },
      select: { conversationId: true, lastReadAt: true },
    })
    const lastReadMap = new Map(myParticipations.map(p => [p.conversationId, p.lastReadAt]))

    const unreadCounts = await Promise.all(
      conversations.map(async c => {
        const last = lastReadMap.get(c.id) ?? new Date(0)
        return prisma.chatMessage.count({
          where: {
            conversationId: c.id,
            senderId: { not: user.id },
            deletedAt: null,
            createdAt: { gt: last },
          },
        })
      }),
    )

    const result = conversations.map((c, i) => ({ ...c, unreadCount: unreadCounts[i] }))
    const totalUnread = unreadCounts.reduce((s, n) => s + n, 0)

    return NextResponse.json({ data: { conversations: result, totalUnread }, error: null })
  } catch (error) {
    await logError({ context: 'conversations.list', message: 'Failed to list conversations', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 },
    )
  }
}

// ─── POST /api/conversations ───────────────────────────────
// Body: { participantIds: string[], name?: string }
// - 1 participant + no name → DM (idempotent — trả existing DM nếu có)
// - 2+ participants HOẶC có name → group (name bắt buộc)
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_JSON', message: 'Dữ liệu không hợp lệ' } },
        { status: 400 },
      )
    }

    const parsed = createConversationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } },
        { status: 400 },
      )
    }

    // Dedupe + strip self
    const cleanIds = Array.from(new Set(parsed.data.participantIds)).filter(id => id !== user.id)
    if (cleanIds.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: 'EMPTY_PARTICIPANTS', message: 'Phải có ít nhất 1 người tham gia khác' } },
        { status: 400 },
      )
    }

    // Verify users exist + active
    const validCount = await prisma.user.count({
      where: { id: { in: cleanIds }, isActive: true },
    })
    if (validCount !== cleanIds.length) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_PARTICIPANT', message: 'Một số người tham gia không hợp lệ' } },
        { status: 400 },
      )
    }

    const isDM = cleanIds.length === 1 && !parsed.data.name

    // Nếu là group → name bắt buộc
    if (!isDM && !parsed.data.name) {
      return NextResponse.json(
        { data: null, error: { code: 'GROUP_NAME_REQUIRED', message: 'Vui lòng nhập tên nhóm' } },
        { status: 400 },
      )
    }

    // DM idempotency: tìm existing 2-người conversation
    if (isDM) {
      const candidates = await prisma.conversation.findMany({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId: user.id, leftAt: null } } },
            { participants: { some: { userId: cleanIds[0], leftAt: null } } },
          ],
        },
        include: {
          participants: {
            where: { leftAt: null },
            include: { user: { select: { id: true, fullName: true, role: true, avatarUrl: true } } },
          },
        },
      })
      const existing = candidates.find(c => c.participants.length === 2)
      if (existing) {
        return NextResponse.json({ data: { ...existing, unreadCount: 0 }, error: null })
      }
    }

    // Create new conversation
    const conversation = await prisma.$transaction(async tx => {
      const conv = await tx.conversation.create({
        data: {
          name: parsed.data.name ?? null,
          isGroup: !isDM,
          createdBy: user.id,
        },
      })
      await tx.conversationParticipant.createMany({
        data: [
          { conversationId: conv.id, userId: user.id, role: 'admin' },
          ...cleanIds.map(pid => ({ conversationId: conv.id, userId: pid, role: 'member' })),
        ],
      })
      return tx.conversation.findUnique({
        where: { id: conv.id },
        include: {
          participants: {
            where: { leftAt: null },
            include: { user: { select: { id: true, fullName: true, role: true, avatarUrl: true } } },
          },
        },
      })
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'conversation.create',
        entityType: 'conversation',
        entityId: conversation!.id,
        afterData: {
          name: conversation!.name,
          isGroup: conversation!.isGroup,
          participantIds: [user.id, ...cleanIds],
        },
      },
    }).catch(() => null)

    return NextResponse.json({ data: { ...conversation, unreadCount: 0 }, error: null })
  } catch (error) {
    await logError({ context: 'conversations.create', message: 'Failed to create conversation', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 },
    )
  }
}
