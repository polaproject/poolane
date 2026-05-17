import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

const createConversationSchema = z.object({
  studentId: z.string().uuid().optional(),
})

// ─── GET /api/conversations ────────────────────────────────
export async function GET(_req: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])

    if (user.role === 'student') {
      const student = await prisma.student.findFirst({ where: { userId: user.id } })
      if (!student) return NextResponse.json({ data: { conversations: [], totalUnread: 0 }, error: null })

      // Dùng _count để tránh N+1: count tin chưa đọc trong 1 query per conversation
      const conversations = await prisma.conversation.findMany({
        where: { studentId: student.id },
        include: {
          staffUser: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
          messages: {
            where: { senderId: { not: user.id }, readAt: null, deletedAt: null },
            select: { id: true }, // chỉ lấy count, không cần dữ liệu
          },
          _count: false, // sử dụng messages array length thay
        },
        orderBy: { lastMessageAt: 'desc' },
      })

      const totalUnread = conversations.reduce((sum, c) => sum + c.messages.length, 0)
      const withUnread = conversations.map(c => ({ ...c, unreadCount: c.messages.length, messages: undefined }))

      return NextResponse.json({ data: { conversations: withUnread, totalUnread }, error: null })
    }

    // admin / staff
    const where = user.role === 'admin' ? {} : { staffUserId: user.id }
    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        staffUser: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
        student: {
          include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
        },
        // Count tin chưa đọc cho mỗi conversation trong cùng query
        messages: {
          where: { senderId: { not: user.id }, readAt: null, deletedAt: null },
          select: { id: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    })

    const totalUnread = conversations.reduce((sum, c) => sum + c.messages.length, 0)
    const withUnread = conversations.map(c => ({ ...c, unreadCount: c.messages.length, messages: undefined }))

    return NextResponse.json({ data: { conversations: withUnread, totalUnread }, error: null })
  } catch (error) {
    await logError({ context: 'conversations.list', message: 'Failed to list conversations', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}

// ─── POST /api/conversations ───────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])

    // JSON parse với error handling
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_JSON', message: 'Dữ liệu không hợp lệ' } },
        { status: 400 }
      )
    }

    const parsed = createConversationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } },
        { status: 400 }
      )
    }

    let staffUserId: string
    let studentId: string

    if (user.role === 'student') {
      const student = await prisma.student.findFirst({ where: { userId: user.id } })
      if (!student) {
        return NextResponse.json(
          { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy học viên' } },
          { status: 404 }
        )
      }
      const admin = await prisma.user.findFirst({ where: { role: 'admin', isActive: true } })
      if (!admin) {
        return NextResponse.json(
          { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy quản trị viên' } },
          { status: 404 }
        )
      }
      staffUserId = admin.id
      studentId = student.id
    } else {
      if (!parsed.data.studentId) {
        return NextResponse.json(
          { data: null, error: { code: 'VALIDATION_ERROR', message: 'Cần chỉ định học viên' } },
          { status: 400 }
        )
      }
      // Validate student tồn tại
      const studentRecord = await prisma.student.findUnique({
        where: { id: parsed.data.studentId },
        select: { id: true },
      })
      if (!studentRecord) {
        return NextResponse.json(
          { data: null, error: { code: 'INVALID_STUDENT', message: 'Không tìm thấy học viên' } },
          { status: 400 }
        )
      }
      staffUserId = user.id
      studentId = parsed.data.studentId
    }

    const conversation = await prisma.conversation.upsert({
      where: { staffUserId_studentId: { staffUserId, studentId } },
      create: { staffUserId, studentId },
      update: {},
      include: {
        staffUser: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
        student: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'conversation.create',
        entityType: 'conversation',
        entityId: conversation.id,
        afterData: { staffUserId, studentId },
      },
    }).catch(() => null)

    return NextResponse.json({ data: conversation, error: null })
  } catch (error) {
    await logError({ context: 'conversations.create', message: 'Failed to create conversation', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
