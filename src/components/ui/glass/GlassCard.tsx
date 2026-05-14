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
  /** Specular streak animation. Default true. */
  specular?: boolean
}

/**
 * GlassCard — Apple Liquid Glass card primitive (Phase 12 production).
 * Built on `.lqg-*` token system. Theme-aware via root class `.lqg-dark`.
 */
export function GlassCard({
  children,
  tier = 'medium',
  radius = 'lg',
  interactive = true,
  specular = true,
  className,
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'lqg-card',
        `lqg-card-${tier}`,
        `lqg-r-${radius}`,
        specular && 'lqg-specular',
        interactive && 'lqg-card-hover',
        className
      )}
      {...rest}
    >
      <div className="lqg-card-inner">{children}</div>
    </div>
  )
}
