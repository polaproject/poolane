'use client'

import { logoConfig } from '@/config/theme.config'
import { cn } from '@/lib/utils'

interface PolarisStarProps {
  /** Kích thước (px). Default 56. */
  size?: number
  /** Có animate twinkle (mờ-tỏ) không. Default true. */
  animated?: boolean
  /** Màu fill (mặc định lấy từ currentColor theme). */
  color?: string
  className?: string
}

/**
 * PolarisStar — biểu tượng Sao Bắc Đẩu brand Poolane.
 * Đơn giản: chỉ render ngôi sao, có thể twinkle animation.
 * Phase 16: bỏ withReflection (water line + reflection star) và glow halo
 * → hoàn toàn không có decoration xung quanh logo.
 */
export function PolarisStar({
  size = 56,
  animated = true,
  color = 'currentColor',
  className,
}: PolarisStarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block relative align-middle', className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 52 52"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className={cn(animated && 'motion-twinkle')} style={{ transformOrigin: '26px 26px' }}>
          <path d={logoConfig.iconPath} fill={color} />
        </g>
      </svg>
    </span>
  )
}
