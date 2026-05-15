/**
 * Demo Account Protection + Data Isolation (Phase 15.2)
 *
 * Pattern: phone bắt đầu `0900000` = demo account (test user, không phải HV thật).
 * Owner cần luôn có 1 set test accounts để verify flows mà không phải tạo HV mới.
 *
 * Demo accounts:
 *   - 0900000088: Học Viên Demo (student)
 *   - 0900000099: Trợ Lý Demo (staff)
 *
 * Quy ước:
 *   1. Code logic: demo accounts đi luồng thật, KHÔNG bypass (registration,
 *      payment, attendance, assessment đều chạy thật để tester thấy UX đúng)
 *   2. Analytics/reports: filter exclude qua `excludeDemoAccountsFilter()`
 *      → revenue, dropout, heatmap, reports KHÔNG bị lệch
 *   3. UI lists: vẫn hiện demo + badge "DEMO" để admin nhận ra
 *   4. Audit log + error log: KHÔNG filter (debug cần đầy đủ trace)
 *   5. KHÔNG xoá/deactivate qua UI — API throw 403
 *   6. Daily cron tự ensure tồn tại (tự re-create nếu accidental delete)
 *   7. Owner refresh data manual: `DELETE_DEMO=1 npm run db:seed-demo`
 */

import type { PrismaClient } from '@prisma/client'

const DEMO_PHONE_PREFIX = '0900000'

const DEMO_ACCOUNTS = {
  student: '0900000088',
  staff: '0900000099',
} as const

/** Check phone là demo account không */
export function isDemoAccount(phone: string | null | undefined): boolean {
  if (!phone) return false
  return phone.startsWith(DEMO_PHONE_PREFIX)
}

/** Get full list demo phones */
export function getDemoPhones(): string[] {
  return Object.values(DEMO_ACCOUNTS)
}

/** Public constant — dùng để loại khỏi analytics nếu cần */
export const DEMO_ACCOUNT_PHONES = DEMO_ACCOUNTS

// ─── DB lookup helpers (cached per request) ────────────────

let _cachedDemoUserIds: { value: string[]; expiresAt: number } | null = null
let _cachedDemoStudentIds: { value: string[]; expiresAt: number } | null = null

const CACHE_TTL_MS = 60_000 // 1 phút — đủ cho 1 request scope

/**
 * Get user IDs của demo accounts (cached 1 phút).
 * Dùng để filter `WHERE userId NOT IN (...)` trong queries analytics.
 */
export async function getDemoUserIds(prisma: PrismaClient): Promise<string[]> {
  if (_cachedDemoUserIds && _cachedDemoUserIds.expiresAt > Date.now()) {
    return _cachedDemoUserIds.value
  }
  const users = await prisma.user.findMany({
    where: { phone: { startsWith: DEMO_PHONE_PREFIX } },
    select: { id: true },
  })
  const ids = users.map(u => u.id)
  _cachedDemoUserIds = { value: ids, expiresAt: Date.now() + CACHE_TTL_MS }
  return ids
}

/**
 * Get student IDs của demo accounts (cached 1 phút).
 * Dùng để filter `WHERE studentId NOT IN (...)` trong queries analytics.
 */
export async function getDemoStudentIds(prisma: PrismaClient): Promise<string[]> {
  if (_cachedDemoStudentIds && _cachedDemoStudentIds.expiresAt > Date.now()) {
    return _cachedDemoStudentIds.value
  }
  const students = await prisma.student.findMany({
    where: {
      user: { phone: { startsWith: DEMO_PHONE_PREFIX } },
    },
    select: { id: true },
  })
  const ids = students.map(s => s.id)
  _cachedDemoStudentIds = { value: ids, expiresAt: Date.now() + CACHE_TTL_MS }
  return ids
}

/**
 * Convenience: Prisma WHERE clause để exclude demo students.
 * Usage:
 *   const filter = await excludeDemoStudentsFilter(prisma)
 *   prisma.payment.findMany({ where: { ...filter, recordedAt: {...} } })
 */
export async function excludeDemoStudentsFilter(prisma: PrismaClient): Promise<{
  studentId: { notIn: string[] }
} | Record<string, never>> {
  const ids = await getDemoStudentIds(prisma)
  if (ids.length === 0) return {}
  return { studentId: { notIn: ids } }
}

/** Clear cache (dùng khi cron ensure-test-account tái tạo account) */
export function clearDemoCache(): void {
  _cachedDemoUserIds = null
  _cachedDemoStudentIds = null
}
