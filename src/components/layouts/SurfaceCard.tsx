import * as React from 'react'
import { cn } from '@/lib/utils'

type Padding = 'compact' | 'default' | 'loose' | 'none'
type Radius = 'md' | 'lg' | 'xl'

interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Padding bên trong card (default = 'default' = var(--card-p) = 20px) */
  padding?: Padding
  /** Border radius — md (16px), lg (24px), xl (28px) */
  radius?: Radius
  /** Thêm hover effect (ring + slight lift) */
  interactive?: boolean
  /** Render as <a> hoặc <button> thay <div> */
  as?: 'div' | 'a' | 'button' | 'section' | 'article'
}

const PADDING_VAR: Record<Padding, string> = {
  none: '0',
  compact: 'var(--card-p-compact)',
  default: 'var(--card-p)',
  loose: 'var(--card-p-loose)',
}

const RADIUS_CLASS: Record<Radius, string> = {
  md: 'rounded-card',
  lg: 'rounded-card-lg',
  xl: 'rounded-card-xl',
}

/**
 * Phase 29 primitive — standard surface card.
 *
 * Thay pattern (62 chỗ lặp):
 *   <div className="rounded-card-lg bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-5">
 *
 * Bằng:
 *   <SurfaceCard>
 *     ...
 *   </SurfaceCard>
 *
 * Auto-glass backdrop-filter (Phase 28.1) áp dụng qua CSS class `.bg-[var(--surface)]`
 * vẫn hoạt động vì SurfaceCard render class này.
 */
export function SurfaceCard({
  padding = 'default',
  radius = 'lg',
  interactive = false,
  as: As = 'div',
  className,
  style,
  children,
  ...rest
}: SurfaceCardProps) {
  return (
    <As
      // eslint-disable-next-line react/forbid-dom-props
      className={cn(
        'bg-[var(--surface)] ring-1 ring-foreground/8 shadow-soft',
        RADIUS_CLASS[radius],
        interactive && 'transition hover:ring-accent/40 hover:shadow-glass',
        className,
      )}
      style={{ padding: PADDING_VAR[padding], ...style }}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </As>
  )
}
