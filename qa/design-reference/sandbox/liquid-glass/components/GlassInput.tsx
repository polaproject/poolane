'use client'

import { type InputHTMLAttributes } from 'react'

export function GlassInput({ className, style, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`lqg-input ${className ?? ''}`}
      style={{
        width: '100%',
        height: '44px',
        padding: '0 1rem',
        fontSize: '0.95rem',
        background: 'var(--lqg-bg-glass)',
        backdropFilter: 'blur(8px) saturate(120%)',
        WebkitBackdropFilter: 'blur(8px) saturate(120%)',
        border: '1px solid var(--lqg-edge-hi)',
        borderRadius: 'var(--lqg-r-md)',
        color: 'var(--lqg-text-primary)',
        outline: 'none',
        transition:
          'background 220ms var(--lqg-ease-soft), border-color 220ms var(--lqg-ease-soft), box-shadow 280ms var(--lqg-ease-overshoot)',
        ...style,
      }}
      {...rest}
    />
  )
}
