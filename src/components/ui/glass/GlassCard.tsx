'use client'

import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Glass depth tier. Default 'medium'. */
  tier?: 'light' | 'medium' | 'heavy'
  /** Concentric radius. Default 'lg' (24px). */
  radius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Hover lift + accent glow. Default true. */
  interactive?: boolean
}

/**
 * GlassCard — Apple Liquid Glass card primitive.
 * Phase 16: bỏ prop `specular` (lqg-specular animation).
 * Card tĩnh — chỉ frosted bg + blur + border + hover.
 */
export function GlassCard({
  children,
  tier = 'medium',
  radius = 'lg',
  interactive = true,
  className,
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'lqg-card',
        `lqg-card-${tier}`,
        `lqg-r-${radius}`,
        interactive && 'lqg-card-hover',
        className
      )}
      {...rest}
    >
      <div className="lqg-card-inner">{children}</div>
    </div>
  )
}
