import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'

/**
 * POST /api/auth/change-password — Audit log only.
 *
 * Đổi mật khẩu thực tế xảy ra ở client qua Supabase
 * `client.auth.updateUser({ password })`. Endpoint này được gọi sau đó để
 * ghi audit log vào DB của ta (Supabase auth update không tự log).
 *
 * KHÔNG nhận body — chỉ ghi nhận sự kiện. Mật khẩu KHÔNG đi qua server.
 */
export async function POST() {
  try {
    const user = await requireAuth()

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

    log.info('auth.change_password', `User ${user.id} changed password`, {
      role: user.role,
    })

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (error) {
    await logError({ context: 'auth.change_password', message: 'Failed to audit', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
