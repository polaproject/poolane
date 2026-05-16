import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { updateAvatarSchema } from '@/lib/validations/auth'

/**
 * PATCH /api/users/avatar — user tự cập nhật avatar.
 *
 * Body: { avatarUrl: string | null }
 * - string: URL Supabase Storage từ PhotoUploader
 * - null: xoá avatar, fallback về initial
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = updateAvatarSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'URL avatar không hợp lệ' } },
        { status: 400 }
      )
    }

    const previous = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true },
    })

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: parsed.data.avatarUrl },
      select: { avatarUrl: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'user.update_avatar',
        entityType: 'user',
        entityId: user.id,
        beforeData: { avatarUrl: previous?.avatarUrl ?? null },
        afterData: { avatarUrl: parsed.data.avatarUrl },
      },
    })

    log.info('user.update_avatar', `User ${user.id} updated avatar`, {
      hasAvatar: !!parsed.data.avatarUrl,
    })

    return NextResponse.json({ data: { avatarUrl: updated.avatarUrl }, error: null })
  } catch (error) {
    await logError({ context: 'user.update_avatar', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
