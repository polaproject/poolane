import * as React from 'react'
import { cn } from '@/lib/utils'

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Hiện viền sáng mảnh ở đầu panel (cinematic edge) */
  edge?: boolean
  /** Bo nhỏ hơn (card) thay vì card-xl */
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_RADIUS = {
  sm: 'rounded-card',
  md: 'rounded-card-lg',
  lg: 'rounded-card-xl',
}

/**
 * Frosted glass panel — semi-transparent surface với blur + ring + soft shadow.
 * Đặt trên `.ambient-bg` để có hiệu ứng cinematic.
 */
export function GlassPanel({
  edge = false,
  size = 'lg',
  className,
  children,
  ...rest
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'glass-panel',
        edge && 'glass-panel-edge',
        SIZE_RADIUS[size],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
