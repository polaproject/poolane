'use client'

import Link from 'next/link'
import { Popover } from '@base-ui/react/popover'
import {
  Plus, UserPlus, Calendar, DollarSign, FileText,
  CheckSquare, ClipboardList, BookOpen, Target,
  ShoppingBag, Tags, Star, BellRing,
} from 'lucide-react'
import type { UserRole } from '@/lib/auth'
import type { QuickAddItemKey } from '@/lib/settings'

// Typed as Record<QuickAddItemKey, ...> so TypeScript errors if a new key is added
// to QuickAddItemKey in settings.ts but forgotten here.
const CATALOG: Record<QuickAddItemKey, { label: string; href: string; icon: React.ComponentType<{ className?: string }>; roles: UserRole[] }> = {
  add_student:      { label: 'Thêm học viên',         href: '/admin/students/new',          icon: UserPlus,    roles: ['admin'] },
  add_session:      { label: 'Tạo buổi học',          href: '/admin/schedule/sessions/new', icon: Calendar,    roles: ['admin'] },
  record_payment:   { label: 'Ghi nhận thanh toán',    href: '/admin/finance',               icon: DollarSign,  roles: ['admin'] },
  new_blog:         { label: 'Viết bài Blog',          href: '/admin/blog/new',              icon: FileText,    roles: ['admin'] },
  new_product:      { label: 'Thêm sản phẩm',          href: '/admin/shop/products/new',     icon: ShoppingBag, roles: ['admin'] },
  new_voucher:      { label: 'Tạo voucher',            href: '/admin/vouchers/new',          icon: Tags,        roles: ['admin'] },
  new_event:        { label: 'Tạo sự kiện',            href: '/admin/events/new',            icon: Star,        roles: ['admin'] },
  broadcast:        { label: 'Gửi thông báo chung',   href: '/admin/broadcast',             icon: BellRing,    roles: ['admin'] },
  walk_in:          { label: 'Thêm học viên walk-in', href: '/staff/students/new',          icon: UserPlus,    roles: ['staff'] },
  attendance:       { label: 'Điểm danh hôm nay',      href: '/staff/attendance',            icon: CheckSquare, roles: ['staff'] },
  approve_regs:     { label: 'Duyệt đăng ký',          href: '/staff/registrations',         icon: ClipboardList, roles: ['staff'] },
  register_session: { label: 'Đăng ký buổi',           href: '/student/schedule',            icon: Calendar,    roles: ['student'] },
  log_practice:     { label: 'Ghi nhật ký luyện tập', href: '/student/log',                 icon: BookOpen,    roles: ['student'] },
  new_goal:         { label: 'Tạo mục tiêu mới',       href: '/student/goals',               icon: Target,      roles: ['student'] },
}

const DEFAULTS: Record<UserRole, string[]> = {
  admin:   ['add_student', 'add_session', 'record_payment', 'new_blog'],
  staff:   ['walk_in', 'attendance', 'approve_regs'],
  student: ['register_session', 'log_practice', 'new_goal'],
}

interface QuickAddFabProps {
  role: UserRole
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Item keys từ admin settings — null khi đang load, fall back default */
  itemKeys: string[] | null
}

export function QuickAddFab({ role, open, onOpenChange, itemKeys }: QuickAddFabProps) {
  const keys = itemKeys ?? DEFAULTS[role]
  const items = keys
    .map(k => CATALOG[k as QuickAddItemKey])
    .filter((item): item is NonNullable<typeof item> => !!item && item.roles.includes(role))

  if (items.length === 0) return null

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Popover.Trigger
        aria-label="Thao tác nhanh"
        className="grid place-items-center w-[52px] h-[52px] rounded-full bg-accent text-ink ring-1 ring-ink/15 shadow-xl shadow-black/30 hover:scale-[1.04] active:scale-[0.97] transition-transform"
      >
        <Plus className="w-5 h-5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="left" align="end" sideOffset={10} alignOffset={0} className="z-[60]">
          <Popover.Popup
            className="z-50 glass-panel rounded-card-lg p-1.5 w-[240px] origin-bottom-right shadow-glass data-[closed]:hidden"
          >
            <div className="px-3 py-2 border-b border-foreground/8 mb-1">
              <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold">
                Thao tác nhanh
              </p>
            </div>
            <ul className="flex flex-col gap-0.5">
              {items.map((item, idx) => {
                const Icon = item.icon
                return (
                  <li key={`${item.href}-${idx}`}>
                    <Popover.Close
                      nativeButton={false}
                      render={
                        <Link
                          href={item.href}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-foreground/5 transition-colors"
                        >
                          <Icon className="w-4 h-4 text-foreground/60" />
                          <span>{item.label}</span>
                        </Link>
                      }
                    />
                  </li>
                )
              })}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
