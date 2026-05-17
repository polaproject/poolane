import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

// ─── GET /api/conversations/unread-count — Cho FAB badge ──
export async function GET() {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])

    if (user.role === 'student') {
      const student = await prisma.student.findFirst({ where: { userId: user.id } })
      if (!student) return NextResponse.json({ data: { count: 0 }, error: null })

      const count = await prisma.chatMessage.count({
        where: {
          conversation: { studentId: student.id },
          senderId: { not: user.id },
          readAt: null,
          deletedAt: null,
        },
      })
      return NextResponse.json({ data: { count }, error: null })
    }

    // admin/staff
    const where = user.role === 'admin' ? {} : { staffUserId: user.id }
    const count = await prisma.chatMessage.count({
      where: {
        conversation: where,
        senderId: { not: user.id },
        readAt: null,
        deletedAt: null,
      },
    })
    return NextResponse.json({ data: { count }, error: null })

  } catch (error) {
    await logError({ context: 'conversations.unread-count', message: 'Failed to count unread', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
