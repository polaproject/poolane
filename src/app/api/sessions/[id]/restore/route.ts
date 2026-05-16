import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'

type Params = { params: Promise<{ id: string }> }

/**
 * POST /api/sessions/[id]/restore — Mở lại buổi học đã bị huỷ.
 *
 * Logic:
 *  - status: cancelled → scheduled
 *  - Clear cancelledReason / cancelledBy / cancelledAt
 *  - Notify HV đã từng có registration approved/pending (status registration giữ nguyên)
 *  - KHÔNG touch pool_tickets (cancel route đã hoàn vé; restore không assume HV vẫn muốn dùng)
 *  - Audit log
 *
 * Lý do KHÔNG auto-trừ vé lại khi restore:
 *  - Sau khi cancel + hoàn vé, HV có thể đã dùng vé đó cho buổi khác
 *  - Nếu force trừ → có thể làm âm vé. Để attendance flow xử lý khi HV thực sự đến học.
 */
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const { id: sessionId } = await params

    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        registrations: {
          where: { status: { in: ['approved', 'pending'] } },
          include: {
            student: { select: { userId: true, id: true } },
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy buổi học' } },
        { status: 404 }
      )
    }

    if (session.status !== 'cancelled') {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_STATUS',
            message: `Chỉ mở lại được buổi đã huỷ (hiện tại: ${session.status})`,
          },
        },
        { status: 400 }
      )
    }

    // 1. Restore session
    const restored = await prisma.classSession.update({
      where: { id: sessionId },
      data: {
        status: 'scheduled',
        cancelledReason: null,
        cancelledBy: null,
        cancelledAt: null,
      },
    })

    // 2. Notify HV
    for (const reg of session.registrations) {
      await prisma.notification.create({
        data: {
          userId: reg.student.userId,
          studentId: reg.studentId,
          type: 'general',
          title: 'Buổi học đã được mở lại',
          body: `Lớp đã mở lại buổi học bị huỷ trước đó. Bạn vẫn ở danh sách ${reg.status === 'approved' ? 'đã duyệt' : 'chờ duyệt'}. Hẹn gặp bạn nhé! 🌊`,
          actionUrl: '/student/my-schedule',
          metadata: { sessionId, restoredFrom: 'cancelled' },
        },
      })
    }

    // 3. Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'session.restore',
        entityType: 'class_session',
        entityId: sessionId,
        beforeData: { status: 'cancelled' },
        afterData: {
          status: 'scheduled',
          notifiedStudents: session.registrations.length,
        },
      },
    })

    log.info('sessions.restore', `Restored session ${sessionId}`, {
      notified: session.registrations.length,
      restoredBy: user.id,
    })

    return NextResponse.json({
      data: {
        session: restored,
        notifiedCount: session.registrations.length,
      },
      error: null,
    })
  } catch (error) {
    await logError({ context: 'sessions.restore', message: 'Failed to restore session', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi mở lại buổi học' } },
      { status: 500 }
    )
  }
}
