import * as React from 'react'
import { cn } from '@/lib/utils'

type Width = 'narrow' | 'content' | 'wide' | 'full'
type Gap = 'compact' | 'default' | 'loose'

interface PageContentProps {
  children: React.ReactNode
  /** Container max-width (default 'content') */
  width?: Width
  /** Vertical gap giữa các block con */
  gap?: Gap
  /** Negative-margin overlap với hero phía trên (default true).
   *  Khi false: content cách hero --hero-overlap khoảng dưới hero.
   */
  overlap?: boolean
  className?: string
}

const GAP_VAR: Record<Gap, string> = {
  compact: 'var(--section-gap-compact)',
  default: 'var(--section-gap)',
  loose: 'var(--section-gap-loose)',
}

/**
 * Phase 29 primitive — content area wrapper sau PageHero.
 *
 * Thay pattern (25+ trang dùng `-mt-6` hardcode):
 *   <div className="-mt-6 max-w-5xl mx-auto relative z-10 space-y-4">
 *
 * Bằng:
 *   <PageContent width="wide" gap="default">
 *
 * Negative margin = -var(--hero-overlap) (24px) → content overlap lên hero block.
 */
export function PageContent({
  children,
  width = 'content',
  gap = 'default',
  overlap = true,
  className,
}: PageContentProps) {
  return (
    <div
      className={cn('mx-auto relative z-10 flex flex-col', className)}
      style={{
        maxWidth: `var(--w-${width})`,
        marginTop: overlap ? 'calc(-1 * var(--hero-overlap))' : 0,
        gap: GAP_VAR[gap],
      }}
    >
      {children}
    </div>
  )
}
