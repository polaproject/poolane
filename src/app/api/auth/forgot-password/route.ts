import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { forgotPasswordSchema } from '@/lib/validations/auth'

// ─── POST /api/auth/forgot-password ─────────────────────
// HV submit phone → tạo PasswordResetRequest + notify admin/staff.
// Admin sẽ vào queue, reset thủ công và liên hệ HV qua Zalo.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = forgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Số điện thoại không hợp lệ' } },
        { status: 400 }
      )
    }

    const { phone, fullNameHint } = parsed.data
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

    // Rate limit: tối đa 3 request pending cùng phone
    const existingPending = await prisma.passwordResetRequest.count({
      where: { phone, status: 'pending' }
    })
    if (existingPending >= 3) {
      return NextResponse.json(
        { data: null, error: { code: 'RATE_LIMITED', message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng liên hệ lớp.' } },
        { status: 429 }
      )
    }

    // Verify user exists (silent — không tiết lộ phone có hay không để chống enumeration)
    const user = await prisma.user.findFirst({
      where: { phone },
      select: { id: true, fullName: true, isActive: true }
    })

    const req = await prisma.passwordResetRequest.create({
      data: {
        phone,
        fullNameHint: fullNameHint || user?.fullName || null,
        status: 'pending',
        ipAddress: ip,
      }
    })

    // Notify admin/staff
    if (user) {
      const recipients = await prisma.user.findMany({
        where: { role: { in: ['admin', 'staff'] }, isActive: true },
        select: { id: true }
      })
      if (recipients.length > 0) {
        await prisma.notification.createMany({
          data: recipients.map(r => ({
            userId: r.id,
            senderId: null,
            type: 'general',
            title: '🔑 Yêu cầu reset mật khẩu',
            body: `${user.fullName} (${phone}) yêu cầu reset mật khẩu.`,
            actionUrl: '/admin/password-resets',
            metadata: { resetRequestId: req.id, phone },
          }))
        })
      }
    }

    log.info('auth.forgot_password', `Reset request created`, { phone, requestId: req.id, userExists: !!user })

    // Luôn trả 200 — không tiết lộ phone có trong hệ thống hay không
    return NextResponse.json({
      data: {
        message: 'Đã gửi yêu cầu. Lớp sẽ liên hệ bạn qua Zalo/SMS để xác minh và cung cấp mật khẩu mới.'
      },
      error: null
    })

  } catch (error) {
    await logError({ context: 'auth.forgot_password', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
