'use client'

import { RotateCcw } from 'lucide-react'
import type { UserRole } from '@/lib/auth'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  staff: 'Trợ lý',
  student: 'Học viên',
}

/** Default Vietnamese labels — match NAV_GROUPS trong DashboardShell */
const DEFAULT_LABELS: Record<UserRole, Record<string, string>> = {
  admin: {
    tongquan: 'Tổng quan', hocvien: 'Học viên', vanhanh: 'Vận hành',
    taichinh: 'Tài chính', banhang: 'Bán hàng', noidung: 'Nội dung',
    lienlac: 'Liên lạc',
  },
  staff: {
    tongquan: 'Tổng quan', hocvien: 'Học viên', vanhanh: 'Vận hành',
  },
  student: {
    canhan: 'Cá nhân', hoctap: 'Học tập', muctieu: 'Mục tiêu',
    congdong: 'Cộng đồng', muasam: 'Mua sắm',
  },
}

interface Props {
  groupKeys: Record<UserRole, string[]>
  value: { admin: Record<string, string>; staff: Record<string, string>; student: Record<string, string> }
  onChange: (role: UserRole, labels: Record<string, string>) => void
}

export function SidebarLabelsEditor({ groupKeys, value, onChange }: Props) {
  function setLabel(role: UserRole, key: string, label: string) {
    const next = { ...value[role] }
    if (label.trim()) next[key] = label.trim()
    else delete next[key]  // empty → fall back to default
    onChange(role, next)
  }

  function reset(role: UserRole, key: string) {
    setLabel(role, key, '')
  }

  function Section({ role }: { role: UserRole }) {
    return (
      <div>
        <h3 className="lqg-headline text-base text-foreground mb-3">{ROLE_LABELS[role]}</h3>
        <div className="space-y-2">
          {groupKeys[role].map(k => {
            const defaultLabel = DEFAULT_LABELS[role][k] ?? k
            const customLabel = value[role][k] ?? ''
            return (
              <div key={k} className="flex items-center gap-2">
                <code className="text-[10px] text-foreground/40 font-mono w-16">{k}</code>
                <input
                  type="text"
                  value={customLabel}
                  onChange={e => setLabel(role, k, e.target.value)}
                  placeholder={defaultLabel}
                  className="flex-1 px-3 py-2 text-sm bg-paper-tint/40 ring-1 ring-foreground/10 rounded-md focus:ring-accent/40 focus:outline-none transition placeholder:text-foreground/35"
                />
                {customLabel && (
                  <button
                    type="button"
                    onClick={() => reset(role, k)}
                    aria-label="Khôi phục mặc định"
                    title={`Mặc định: ${defaultLabel}`}
                    className="grid place-items-center h-8 w-8 rounded-md hover:bg-foreground/8 transition text-foreground/55"
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/65">
        Đổi tên nhóm sidebar (vd <strong>Bán hàng</strong> → <strong>Doanh thu</strong>).
        Để trống = dùng tên mặc định. Đổi thứ tự nhóm + xoá nhóm sẽ phát triển sau khi
        owner xác nhận flow.
      </p>
      <Section role="admin" />
      <div className="border-t border-foreground/8" />
      <Section role="staff" />
      <div className="border-t border-foreground/8" />
      <Section role="student" />
    </div>
  )
}
