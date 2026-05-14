'use client'

import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface RefinedNumberProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}

/**
 * RefinedNumber — Cormorant italic serif cho số tiền/count (family.co signature).
 * Dùng cho giá, percentage, stat values.
 */
export function RefinedNumber({ children, size = 'lg', className, ...rest }: RefinedNumberProps) {
  return (
    <span
      className={cn('lqg-numeric', `lqg-numeric-${size}`, className)}
      {...rest}
    >
      {children}
    </span>
  )
}
