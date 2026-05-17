import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

type Params = { params: Promise<{ id: string }> }

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
})

/** Verify caller là participant — trả null nếu không tồn tại HOẶC không có quyền */
async function verifyAccess(conversationId: string, userId: string, userRole: string) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      student: {
        select: {
          userId: true,
          user: { select: { id: true } }, // guard: xác nhận user record vẫn tồn tại
        },
      },
    },
  })
  if (!conv) return null
  // Student side: cần student record + user vẫn active
  if (!conv.student?.user) return null

  if (userRole === 'admin') return conv
  if (conv.staffUserId === userId) return conv
  if (conv.student.userId === userId) return conv
  return null
}

// ─── GET /api/conversations/[id]/messages ─────────────────
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])
    const { id } = await params

    const conv = await verifyAccess(id, user.id, user.role)
    if (!conv) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy cuộc hội thoại' } },
        { status: 404 }
      )
    }

    const afterParam = request.nextUrl.searchParams.get('after')
    // Validate ISO date — Invalid Date → null → fallback to last 50
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

    return NextResponse.json({ data: { messages }, error: null })
  } catch (error) {
    await logError({ context: 'conversations.messages.list', message: 'Failed to fetch messages', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}

// ─── POST /api/conversations/[id]/messages ────────────────
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])
    const { id } = await params

    const conv = await verifyAccess(id, user.id, user.role)
    if (!conv) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy cuộc hội thoại' } },
        { status: 404 }
      )
    }

    if (conv.isResolved) {
      return NextResponse.json(
        { data: null, error: { code: 'RESOLVED', message: 'Cuộc hội thoại đã đóng' } },
        { status: 400 }
      )
    }

    // JSON parse với error handling rõ ràng
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_JSON', message: 'Dữ liệu không hợp lệ' } },
        { status: 400 }
      )
    }

    const parsed = sendMessageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Nội dung tin nhắn không hợp lệ' } },
        { status: 400 }
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

    // Gửi notification cho đối phương — fire-and-forget, không block response
    const isStudent = user.role === 'student'
    const recipientUserId = isStudent ? conv.staffUserId : conv.student.userId
    const actionUrl = isStudent ? '/admin/messages' : '/student/messages'

    // Xác nhận recipient vẫn tồn tại trước khi tạo notification
    const recipientExists = await prisma.user.findUnique({
      where: { id: recipientUserId },
      select: { id: true },
    })
    if (recipientExists) {
      await prisma.notification.create({
        data: {
          userId: recipientUserId,
          senderId: user.id,
          type: 'general',
          title: `${user.fullName} đã nhắn tin`,
          body: parsed.data.content.slice(0, 80),
          actionUrl,
          metadata: { conversationId: id, chatMessage: true },
        },
      }).catch(() => null) // notification fail không block
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'chat_message.send',
        entityType: 'chat_message',
        entityId: message.id,
        afterData: { conversationId: id, contentLength: parsed.data.content.length },
      },
    }).catch(() => null)

    return NextResponse.json({ data: { message }, error: null }, { status: 201 })
  } catch (error) {
    await logError({ context: 'conversations.messages.send', message: 'Failed to send message', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
