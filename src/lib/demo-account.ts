/**
 * Demo Account Protection (Phase 15.2)
 *
 * Pattern: phone bắt đầu `0900000` = demo account (test user, không phải HV thật).
 * Owner cần luôn có 1 set test accounts để verify flows mà không phải tạo HV mới.
 *
 * Demo accounts:
 *   - 0900000088: Học Viên Demo (student)
 *   - 0900000099: Trợ Lý Demo (staff)
 *
 * Quy ước:
 *   - KHÔNG xoá/deactivate qua UI — API throw lỗi rõ ràng
 *   - Daily cron tự ensure tồn tại (nếu owner SQL xoá → tự tái tạo)
 *   - Owner refresh data manual qua `DELETE_DEMO=1 npm run db:seed-demo`
 */

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
