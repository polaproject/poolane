import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron/auth'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/cron/ensure-test-account
 *
 * Daily cron (5:30 AM VN = 22:30 UTC trước đó):
 * Đảm bảo 2 test accounts (student demo + staff demo) tồn tại trong DB.
 * Nếu missing → tự tạo lại (idempotent).
 *
 * KHÔNG touch data nếu account exist (vé/enrollment/assessments giữ nguyên
 * theo lựa chọn 'Manual refresh' của owner). Chỉ ensure user record sống.
 *
 * Trigger: Vercel cron `vercel.json` schedule "30 22 * * *"
 * Auth: Authorization: Bearer $CRON_SECRET
 */

const DEMO_ACCOUNTS = [
  {
    phone: '0900000088',
    fullName: 'Học Viên Demo',
    role: 'student' as const,
    password: 'PoolaneDemo@123',
    extra: {
      dob: new Date('1995-08-15'),
      gender: 'male' as const,
      ward: 'Phú Nhuận',
      district: 'Phú Nhuận',
      province: 'TP. Hồ Chí Minh',
      photoConsentAt: new Date(),
    },
  },
  {
    phone: '0900000099',
    fullName: 'Trợ Lý Demo',
    role: 'staff' as const,
    password: 'PoolaneDemo@123',
    extra: {},
  },
]

function phoneToEmail(phone: string): string {
  return `${phone.replace(/\D/g, '')}@poolane.local`
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const results: { phone: string; action: 'exists' | 'created' | 'failed'; error?: string }[] = []

  for (const acc of DEMO_ACCOUNTS) {
    try {
      // Check if user record exists
      const existing = await prisma.user.findUnique({
        where: { phone: acc.phone },
        include: { student: true },
      })

      if (existing && existing.isActive) {
        results.push({ phone: acc.phone, action: 'exists' })
        continue
      }

      // Either missing or deactivated → recreate
      const email = phoneToEmail(acc.phone)

      // Cleanup auth user nếu có
      const { data: existingAuth } = await supabaseAdmin.auth.admin.listUsers()
      const authUser = existingAuth.users?.find(u => u.email === email)
      if (authUser) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.id).catch(() => {})
      }

      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.fullName, role: acc.role },
      })
      if (authError) throw new Error(`Auth: ${authError.message}`)
      const authUserId = authData.user!.id

      // Cleanup old user record nếu có (foreign keys cascade)
      if (existing) {
        await prisma.user.delete({ where: { id: existing.id } }).catch(() => {})
      }

      // Create user record với new auth id
      await prisma.user.create({
        data: {
          id: authUserId,
          email,
          phone: acc.phone,
          fullName: acc.fullName,
          role: acc.role,
          accountSource: acc.role === 'staff' ? 'staff_created' : 'walk_in',
          isActive: true,
          termsAcknowledgedAt: new Date(),
          ...acc.extra,
        },
      })

      // Student-specific: tạo Student record
      if (acc.role === 'student') {
        await prisma.student.create({
          data: {
            userId: authUserId,
            studentCode: 'POLA-2026-DEMO',
            status: 'active',
            swimmingExperience: 'Người mới hoàn toàn',
            learningGoal: 'Bơi được 25m không nghỉ',
          },
        })
      }

      results.push({ phone: acc.phone, action: 'created' })
      log.info('cron.ensure-test-account', `Recreated demo account ${acc.phone}`, { role: acc.role })
    } catch (err) {
      results.push({
        phone: acc.phone,
        action: 'failed',
        error: err instanceof Error ? err.message : String(err),
      })
      await logError({
        context: 'cron.ensure-test-account',
        message: `Failed for ${acc.phone}`,
        error: err,
      })
    }
  }

  const created = results.filter(r => r.action === 'created').length
  const failed = results.filter(r => r.action === 'failed').length

  return NextResponse.json({
    data: { results, created, exists: results.filter(r => r.action === 'exists').length, failed },
    error: null,
  })
}
