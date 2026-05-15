import * as React from 'react'
import { cn } from '@/lib/utils'

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Hiện viền sáng mảnh ở đầu panel (cinematic edge) */
  edge?: boolean
  /** Bo nhỏ hơn (card) thay vì card-xl */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Multi-tier depth (Phase 8C — visionOS layering):
   * 1 = base (subtle blur, dùng cho panel nền)
   * 2 = mid (default, frosted glass chuẩn)
   * 3 = top (deep blur + glow shadow, dùng cho modal, hero CTA)
   */
  layer?: 1 | 2 | 3
  /** Hover state: lift + glow accent. Default TRUE. */
  interactive?: boolean
}

const SIZE_RADIUS = {
  sm: 'rounded-card',
  md: 'rounded-card-lg',
  lg: 'rounded-card-xl',
}

const LAYER_CLASS = {
  1: 'glass-layer-1',
  2: 'glass-panel',
  3: 'glass-layer-3',
}

/**
 * Frosted glass panel — Apple Liquid Glass.
 * Phase 16: bỏ prop `shimmer` (specular streak animation).
 * Panel hoàn toàn tĩnh — chỉ frosted bg + blur + border + hover.
 */
export function GlassPanel({
  edge = false,
  size = 'lg',
  layer = 2,
  interactive = true,
  className,
  children,
  ...rest
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        LAYER_CLASS[layer],
        edge && 'glass-panel-edge',
        interactive && 'glass-panel-hover',
        SIZE_RADIUS[size],
        'relative isolate overflow-hidden',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
