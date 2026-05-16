import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { z } from 'zod'

const bodySchema = z.object({
  currentPassword: z.string().min(1, { message: 'Vui lòng nhập mật khẩu hiện tại' }),
  newPassword: z.string().min(8, { message: 'Mật khẩu mới phải ít nhất 8 ký tự' }).max(100),
})

/**
 * POST /api/auth/change-password
 *
 * Verify current password + update sang new password. Yêu cầu nhập đúng
 * mật khẩu hiện tại (chống ai đó dùng máy chưa logout đổi pass).
 *
 * Flow:
 * 1. requireAuth → có session valid
 * 2. Parse body { currentPassword, newPassword }
 * 3. Verify current: tạo fresh anon client + signInWithPassword(email, current)
 *    → nếu fail = mật khẩu sai
 * 4. Update: admin.updateUserById(id, { password: new })
 * 5. Audit log
 *
 * Tách fresh client (anon, không session-bound) để verify, KHÔNG động đến
 * session hiện tại của user. Admin client để force update.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message ?? 'Thông tin không hợp lệ',
          },
        },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = parsed.data

    // Bước 1: Verify mật khẩu hiện tại bằng fresh anon client (không session-bound)
    const verifyClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const { error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (verifyError) {
      log.warn('auth.change_password', `Wrong current password for ${user.id}`, { reason: verifyError.message })
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_CURRENT_PASSWORD', message: 'Mật khẩu hiện tại không đúng' } },
        { status: 400 }
      )
    }

    // Bước 2: Update password qua admin API (force, không cần re-verify)
    const adminClient = await createAdminClient()
    const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
      password: newPassword,
    })

    if (updateError) {
      await logError({ context: 'auth.change_password', message: 'Update failed', error: updateError })
      return NextResponse.json(
        { data: null, error: { code: 'UPDATE_FAILED', message: 'Không thể cập nhật mật khẩu' } },
        { status: 500 }
      )
    }

    // Bước 3: Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'auth.change_password',
        entityType: 'user',
        entityId: user.id,
        afterData: { source: 'self-service' },
      },
    })

    log.info('auth.change_password', `User ${user.id} changed password`, { role: user.role })

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (error) {
    await logError({ context: 'auth.change_password', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
