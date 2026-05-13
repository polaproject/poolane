import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { resetPasswordSchema } from '@/lib/validations/auth'
import { createAdminClient } from '@/lib/supabase/server'

// Generate temp password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz'
  let pw = 'Pola@'
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)]
  return pw
}

// ─── POST /api/auth/reset-password — Admin reset, trả về temp password ───
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])

    const body = await request.json()
    const parsed = resetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } },
        { status: 400 }
      )
    }

    const req = await prisma.passwordResetRequest.findUnique({ where: { id: parsed.data.requestId } })
    if (!req) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy yêu cầu' } },
        { status: 404 }
      )
    }
    if (req.status !== 'pending') {
      return NextResponse.json(
        { data: null, error: { code: 'ALREADY_PROCESSED', message: 'Yêu cầu này đã được xử lý' } },
        { status: 409 }
      )
    }

    // Tìm user theo phone
    const targetUser = await prisma.user.findFirst({ where: { phone: req.phone }, select: { id: true, fullName: true, isActive: true } })
    if (!targetUser) {
      // Mark rejected — phone không tồn tại trong hệ thống
      await prisma.passwordResetRequest.update({
        where: { id: req.id },
        data: { status: 'rejected', processedAt: new Date(), processedBy: user.id }
      })
      return NextResponse.json(
        { data: null, error: { code: 'USER_NOT_FOUND', message: 'SĐT không tồn tại trong hệ thống' } },
        { status: 404 }
      )
    }

    // Generate temp password + reset via Supabase admin
    const tempPassword = generateTempPassword()
    const adminSupabase = await createAdminClient()
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(targetUser.id, {
      password: tempPassword,
    })

    if (updateError) {
      await logError({ context: 'auth.reset_password', message: 'Supabase update failed', error: updateError })
      return NextResponse.json(
        { data: null, error: { code: 'AUTH_ERROR', message: 'Không thể reset mật khẩu' } },
        { status: 500 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetRequest.update({
        where: { id: req.id },
        data: { status: 'resolved', processedAt: new Date(), processedBy: user.id }
      })

      await tx.notification.create({
        data: {
          userId: targetUser.id,
          senderId: user.id,
          type: 'general',
          title: '🔑 Mật khẩu đã được reset',
          body: 'Lớp đã reset mật khẩu của bạn. Vui lòng liên hệ Zalo để nhận mật khẩu mới.',
        }
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          role: user.role,
          action: 'auth.reset_password',
          entityType: 'user',
          entityId: targetUser.id,
          afterData: { resetRequestId: req.id, targetUserId: targetUser.id }
        }
      })
    })

    log.info('auth.reset_password', `Password reset for ${targetUser.id}`, { resetBy: user.id })

    // Trả về temp password 1 lần để admin copy gửi cho HV qua Zalo
    return NextResponse.json({
      data: {
        tempPassword,
        userFullName: targetUser.fullName,
        message: 'Hãy copy mật khẩu này và gửi cho học viên qua Zalo. Hệ thống không lưu lại.'
      },
      error: null
    })

  } catch (error) {
    await logError({ context: 'auth.reset_password', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}

// ─── PATCH /api/auth/reset-password — Từ chối yêu cầu ───
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const body = await request.json()
    const parsed = resetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid' } }, { status: 400 })
    }

    await prisma.passwordResetRequest.update({
      where: { id: parsed.data.requestId },
      data: { status: 'rejected', processedAt: new Date(), processedBy: user.id }
    })

    return NextResponse.json({ data: { id: parsed.data.requestId }, error: null })
  } catch (error) {
    await logError({ context: 'auth.reset_password.reject', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
