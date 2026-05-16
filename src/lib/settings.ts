import { prisma } from '@/lib/prisma'
import type { UserRole } from '@/lib/auth'

/**
 * Admin-configurable settings. Đọc qua getSetting<K>(key) — fallback default
 * khi DB chưa có. Update qua API /api/admin/settings.
 *
 * Khi thêm key mới: thêm vào SettingsMap + DEFAULTS + export type.
 */
export type QuickAddItemKey =
  | 'add_student' | 'add_session' | 'record_payment' | 'new_blog'
  | 'new_product' | 'new_voucher' | 'new_event' | 'broadcast'
  | 'walk_in' | 'attendance' | 'approve_regs'
  | 'register_session' | 'log_practice' | 'new_goal'

export interface QuickAddCatalogItem {
  key: QuickAddItemKey
  label: string
  href: string
  icon: string  // lucide icon name
  roles: UserRole[]
}

/** Catalog đầy đủ — settings chọn subset từ đây */
export const QUICK_ADD_CATALOG: QuickAddCatalogItem[] = [
  { key: 'add_student',     label: 'Thêm học viên',         href: '/admin/students/new',          icon: 'UserPlus',    roles: ['admin'] },
  { key: 'add_session',     label: 'Tạo buổi học',          href: '/admin/schedule/sessions/new', icon: 'Calendar',    roles: ['admin'] },
  { key: 'record_payment',  label: 'Ghi nhận thanh toán',    href: '/admin/finance',               icon: 'DollarSign',  roles: ['admin'] },
  { key: 'new_blog',        label: 'Viết bài Blog',          href: '/admin/blog/new',              icon: 'FileText',    roles: ['admin'] },
  { key: 'new_product',     label: 'Thêm sản phẩm',          href: '/admin/shop/products/new',     icon: 'ShoppingBag', roles: ['admin'] },
  { key: 'new_voucher',     label: 'Tạo voucher',            href: '/admin/vouchers/new',          icon: 'Tags',        roles: ['admin'] },
  { key: 'new_event',       label: 'Tạo sự kiện',            href: '/admin/events/new',            icon: 'Star',        roles: ['admin'] },
  { key: 'broadcast',       label: 'Gửi thông báo chung',   href: '/admin/broadcast',             icon: 'BellRing',    roles: ['admin'] },
  { key: 'walk_in',         label: 'Thêm học viên walk-in', href: '/staff/students/new',          icon: 'UserPlus',    roles: ['staff'] },
  { key: 'attendance',      label: 'Điểm danh hôm nay',      href: '/staff/attendance',            icon: 'CheckSquare', roles: ['staff'] },
  { key: 'approve_regs',    label: 'Duyệt đăng ký',          href: '/staff/registrations',         icon: 'ClipboardList', roles: ['staff'] },
  { key: 'register_session',label: 'Đăng ký buổi',           href: '/student/schedule',            icon: 'Calendar',    roles: ['student'] },
  { key: 'log_practice',    label: 'Ghi nhật ký luyện tập', href: '/student/log',                 icon: 'BookOpen',    roles: ['student'] },
  { key: 'new_goal',        label: 'Tạo mục tiêu mới',       href: '/student/goals',               icon: 'Target',      roles: ['student'] },
]

/** Notification types — match NotificationFab TYPE_ICONS keys + DB enum */
export const NOTIFICATION_TYPES = [
  { key: 'approval',     label: 'Duyệt đăng ký',         emoji: '✅' },
  { key: 'rejection',    label: 'Từ chối đăng ký',        emoji: '❌' },
  { key: 'cancellation', label: 'Huỷ ca / rút HV',       emoji: '🚫' },
  { key: 'absence',      label: 'Vắng học / lớp nhớ',    emoji: '📋' },
  { key: 'debt',         label: 'Nhắc nợ / thanh toán',  emoji: '💰' },
  { key: 'birthday',     label: 'Sinh nhật',              emoji: '🎂' },
  { key: 'badge',        label: 'Thành tích / Tốt nghiệp',emoji: '🏆' },
  { key: 'event',        label: 'Sự kiện',                emoji: '🎉' },
  { key: 'general',      label: 'Thông báo chung',       emoji: '💙' },
] as const

export type NotificationTypeKey = typeof NOTIFICATION_TYPES[number]['key']

/** Sidebar group keys mặc định — owner có thể đổi label + thứ tự */
export const SIDEBAR_GROUP_KEYS: Record<UserRole, string[]> = {
  admin:   ['tongquan', 'hocvien', 'vanhanh', 'taichinh', 'banhang', 'noidung', 'lienlac', 'hethong'],
  staff:   ['tongquan', 'hocvien', 'vanhanh'],
  student: ['canhan', 'hoctap', 'muctieu', 'congdong', 'muasam'],
}

/** Format styles cho dashboard (Phase 17) */
export type AmountStyleSetting = 'vn_full' | 'vn_compact' | 'no_symbol' | 'us'

/** Map key → typed value */
export interface SettingsMap {
  'quick_add.admin':   QuickAddItemKey[]
  'quick_add.staff':   QuickAddItemKey[]
  'quick_add.student': QuickAddItemKey[]
  'notif_filter.types': NotificationTypeKey[]  // empty = show all
  'sidebar_labels.admin':   Record<string, string>
  'sidebar_labels.staff':   Record<string, string>
  'sidebar_labels.student': Record<string, string>
  // Order = array of group keys in desired order. Empty = use default NAV_GROUPS order.
  // Missing keys are appended at end; unknown keys ignored.
  'sidebar_order.admin':   string[]
  'sidebar_order.staff':   string[]
  'sidebar_order.student': string[]
  // Format defaults cho dashboard widgets (per-widget có thể override)
  'format.amount_style':       AmountStyleSetting
  'format.percent_decimals':   number  // 0 | 1 | 2
  'format.thousand_separator': '.' | ','
}

export type SettingKey = keyof SettingsMap

/** Defaults — fallback khi DB key chưa tồn tại */
export const SETTING_DEFAULTS: SettingsMap = {
  'quick_add.admin':   ['add_student', 'add_session', 'record_payment', 'new_blog'],
  'quick_add.staff':   ['walk_in', 'attendance', 'approve_regs'],
  'quick_add.student': ['register_session', 'log_practice', 'new_goal'],
  'notif_filter.types': [],  // empty = show all types
  'sidebar_labels.admin':   {},
  'sidebar_labels.staff':   {},
  'sidebar_labels.student': {},
  'sidebar_order.admin':   [],
  'sidebar_order.staff':   [],
  'sidebar_order.student': [],
  'format.amount_style':       'vn_full',
  'format.percent_decimals':   1,
  'format.thousand_separator': '.',
}

/** Server-only: đọc setting từ DB, fallback default */
export async function getSetting<K extends SettingKey>(key: K): Promise<SettingsMap[K]> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key } })
    if (!row) return SETTING_DEFAULTS[key]
    return row.value as SettingsMap[K]
  } catch {
    return SETTING_DEFAULTS[key]
  }
}

/** Server-only: đọc tất cả settings (cho client consumption qua API) */
export async function getAllSettings(): Promise<SettingsMap> {
  const rows = await prisma.systemSetting.findMany()
  const result = { ...SETTING_DEFAULTS } as SettingsMap
  for (const r of rows) {
    if (r.key in SETTING_DEFAULTS) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[r.key] = r.value
    }
  }
  return result
}

/** Server-only: update 1 setting */
export async function setSetting<K extends SettingKey>(
  key: K,
  value: SettingsMap[K],
  updatedBy: string
): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value: value as object, updatedBy },
    update: { value: value as object, updatedBy },
  })
}
