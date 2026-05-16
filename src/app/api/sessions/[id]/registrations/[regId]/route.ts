import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { approveRegistrationSchema } from '@/lib/validations/session'

type Params = { params: Promise<{ id: string; regId: string }> }

// ─── PATCH /api/sessions/[id]/registrations/[regId] — Duyệt/từ chối
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const { id: sessionId, regId } = await params

    const body = await request.json()
    const parsed = approveRegistrationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } },
        { status: 400 }
      )
    }

    const { action, rejectedReason, rejectedReasonText } = parsed.data

    const reg = await prisma.sessionRegistration.findUnique({
      where: { id: regId },
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        session: true
      }
    })

    if (!reg || reg.sessionId !== sessionId) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy đăng ký' } },
        { status: 404 }
      )
    }

    if (reg.status !== 'pending' && reg.status !== 'waitlist') {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_STATUS', message: 'Đăng ký này đã được xử lý' } },
        { status: 400 }
      )
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    const updated = await prisma.sessionRegistration.update({
      where: { id: regId },
      data: {
        status: newStatus,
        rejectedReason: action === 'reject' ? rejectedReason : null,
        rejectedReasonText: action === 'reject' ? rejectedReasonText : null,
        decidedAt: new Date(),
        decidedBy: user.id,
      }
    })

    // Tạo thông báo cho học viên
    await prisma.notification.create({
      data: {
        userId: reg.student.userId,
        studentId: reg.studentId,
        senderId: user.id,
        type: action === 'approve' ? 'approval' : 'rejection',
        title: action === 'approve' ? 'Đăng ký được duyệt! 🎉' : 'Đăng ký không được duyệt',
        body: action === 'approve'
          ? `Tuyệt! Bạn đã có mặt trong danh sách ca học. Nhớ đến đúng giờ và mang theo đồ bơi nhé 🌊`
          : `Ca học này không thể duyệt bạn. Lý do: ${rejectedReasonText || rejectedReason || 'Không đủ điều kiện'}`,
        actionUrl: '/student/my-schedule',
        metadata: { sessionId, registrationId: regId, action }
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: `session_registration.${action}`,
        entityType: 'session_registration',
        entityId: regId,
        beforeData: { status: reg.status },
        afterData: { status: newStatus, decidedBy: user.id }
      }
    })

    log.info('registrations.decide', `${action}d registration ${regId}`, {
      studentId: reg.studentId,
      decidedBy: user.id
    })

    return NextResponse.json({ data: updated, error: null })

  } catch (error) {
    await logError({ context: 'registrations.decide', message: 'Failed to approve/reject', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
