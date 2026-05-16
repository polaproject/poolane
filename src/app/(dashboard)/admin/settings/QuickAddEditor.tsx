'use client'

import { ArrowUp, ArrowDown, Check } from 'lucide-react'
import type { QuickAddCatalogItem, QuickAddItemKey } from '@/lib/settings'
import type { UserRole } from '@/lib/auth'

interface Props {
  catalog: QuickAddCatalogItem[]
  value: { admin: QuickAddItemKey[]; staff: QuickAddItemKey[]; student: QuickAddItemKey[] }
  onChange: (role: UserRole, items: QuickAddItemKey[]) => void
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  staff: 'Trợ lý',
  student: 'Học viên',
}

/**
 * Section per role — extract ra ngoài render parent để tránh
 * react-hooks/static-components: tạo component trong render.
 */
function Section({
  role, catalog, selected, onChange,
}: {
  role: UserRole
  catalog: QuickAddCatalogItem[]
  selected: QuickAddItemKey[]
  onChange: (role: UserRole, items: QuickAddItemKey[]) => void
}) {
  const available = catalog.filter(c => c.roles.includes(role))

  function toggle(key: QuickAddItemKey) {
    if (selected.includes(key)) {
      onChange(role, selected.filter(k => k !== key))
    } else {
      if (selected.length >= 5) return  // tối đa 5 items
      onChange(role, [...selected, key])
    }
  }
  function move(key: QuickAddItemKey, direction: 'up' | 'down') {
    const idx = selected.indexOf(key)
    if (idx === -1) return
    const neighborIdx = direction === 'up' ? idx - 1 : idx + 1
    if (neighborIdx < 0 || neighborIdx >= selected.length) return
    const next = [...selected]
    ;[next[idx], next[neighborIdx]] = [next[neighborIdx], next[idx]]
    onChange(role, next)
  }

  return (
    <div>
      <h3 className="lqg-headline text-base text-foreground mb-3 flex items-center gap-2">
        {ROLE_LABELS[role]}
        <span className="text-xs text-foreground/55 font-normal">
          {selected.length}/5 items
        </span>
      </h3>

      <div className="space-y-1.5 mb-3">
        {selected.length === 0 ? (
          <p className="text-xs text-foreground/40 italic">Chưa có item nào — tick từ danh sách bên dưới</p>
        ) : (
          selected.map((key, idx) => {
            const item = catalog.find(c => c.key === key)
            if (!item) return null
            return (
              <div
                key={key}
                className="flex items-center gap-2 rounded-md bg-paper-tint/40 px-3 py-2 ring-1 ring-foreground/8"
              >
                <span className="text-[10px] font-bold text-foreground/40 w-4">{idx + 1}</span>
                <span className="flex-1 text-sm text-foreground">{item.label}</span>
                <span className="text-[10px] text-foreground/40 font-mono">{item.href}</span>
                <button
                  type="button"
                  onClick={() => move(key, 'up')}
                  disabled={idx === 0}
                  aria-label="Lên"
                  className="grid place-items-center h-6 w-6 rounded-md hover:bg-foreground/8 disabled:opacity-30 transition"
                >
                  <ArrowUp className="h-3 w-3" strokeWidth={2.25} />
                </button>
                <button
                  type="button"
                  onClick={() => move(key, 'down')}
                  disabled={idx === selected.length - 1}
                  aria-label="Xuống"
                  className="grid place-items-center h-6 w-6 rounded-md hover:bg-foreground/8 disabled:opacity-30 transition"
                >
                  <ArrowDown className="h-3 w-3" strokeWidth={2.25} />
                </button>
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  aria-label="Bỏ chọn"
                  className="ml-1 text-xs text-danger hover:underline"
                >
                  Bỏ
                </button>
              </div>
            )
          })
        )}
      </div>

      <div>
        <p className="text-[10px] text-foreground/55 uppercase tracking-wider font-semibold mb-2">
          Thêm từ danh sách
        </p>
        <div className="flex flex-wrap gap-1.5">
          {available.filter(c => !selected.includes(c.key)).map(c => (
            <button
              key={c.key}
              type="button"
              onClick={() => toggle(c.key)}
              disabled={selected.length >= 5}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-pill text-xs font-medium bg-paper-tint/60 ring-1 ring-foreground/10 hover:bg-accent/15 hover:ring-accent/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="h-3 w-3 opacity-50" strokeWidth={2.5} /> {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function QuickAddEditor({ catalog, value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/65">
        Mỗi role có menu Quick Add (nút <strong>+</strong> ở góc dưới phải). Chọn 1-5 item từ
        danh sách + sắp xếp thứ tự. Item đầu danh sách hiện trên cùng menu.
      </p>
      <Section role="admin"   catalog={catalog} selected={value.admin}   onChange={onChange} />
      <div className="border-t border-foreground/8" />
      <Section role="staff"   catalog={catalog} selected={value.staff}   onChange={onChange} />
      <div className="border-t border-foreground/8" />
      <Section role="student" catalog={catalog} selected={value.student} onChange={onChange} />
    </div>
  )
}
