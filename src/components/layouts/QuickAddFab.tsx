'use client'

import Link from 'next/link'
import { Popover } from '@base-ui/react/popover'
import {
  Plus, UserPlus, Calendar, DollarSign, FileText,
  CheckSquare, ClipboardList, BookOpen, Target,
} from 'lucide-react'
import type { UserRole } from '@/lib/auth'

interface QuickAction {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const QUICK_ADD_ITEMS: Record<UserRole, QuickAction[]> = {
  admin: [
    { label: 'Thêm học viên', href: '/admin/students/new', icon: UserPlus },
    { label: 'Tạo buổi học', href: '/admin/schedule/sessions/new', icon: Calendar },
    { label: 'Ghi nhận thanh toán', href: '/admin/finance', icon: DollarSign },
    { label: 'Viết bài Blog', href: '/admin/blog/new', icon: FileText },
  ],
  staff: [
    { label: 'Thêm học viên walk-in', href: '/staff/students/new', icon: UserPlus },
    { label: 'Điểm danh hôm nay', href: '/staff/attendance', icon: CheckSquare },
    { label: 'Duyệt đăng ký', href: '/staff/registrations', icon: ClipboardList },
  ],
  student: [
    { label: 'Đăng ký buổi', href: '/student/schedule', icon: Calendar },
    { label: 'Ghi nhật ký luyện tập', href: '/student/log', icon: BookOpen },
    { label: 'Tạo mục tiêu mới', href: '/student/goals', icon: Target },
  ],
}

interface QuickAddFabProps {
  role: UserRole
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickAddFab({ role, open, onOpenChange }: QuickAddFabProps) {
  const items = QUICK_ADD_ITEMS[role] ?? []
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
              {items.map(item => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
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
