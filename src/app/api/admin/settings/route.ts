import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { getAllSettings, SETTING_DEFAULTS, type SettingKey } from '@/lib/settings'

// ─── GET /api/admin/settings — admin đọc tất cả settings ───
export async function GET() {
  try {
    await requireRole(['admin'])
    const settings = await getAllSettings()
    return NextResponse.json({ data: settings, error: null })
  } catch (error) {
    await logError({ context: 'settings.get', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi' } },
      { status: 500 }
    )
  }
}

// Per-key value schemas — rejects malformed shapes before hitting DB
const QUICK_ADD_ITEM_KEYS = z.enum([
  'add_student', 'add_session', 'record_payment', 'new_blog',
  'new_product', 'new_voucher', 'new_event', 'broadcast',
  'walk_in', 'attendance', 'approve_regs',
  'register_session', 'log_practice', 'new_goal',
])
const NOTIF_TYPE_KEYS = z.enum([
  'approval', 'rejection', 'cancellation', 'absence',
  'debt', 'birthday', 'badge', 'event', 'general',
])
const KEY_SCHEMAS: Record<SettingKey, z.ZodTypeAny> = {
  'quick_add.admin':        z.array(QUICK_ADD_ITEM_KEYS).max(5),
  'quick_add.staff':        z.array(QUICK_ADD_ITEM_KEYS).max(5),
  'quick_add.student':      z.array(QUICK_ADD_ITEM_KEYS).max(5),
  'notif_filter.types':     z.array(NOTIF_TYPE_KEYS),
  'sidebar_labels.admin':   z.record(z.string(), z.string().max(50)),
  'sidebar_labels.staff':   z.record(z.string(), z.string().max(50)),
  'sidebar_labels.student': z.record(z.string(), z.string().max(50)),
}

// ─── PATCH /api/admin/settings — update 1 hoặc nhiều keys ───
const patchSchema = z.object({
  updates: z.record(z.string(), z.unknown()),
})

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole(['admin'])
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_INPUT', message: 'Tham số không hợp lệ' } },
        { status: 400 }
      )
    }

    const allowedKeys = Object.keys(SETTING_DEFAULTS) as SettingKey[]
    const updates: Array<{ key: SettingKey; value: unknown }> = []
    for (const [k, v] of Object.entries(parsed.data.updates)) {
      if (!allowedKeys.includes(k as SettingKey)) {
        return NextResponse.json(
          { data: null, error: { code: 'UNKNOWN_KEY', message: `Key '${k}' không hợp lệ` } },
          { status: 400 }
        )
      }
      // Validate value shape per key
      const keySchema = KEY_SCHEMAS[k as SettingKey]
      const valResult = keySchema.safeParse(v)
      if (!valResult.success) {
        return NextResponse.json(
          { data: null, error: { code: 'INVALID_VALUE', message: `Giá trị không hợp lệ cho key '${k}'` } },
          { status: 400 }
        )
      }
      updates.push({ key: k as SettingKey, value: valResult.data })
    }

    await prisma.$transaction(
      updates.map(u =>
        prisma.systemSetting.upsert({
          where: { key: u.key },
          create: { key: u.key, value: u.value as object, updatedBy: user.id },
          update: { value: u.value as object, updatedBy: user.id },
        })
      )
    )

    // Audit log 1 entry tổng hợp
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'system_setting.update',
        entityType: 'system_setting',
        entityId: updates.map(u => u.key).join(','),
        beforeData: {},
        afterData: { keys: updates.map(u => u.key) },
      },
    })

    return NextResponse.json({ data: { updated: updates.length }, error: null })
  } catch (error) {
    await logError({ context: 'settings.patch', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi' } },
      { status: 500 }
    )
  }
}
