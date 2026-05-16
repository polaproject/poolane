'use client'

import { Check } from 'lucide-react'
import type { NotificationTypeKey } from '@/lib/settings'

interface NotifType { key: string; label: string; emoji: string }

interface Props {
  types: NotifType[]
  value: NotificationTypeKey[]
  onChange: (v: NotificationTypeKey[]) => void
}

export function NotificationFilterEditor({ types, value, onChange }: Props) {
  const allShown = value.length === 0  // empty = show all (default)

  function toggle(key: string) {
    if (allShown) {
      // Lần đầu tick → bỏ mặc định all, chỉ hiện key vừa tick
      onChange([key as NotificationTypeKey])
      return
    }
    if (value.includes(key as NotificationTypeKey)) {
      onChange(value.filter(k => k !== key))
    } else {
      onChange([...value, key as NotificationTypeKey])
    }
  }

  function showAll() {
    onChange([])
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-foreground/65 mb-2">
          Chọn loại thông báo hiển thị trên nút <strong>Bell</strong> (góc dưới phải).
          Bỏ tick = loại đó vẫn được tạo trong DB nhưng không hiện trong popover.
        </p>
        <button
          type="button"
          onClick={showAll}
          className="text-xs text-accent font-semibold hover:underline"
        >
          {allShown ? '✓ Đang hiện TẤT CẢ loại' : 'Đặt lại: hiện tất cả'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {types.map(t => {
          const isOn = allShown || value.includes(t.key as NotificationTypeKey)
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => toggle(t.key)}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-left transition ring-1 ${
                isOn
                  ? 'bg-accent/10 ring-accent/40 hover:bg-accent/15'
                  : 'bg-paper-tint/40 ring-foreground/8 hover:bg-foreground/5'
              }`}
            >
              <span
                className={`grid place-items-center h-4 w-4 rounded border shrink-0 ${
                  isOn ? 'bg-accent border-accent text-ink' : 'bg-transparent border-foreground/30'
                }`}
              >
                {isOn && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
              </span>
              <span className="text-base">{t.emoji}</span>
              <span className="text-sm text-foreground flex-1">{t.label}</span>
              <code className="text-[10px] text-foreground/40 font-mono">{t.key}</code>
            </button>
          )
        })}
      </div>
    </div>
  )
}
