'use client'

import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  /** Loading state — show spinner + disable */
  loading?: boolean
}

/**
 * GlassButton — Apple Liquid Glass button (Phase 12 production).
 * Spring overshoot hover, snappy press squish, gradient primary.
 */
export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ children, variant = 'primary', size = 'md', loading, disabled, className, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'lqg-btn',
          `lqg-btn-${variant}`,
          `lqg-btn-${size}`,
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading && <Loader2 className="lqg-btn-spinner" aria-hidden="true" />}
        <span className="lqg-btn-content">{children}</span>
      </button>
    )
  }
)
GlassButton.displayName = 'GlassButton'
