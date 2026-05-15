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
  /** Hover state: lift + glow accent. Default TRUE (Phase 10 — Liquid Glass everywhere) */
  interactive?: boolean
  /**
   * Specular shimmer overlay animation.
   * Default FALSE (Phase 13.1 — Phase 10 over-applied, vệt sáng vương vãi khắp app).
   * Opt-in `shimmer` khi cần emphasize (vd hero CTA, modal accent).
   */
  shimmer?: boolean
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
 * Frosted glass panel — Apple Liquid Glass (Phase 10).
 * Default: shimmer + interactive ON.
 * Đặt trên `.ambient-bg` để có hiệu ứng cinematic.
 */
export function GlassPanel({
  edge = false,
  size = 'lg',
  layer = 2,
  interactive = true,
  shimmer = false,
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
        shimmer && 'glass-card', /* dùng .glass-card class để hưởng specular animation */
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
