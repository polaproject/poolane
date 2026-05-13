import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { cancelSessionSchema } from '@/lib/validations/session'

type Params = { params: Promise<{ id: string }> }

// ─── POST /api/sessions/[id]/cancel — Huỷ ca khẩn cấp ───
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const { id: sessionId } = await params

    const body = await request.json()
    const parsed = cancelSessionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Vui lòng nhập lý do huỷ' } },
        { status: 400 }
      )
    }

    const { reason } = parsed.data

    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        registrations: {
          where: { status: 'approved' },
          include: {
            student: { select: { userId: true } }
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy buổi học' } },
        { status: 404 }
      )
    }

    if (session.status === 'cancelled') {
      return NextResponse.json(
        { data: null, error: { code: 'ALREADY_CANCELLED', message: 'Buổi học đã bị huỷ trước đó' } },
        { status: 400 }
      )
    }

    // 1. Huỷ buổi học
    const cancelled = await prisma.classSession.update({
      where: { id: sessionId },
      data: {
        status: 'cancelled',
        cancelledReason: reason,
        cancelledBy: user.id,
        cancelledAt: new Date(),
      }
    })

    // 2. Hoàn lại 1 buổi vé cho học viên đã được duyệt
    const restoredStudents: string[] = []
    for (const reg of session.registrations) {
      const activeTicket = await prisma.poolTicket.findFirst({
        where: { studentId: reg.studentId, isActive: true },
        orderBy: { purchasedAt: 'desc' }
      })

      if (activeTicket && activeTicket.sessionsUsed > 0) {
        await prisma.poolTicket.update({
          where: { id: activeTicket.id },
          data: {
            sessionsUsed: { decrement: 1 },
            isActive: true // Reactivate nếu đã bị deactivate
          }
        })
        restoredStudents.push(reg.studentId)
      }

      // Thông báo cho học viên
      await prisma.notification.create({
        data: {
          userId: reg.student.userId,
          studentId: reg.studentId,
          type: 'cancellation',
          title: 'Ca học hôm nay bị huỷ',
          body: `Xin lỗi bạn nha! ${reason}. Buổi vé của bạn đã được cộng lại. Hẹn gặp buổi sau! 💙`,
          metadata: { sessionId, reason }
        }
      })
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'session.cancel',
        entityType: 'class_session',
        entityId: sessionId,
        beforeData: { status: session.status },
        afterData: { status: 'cancelled', reason, notifiedStudents: session.registrations.length }
      }
    })

    log.warn('sessions.cancel', `Cancelled session ${sessionId}`, {
      reason, notified: session.registrations.length, restored: restoredStudents.length,
      cancelledBy: user.id
    })

    return NextResponse.json({
      data: {
        session: cancelled,
        notifiedCount: session.registrations.length,
        restoredTicketsCount: restoredStudents.length,
      },
      error: null
    })

  } catch (error) {
    await logError({ context: 'sessions.cancel', message: 'Failed to cancel session', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi huỷ buổi học' } },
      { status: 500 }
    )
  }
}
