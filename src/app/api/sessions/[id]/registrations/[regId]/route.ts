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

    // Validate trạng thái hợp lệ cho từng action
    if (action === 'withdraw') {
      if (reg.status !== 'approved') {
        return NextResponse.json(
          { data: null, error: { code: 'INVALID_STATUS', message: 'Chỉ có thể rút HV đã được duyệt khỏi buổi học' } },
          { status: 400 }
        )
      }
    } else if (reg.status !== 'pending' && reg.status !== 'waitlist') {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_STATUS', message: 'Đăng ký này đã được xử lý' } },
        { status: 400 }
      )
    }

    const newStatus = action === 'approve' ? 'approved' : action === 'withdraw' ? 'withdrawn' : 'rejected'

    const updated = await prisma.sessionRegistration.update({
      where: { id: regId },
      data: {
        status: newStatus,
        rejectedReason: action === 'reject' ? rejectedReason : null,
        rejectedReasonText: action === 'reject' || action === 'withdraw' ? rejectedReasonText : null,
        decidedAt: new Date(),
        decidedBy: user.id,
      }
    })

    // Format ngày buổi học (để dùng trong notification text)
    const sessionDate = reg.session.date.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
    const slotLabel = reg.session.timeSlot === 'morning' ? 'sáng' : 'chiều'

    // Tạo thông báo cho học viên
    const notifMap = {
      approve: {
        type: 'approval',
        title: 'Đăng ký được duyệt! 🎉',
        body: `Tuyệt! Bạn đã có mặt trong danh sách ca học. Nhớ đến đúng giờ và mang theo đồ bơi nhé 🌊`,
      },
      reject: {
        type: 'rejection',
        title: 'Đăng ký không được duyệt',
        body: `Ca học này không thể duyệt bạn. Lý do: ${rejectedReasonText || rejectedReason || 'Không đủ điều kiện'}`,
      },
      withdraw: {
        type: 'cancellation',
        title: 'Bạn đã được rút khỏi buổi học',
        body: `Lớp đã rút bạn khỏi ca ${slotLabel} ngày ${sessionDate} để mở slot cho HV khác.${rejectedReasonText ? ` Ghi chú: ${rejectedReasonText}.` : ''} Nếu cần điều chỉnh, vui lòng liên hệ lớp nhé 💙`,
      },
    } as const
    const notif = notifMap[action]

    await prisma.notification.create({
      data: {
        userId: reg.student.userId,
        studentId: reg.studentId,
        senderId: user.id,
        type: notif.type,
        title: notif.title,
        body: notif.body,
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
