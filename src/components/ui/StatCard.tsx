import * as React from 'react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: React.ReactNode
  /** Đơn vị nhỏ kế bên value (vd "đ", "buổi") */
  unit?: string
  /** Phần trăm thay đổi (number) hoặc node tự do */
  trend?: number | React.ReactNode
  /** Diễn giải dưới trend (vd "so với tuần trước") */
  trendLabel?: string
  icon?: LucideIcon
  /** Biến thể nền */
  tone?: 'surface' | 'dark' | 'accent'
  className?: string
}

const TONE_BG: Record<NonNullable<StatCardProps['tone']>, string> = {
  /* Phase 10 — Liquid Glass: surface dùng glass-card có specular + lensing */
  surface: 'glass-card glass-card-hover text-[var(--surface-fg)]',
  dark:    'bg-ink/90 backdrop-blur-xl text-paper ring-1 ring-paper/15 glass-card-hover',
  accent:  'bg-accent-soft/85 backdrop-blur-md text-foreground ring-1 ring-accent/40',
}

/**
 * KPI / Stat card chuẩn — label trên, value bự ở giữa, trend bên dưới.
 */
export function StatCard({
  label,
  value,
  unit,
  trend,
  trendLabel,
  icon: Icon,
  tone = 'surface',
  className,
}: StatCardProps) {
  const numericTrend = typeof trend === 'number' ? trend : null
  const TrendIcon = numericTrend === null ? null : numericTrend >= 0 ? TrendingUp : TrendingDown
  const trendTone =
    numericTrend === null
      ? ''
      : numericTrend >= 0
        ? 'text-success'
        : 'text-danger'

  return (
    <div
      className={cn(
        'rounded-card-lg p-5 transition-[transform,box-shadow] duration-300 [transition-timing-function:var(--ease-out-quart)]',
        TONE_BG[tone],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow text-current opacity-65">{label}</p>
        {Icon && (
          <span className="grid place-items-center h-8 w-8 rounded-pill bg-current/8">
            <Icon className="h-4 w-4 opacity-80" strokeWidth={1.75} />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-heading text-3xl sm:text-4xl leading-none">{value}</span>
        {unit && <span className="text-sm opacity-65">{unit}</span>}
      </div>
      {(trend !== undefined || trendLabel) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {numericTrend !== null && TrendIcon && (
            <span className={cn('inline-flex items-center gap-1 font-medium', trendTone)}>
              <TrendIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
              {numericTrend >= 0 ? '+' : ''}{numericTrend}%
            </span>
          )}
          {numericTrend === null && trend !== undefined && (
            <span className="font-medium">{trend}</span>
          )}
          {trendLabel && <span className="opacity-60">{trendLabel}</span>}
        </div>
      )}
    </div>
  )
}
