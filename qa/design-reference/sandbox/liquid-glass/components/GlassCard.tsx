'use client'

import { type HTMLAttributes, type ReactNode } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Glass depth tier. light = subtle, medium (default) = chuẩn, heavy = modal/hero focal */
  tier?: 'light' | 'medium' | 'heavy'
  /** Bo góc. Mặc định 'lg' (24px). */
  radius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Có lift + accent glow khi hover. Default true. */
  interactive?: boolean
  /** Bật specular streak chạy chéo. Default true. */
  specular?: boolean
}

const TIER_STYLE = {
  light:  { bg: 'var(--lqg-bg-glass)', lens: 'var(--lqg-lens-light)' },
  medium: { bg: 'var(--lqg-bg-glass)', lens: 'var(--lqg-lens-medium)' },
  heavy:  { bg: 'var(--lqg-bg-glass-strong)', lens: 'var(--lqg-lens-heavy)' },
}

const RADIUS_MAP = {
  sm: 'var(--lqg-r-sm)',
  md: 'var(--lqg-r-md)',
  lg: 'var(--lqg-r-lg)',
  xl: 'var(--lqg-r-xl)',
  '2xl': 'var(--lqg-r-2xl)',
}

export function GlassCard({
  children,
  tier = 'medium',
  radius = 'lg',
  interactive = true,
  specular = true,
  className,
  style,
  ...rest
}: GlassCardProps) {
  const t = TIER_STYLE[tier]
  return (
    <div
      className={`lqg-glass-card ${specular ? 'lqg-specular' : ''} ${interactive ? 'lqg-hover' : ''} ${className ?? ''}`}
      style={{
        position: 'relative',
        background: t.bg,
        backdropFilter: t.lens,
        WebkitBackdropFilter: t.lens,
        border: '1px solid var(--lqg-edge-hi)',
        borderRadius: RADIUS_MAP[radius],
        boxShadow: tier === 'heavy' ? 'var(--lqg-shadow-glass)' : 'var(--lqg-shadow-card)',
        overflow: 'hidden',
        isolation: 'isolate',
        transition: 'transform 350ms var(--lqg-ease-overshoot), box-shadow 350ms var(--lqg-ease-soft)',
        ...style,
      }}
      {...rest}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      <style jsx>{`
        .lqg-hover:hover {
          transform: translateY(-4px) scale(1.012);
          box-shadow: var(--lqg-shadow-lift);
        }
        .lqg-hover:active {
          transform: translateY(-1px) scale(0.985);
          transition-duration: 150ms;
          transition-timing-function: var(--lqg-ease-snappy);
          filter: brightness(0.96);
        }
      `}</style>
    </div>
  )
}
