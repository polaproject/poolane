'use client'

import { RotateCcw, ChevronUp, ChevronDown } from 'lucide-react'
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
    lienlac: 'Liên lạc', hethong: 'Hệ thống',
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
  labels: { admin: Record<string, string>; staff: Record<string, string>; student: Record<string, string> }
  order:  { admin: string[]; staff: string[]; student: string[] }
  onLabelsChange: (role: UserRole, labels: Record<string, string>) => void
  onOrderChange:  (role: UserRole, order: string[]) => void
}

/**
 * Resolve hiển thị order: nếu user lưu order tuỳ chỉnh thì dùng order đó,
 * thêm các key còn thiếu vào cuối (vd khi có nhóm mới thêm vào codebase).
 */
function resolveOrder(defaultKeys: string[], customOrder: string[]): string[] {
  const known = new Set(defaultKeys)
  const seen = new Set<string>()
  const result: string[] = []
  for (const k of customOrder) {
    if (known.has(k) && !seen.has(k)) {
      result.push(k)
      seen.add(k)
    }
  }
  for (const k of defaultKeys) {
    if (!seen.has(k)) result.push(k)
  }
  return result
}

/**
 * Section per role — extract ra ngoài render parent để tránh
 * react-hooks/static-components warning.
 */
function Section({
  role, groupKeys, labels, order, onLabelsChange, onOrderChange,
}: {
  role: UserRole
  groupKeys: string[]
  labels: Record<string, string>
  order: string[]
  onLabelsChange: (labels: Record<string, string>) => void
  onOrderChange: (order: string[]) => void
}) {
  function setLabel(key: string, label: string) {
    const next = { ...labels }
    if (label.trim()) next[key] = label.trim()
    else delete next[key]
    onLabelsChange(next)
  }
  function resetLabel(key: string) {
    setLabel(key, '')
  }
  function move(currentList: string[], index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= currentList.length) return
    const next = [...currentList]
    ;[next[index], next[target]] = [next[target], next[index]]
    onOrderChange(next)
  }

  const resolvedOrder = resolveOrder(groupKeys, order)
  return (
    <div>
      <h3 className="lqg-headline text-base text-foreground mb-3">{ROLE_LABELS[role]}</h3>
      <div className="space-y-2">
        {resolvedOrder.map((k, idx) => {
          const defaultLabel = DEFAULT_LABELS[role][k] ?? k
          const customLabel = labels[k] ?? ''
          const isFirst = idx === 0
          const isLast = idx === resolvedOrder.length - 1
          return (
            <div key={k} className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => move(resolvedOrder, idx, -1)}
                  disabled={isFirst}
                  aria-label="Đưa lên trên"
                  className="grid place-items-center h-4 w-5 rounded hover:bg-foreground/8 transition text-foreground/60 disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="h-3 w-3" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => move(resolvedOrder, idx, 1)}
                  disabled={isLast}
                  aria-label="Đưa xuống dưới"
                  className="grid place-items-center h-4 w-5 rounded hover:bg-foreground/8 transition text-foreground/60 disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </div>
              <code className="text-[10px] text-foreground/40 font-mono w-16">{k}</code>
              <input
                type="text"
                value={customLabel}
                onChange={e => setLabel(k, e.target.value)}
                placeholder={defaultLabel}
                className="flex-1 px-3 py-2 text-sm bg-paper-tint/40 ring-1 ring-foreground/10 rounded-md focus:ring-accent/40 focus:outline-none transition placeholder:text-foreground/35"
              />
              {customLabel && (
                <button
                  type="button"
                  onClick={() => resetLabel(k)}
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

export function SidebarLabelsEditor({ groupKeys, labels, order, onLabelsChange, onOrderChange }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/65">
        Đổi tên + sắp xếp thứ tự nhóm sidebar. Dùng <ChevronUp className="inline h-3 w-3" />/<ChevronDown className="inline h-3 w-3" /> để di chuyển nhóm. Để trống tên = dùng mặc định.
      </p>
      <Section
        role="admin"
        groupKeys={groupKeys.admin}
        labels={labels.admin}
        order={order.admin}
        onLabelsChange={next => onLabelsChange('admin', next)}
        onOrderChange={next => onOrderChange('admin', next)}
      />
      <div className="border-t border-foreground/8" />
      <Section
        role="staff"
        groupKeys={groupKeys.staff}
        labels={labels.staff}
        order={order.staff}
        onLabelsChange={next => onLabelsChange('staff', next)}
        onOrderChange={next => onOrderChange('staff', next)}
      />
      <div className="border-t border-foreground/8" />
      <Section
        role="student"
        groupKeys={groupKeys.student}
        labels={labels.student}
        order={order.student}
        onLabelsChange={next => onLabelsChange('student', next)}
        onOrderChange={next => onOrderChange('student', next)}
      />
    </div>
  )
}
