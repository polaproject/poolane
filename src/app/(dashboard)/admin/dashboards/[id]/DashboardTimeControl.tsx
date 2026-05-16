'use client'

import { Calendar } from 'lucide-react'
import type { TimeRange } from '@/lib/dashboard/types'

const PRESETS: Array<{ value: NonNullable<TimeRange['preset']>; label: string }> = [
  { value: '7d',           label: '7 ngày' },
  { value: '30d',          label: '30 ngày' },
  { value: '90d',          label: '90 ngày' },
  { value: 'this_month',   label: 'Tháng này' },
  { value: 'last_month',   label: 'Tháng trước' },
  { value: 'this_quarter', label: 'Quý này' },
  { value: 'this_year',    label: 'Năm này' },
  { value: 'all',          label: 'Tất cả' },
]

interface Props {
  value: TimeRange
  onChange: (next: TimeRange) => void
}

export function DashboardTimeControl({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      <Calendar className="h-3.5 w-3.5 text-foreground/55" />
      <span className="text-xs text-foreground/55">Khoảng thời gian:</span>
      <select
        value={value.preset ?? '30d'}
        onChange={e => onChange({ ...value, preset: e.target.value as NonNullable<TimeRange['preset']> })}
        className="px-2 py-1 text-xs bg-paper-tint/40 ring-1 ring-foreground/10 rounded-md focus:ring-accent/40 focus:outline-none"
      >
        {PRESETS.map(p => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
    </div>
  )
}
