import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { selfEditProfileSchema } from '@/lib/validations/profile-change'
import { SELF_EDITABLE_FIELDS } from '@/config/profile-fields'

// ─── PATCH /api/me/profile — HV tự sửa các trường mềm ───
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth()

    const body = await request.json()
    const parsed = selfEditProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Thông tin không hợp lệ', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const input = parsed.data

    // Chỉ chấp nhận keys trong whitelist (defense in depth)
    const updateData: Record<string, string | null> = {}
    for (const field of SELF_EDITABLE_FIELDS) {
      if (field in input) {
        const value = (input as Record<string, string | undefined>)[field]
        updateData[field] = value && value.trim().length > 0 ? value.trim() : null
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Không có trường nào để cập nhật' } },
        { status: 400 }
      )
    }

    // Capture before state
    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        occupation: true,
        healthNotes: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
      }
    })

    if (!existing) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy tài khoản' } },
        { status: 404 }
      )
    }

    const beforeData = Object.fromEntries(
      Object.keys(updateData).map(k => [k, (existing as Record<string, unknown>)[k]])
    )

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: updateData })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          role: user.role,
          action: 'user.self_update',
          entityType: 'user',
          entityId: user.id,
          beforeData: beforeData as Record<string, string | null>,
          afterData: updateData,
        }
      })
    })

    log.info('me.profile.update', `Self-updated profile`, {
      userId: user.id,
      fields: Object.keys(updateData),
    })

    return NextResponse.json({ data: { updated: Object.keys(updateData) }, error: null })

  } catch (error) {
    await logError({ context: 'me.profile.update', message: 'Failed to self-update profile', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi cập nhật hồ sơ' } },
      { status: 500 }
    )
  }
}
