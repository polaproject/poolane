'use client'

import { type HTMLAttributes, type ReactNode } from 'react'

interface RefinedNumberProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  /** Font size scale */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}

const SIZE_MAP = {
  sm: '1rem',
  md: '1.25rem',
  lg: '1.75rem',
  xl: '2.5rem',
  '2xl': '3.5rem',
  '3xl': '4.5rem',
}

/**
 * RefinedNumber — số tiền / số liệu refined italic serif (family.co signature).
 * Dùng cho giá, count, percentage.
 */
export function RefinedNumber({ children, size = 'lg', className, style, ...rest }: RefinedNumberProps) {
  return (
    <span
      className={`lqg-numeric ${className ?? ''}`}
      style={{
        fontSize: SIZE_MAP[size],
        lineHeight: 1,
        display: 'inline-block',
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  )
}
