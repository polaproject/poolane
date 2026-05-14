'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Size variant. Default 'md'. */
  inputSize?: 'sm' | 'md' | 'lg'
}

/**
 * GlassInput — Apple Liquid Glass input field (Phase 12 production).
 * Backdrop blur, spring focus halo, refined typography.
 */
export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ inputSize = 'md', className, ...rest }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'lqg-input',
          `lqg-input-${inputSize}`,
          className
        )}
        {...rest}
      />
    )
  }
)
GlassInput.displayName = 'GlassInput'
