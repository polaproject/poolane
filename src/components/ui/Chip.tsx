import * as React from 'react'
import { cn } from '@/lib/utils'

type ChipVariant = 'neutral' | 'accent' | 'mist' | 'success' | 'warn' | 'danger'

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant
  active?: boolean
  asButton?: boolean
}

const VARIANT_BG: Record<ChipVariant, string> = {
  neutral: 'bg-paper-tint text-ink',
  accent:  'bg-accent-soft text-ink',
  mist:    'bg-mist/15 text-ink',
  success: 'bg-success/15 text-success',
  warn:    'bg-warn/15 text-warn',
  danger:  'bg-danger/15 text-danger',
}

const VARIANT_ACTIVE: Record<ChipVariant, string> = {
  neutral: 'bg-ink text-paper',
  accent:  'bg-accent text-ink',
  mist:    'bg-mist text-paper',
  success: 'bg-success text-paper',
  warn:    'bg-warn text-paper',
  danger:  'bg-danger text-paper',
}

/** Pill chip — dùng cho filter, tag, segment nav */
export function Chip({
  variant = 'neutral',
  active = false,
  asButton = false,
  className,
  children,
  ...rest
}: ChipProps) {
  const Comp = asButton ? 'button' : 'span'
  return (
    <Comp
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-medium transition-all',
        active ? VARIANT_ACTIVE[variant] : VARIANT_BG[variant],
        asButton && 'cursor-pointer hover:opacity-90 active:scale-[0.98]',
        className
      )}
      {...(rest as React.HTMLAttributes<HTMLElement>)}
    >
      {children}
    </Comp>
  )
}
