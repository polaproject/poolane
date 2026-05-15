'use client'

import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface RefinedNumberProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  /**
   * Variant typography (Phase 13 typography discipline):
   * - 'sans' (default): Plus Jakarta tabular-nums bold — dùng cho mọi stat/currency UI
   * - 'italic': Cormorant italic — chỉ dùng cho accent (quote drop cap, hero greeting)
   */
  variant?: 'sans' | 'italic'
}

/**
 * RefinedNumber — render số với typography discipline.
 *
 * Mặc định 'sans' (Plus Jakarta tabular numeric) — phù hợp stats, currency, count.
 * 'italic' giữ riêng cho accent moments (vd drop cap, hero greeting numeric).
 */
export function RefinedNumber({
  children,
  size = 'lg',
  variant = 'sans',
  className,
  ...rest
}: RefinedNumberProps) {
  const base = variant === 'italic' ? 'lqg-numeric' : 'lqg-numeric-sans'
  const sizeClass = variant === 'italic' ? `lqg-numeric-${size}` : `lqg-numeric-sans-${size}`
  return (
    <span className={cn(base, sizeClass, className)} {...rest}>
      {children}
    </span>
  )
}
