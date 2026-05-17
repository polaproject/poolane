import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { checkChatRateLimit } from '@/lib/rate-limit'

type Params = { params: Promise<{ id: string }> }

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
})

const ACTION_URL_BY_ROLE: Record<string, string> = {
  admin: '/admin/messages',
  staff: '/staff/messages',
  student: '/student/messages',
}

/** Verify caller là participant — admin bypass. Trả conv (include participants) hoặc null. */
async function verifyAccess(conversationId: string, userId: string, userRole: string) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        where: { leftAt: null },
        include: { user: { select: { id: true, role: true } } },
      },
    },
  })
  if (!conv) return null
  if (userRole === 'admin') return conv
  const isParticipant = conv.participants.some(p => p.userId === userId)
  return isParticipant ? conv : null
}

// ─── GET /api/conversations/[id]/messages ─────────────────
// Response: { messages, participants } — participants chứa lastReadAt cho
// read receipt nhóm "Đã xem bởi N/M".
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])
    const { id } = await params

    const conv = await verifyAccess(id, user.id, user.role)
    if (!conv) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy cuộc hội thoại' } },
        { status: 404 },
      )
    }

    const afterParam = request.nextUrl.searchParams.get('after')
    let afterDate: Date | null = null
    if (afterParam) {
      const d = new Date(afterParam)
      afterDate = isNaN(d.getTime()) ? null : d
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId: id,
        deletedAt: null,
        ...(afterDate ? { createdAt: { gt: afterDate } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: afterDate ? 100 : 50,
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
      },
    })

    // Participants với lastReadAt — cho ChatThread compute "Đã xem bởi N/M"
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId: id, leftAt: null },
      select: { userId: true, lastReadAt: true },
    })

    return NextResponse.json({ data: { messages, participants }, error: null })
  } catch (error) {
    await logError({ context: 'conversations.messages.list', message: 'Failed to fetch messages', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 },
    )
  }
}

// ─── POST /api/conversations/[id]/messages ────────────────
// Rate limit 5 msg/10s cho student. Broadcast notification tới ALL participants
// (trừ sender).
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])
    const { id } = await params

    const conv = await verifyAccess(id, user.id, user.role)
    if (!conv) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy cuộc hội thoại' } },
        { status: 404 },
      )
    }

    if (conv.isResolved) {
      return NextResponse.json(
        { data: null, error: { code: 'RESOLVED', message: 'Cuộc hội thoại đã đóng' } },
        { status: 400 },
      )
    }

    // Rate limit BEFORE parsing body — sớm hơn = nhẹ DB hơn khi spam
    const rl = await checkChatRateLimit(user.id, user.role)
    if (!rl.allowed) {
      return NextResponse.json(
        {
          data: null,
          error: { code: 'RATE_LIMITED', message: `Bạn gửi quá nhanh, vui lòng đợi ${rl.retryAfterSec}s` },
        },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_JSON', message: 'Dữ liệu không hợp lệ' } },
        { status: 400 },
      )
    }

    const parsed = sendMessageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Nội dung tin nhắn không hợp lệ' } },
        { status: 400 },
      )
    }

    const [message] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          conversationId: id,
          senderId: user.id,
          senderRole: user.role,
          content: parsed.data.content,
        },
        include: {
          sender: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
        },
      }),
      prisma.conversation.update({
        where: { id },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: parsed.data.content.slice(0, 100),
        },
      }),
    ])

    // Broadcast notification tới TẤT CẢ participants khác (trừ sender)
    const recipients = conv.participants.filter(p => p.userId !== user.id).map(p => p.userId)
    if (recipients.length > 0) {
      const recipientUsers = await prisma.user.findMany({
        where: { id: { in: recipients }, isActive: true },
        select: { id: true, role: true },
      })
      const groupSuffix = conv.isGroup && conv.name
        ? ` trong "${conv.name}"`
        : conv.isGroup
          ? ' trong nhóm'
          : ''

      await prisma.notification.createMany({
        data: recipientUsers.map(r => ({
          userId: r.id,
          senderId: user.id,
          type: 'general',
          title: `${user.fullName} đã nhắn tin${groupSuffix}`,
          body: parsed.data.content.slice(0, 80),
          actionUrl: ACTION_URL_BY_ROLE[r.role] ?? '/shared/notifications',
          metadata: { conversationId: id, chatMessage: true, isGroup: conv.isGroup },
        })),
      }).catch(() => null)
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'chat_message.send',
        entityType: 'chat_message',
        entityId: message.id,
        afterData: { conversationId: id, contentLength: parsed.data.content.length, isGroup: conv.isGroup },
      },
    }).catch(() => null)

    return NextResponse.json({ data: { message }, error: null }, { status: 201 })
  } catch (error) {
    await logError({ context: 'conversations.messages.send', message: 'Failed to send message', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 },
    )
  }
}
