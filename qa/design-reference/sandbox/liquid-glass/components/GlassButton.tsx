'use client'

import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const SIZE = {
  sm: { padding: '0.5rem 1rem', fontSize: '0.85rem', height: '34px' },
  md: { padding: '0.7rem 1.4rem', fontSize: '0.95rem', height: '42px' },
  lg: { padding: '0.95rem 1.8rem', fontSize: '1.05rem', height: '52px' },
}

export function GlassButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  style,
  ...rest
}: GlassButtonProps) {
  const s = SIZE[size]

  const variantStyle: React.CSSProperties =
    variant === 'primary'
      ? {
          background: 'linear-gradient(135deg, var(--lqg-accent), var(--lqg-accent-deep))',
          color: 'var(--lqg-text-on-accent)',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.45) inset, 0 8px 24px -6px color-mix(in srgb, var(--lqg-accent) 45%, transparent)',
          border: '1px solid var(--lqg-accent-deep)',
        }
      : variant === 'secondary'
        ? {
            background: 'var(--lqg-bg-glass-strong)',
            backdropFilter: 'var(--lqg-lens-light)',
            WebkitBackdropFilter: 'var(--lqg-lens-light)',
            color: 'var(--lqg-text-primary)',
            boxShadow: 'var(--lqg-shadow-card)',
            border: '1px solid var(--lqg-edge-hi)',
          }
        : {
            background: 'transparent',
            color: 'var(--lqg-text-secondary)',
            border: '1px solid transparent',
          }

  return (
    <button
      className={`lqg-btn ${className ?? ''}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        height: s.height,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 600,
        borderRadius: 'var(--lqg-r-pill)',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        isolation: 'isolate',
        transition:
          'transform 250ms var(--lqg-ease-overshoot), filter 200ms var(--lqg-ease-soft), box-shadow 250ms var(--lqg-ease-soft)',
        ...variantStyle,
        ...style,
      }}
      {...rest}
    >
      <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        {children}
      </span>
      <style jsx>{`
        .lqg-btn:hover { transform: translateY(-2px) scale(1.025); filter: brightness(1.05); }
        .lqg-btn:active { transform: translateY(0) scale(0.96); filter: brightness(0.92); transition-duration: 120ms; }
        .lqg-btn:disabled { opacity: 0.5; pointer-events: none; }
      `}</style>
    </button>
  )
}
