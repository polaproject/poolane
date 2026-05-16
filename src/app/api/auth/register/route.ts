import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { registerSchema } from '@/lib/validations/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/client'
import { welcomeEmail } from '@/lib/email/templates'

// ─── POST /api/auth/register — Học viên tự tạo tài khoản ───
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Thông tin không hợp lệ', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const input = parsed.data
    const cleanPhone = input.phone.replace(/\D/g, '')
    const emailForAuth = `${cleanPhone}@poolane.local`

    // Check duplicate phone
    const existing = await prisma.user.findFirst({
      where: { OR: [{ phone: input.phone }, { email: emailForAuth }] }
    })
    if (existing) {
      return NextResponse.json(
        { data: null, error: { code: 'DUPLICATE_PHONE', message: 'Số điện thoại này đã được đăng ký. Vui lòng đăng nhập hoặc dùng số khác.' } },
        { status: 409 }
      )
    }

    // Create Supabase Auth user
    // Phone không được truyền vào Supabase Auth vì cần E.164 format (+84...);
    // Phone gốc lưu ở Prisma User table và dùng cho login qua email-alias.
    const adminSupabase = await createAdminClient()
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: emailForAuth,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName, role: 'student' }
    })

    if (authError || !authData.user) {
      await logError({ context: 'auth.register', message: 'Supabase auth create failed', error: authError })
      return NextResponse.json(
        { data: null, error: { code: 'AUTH_ERROR', message: 'Không thể tạo tài khoản. Vui lòng thử lại.' } },
        { status: 500 }
      )
    }

    // Generate student code
    const year = new Date().getFullYear()
    const countThisYear = await prisma.student.count({ where: { studentCode: { startsWith: `POLA-${year}-` } } })
    const studentCode = `POLA-${year}-${String(countThisYear + 1).padStart(4, '0')}`

    // Create User + Student in transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id: authData.user.id,
          email: input.email,
          phone: input.phone,
          fullName: input.fullName,
          dob: new Date(input.dob),
          gender: input.gender,
          // Cấu trúc hành chính mới: bỏ cấp huyện. district = null.
          ward: input.ward || null,
          district: null,
          province: input.province,
          role: 'student',
          accountSource: 'online_signup',
          photoConsentAt: input.photoConsent ? new Date() : null,
          termsAcknowledgedAt: input.termsAcknowledged ? new Date() : null,
        }
      })

      const newStudent = await tx.student.create({
        data: {
          userId: newUser.id,
          studentCode,
          status: 'prospect',
        }
      })

      // Notify admin/staff về HV mới
      const admins = await tx.user.findMany({
        where: { role: { in: ['admin', 'staff'] }, isActive: true },
        select: { id: true }
      })
      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map(a => ({
            userId: a.id,
            studentId: newStudent.id,
            senderId: newUser.id,
            type: 'general',
            title: 'Học viên mới đăng ký',
            body: `${input.fullName} (${input.phone}) vừa tạo tài khoản qua landing page. Hãy liên hệ tư vấn nhé!`,
            actionUrl: `/admin/students/${newStudent.id}`,
          }))
        })
      }

      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          role: 'student',
          action: 'auth.self_register',
          entityType: 'user',
          entityId: newUser.id,
          afterData: { studentCode, source: 'online_signup' }
        }
      })

      return { user: newUser, student: newStudent }
    })

    log.info('auth.register', `New self-registered student ${studentCode}`, { studentId: result.student.id })

    // Send welcome email (fire-and-forget — không block response). Email là
    // required từ Phase 18 nên luôn gửi.
    const tmpl = welcomeEmail({ fullName: input.fullName, studentCode })
    sendEmail({ to: input.email, ...tmpl }).catch(() => {})

    return NextResponse.json(
      { data: { studentCode, fullName: input.fullName, phone: input.phone }, error: null },
      { status: 201 }
    )

  } catch (error) {
    await logError({ context: 'auth.register', message: 'Failed to register', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.' } },
      { status: 500 }
    )
  }
}
