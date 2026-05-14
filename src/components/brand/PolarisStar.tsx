'use client'

import { logoConfig } from '@/config/theme.config'
import { cn } from '@/lib/utils'

interface PolarisStarProps {
  /** Kích thước tổng (px). Default 56. */
  size?: number
  /** Có hiển thị mặt nước + ngôi sao phản chiếu không. Default true. */
  withReflection?: boolean
  /** Có animate twinkle + slow rotate không. Default true. */
  animated?: boolean
  /** Có glow halo accent quanh sao không. Default false. */
  glow?: boolean
  /** Màu fill (mặc định lấy từ currentColor theme). */
  color?: string
  className?: string
}

/**
 * PolarisStar — biểu tượng Sao Bắc Đẩu brand Poolane.
 * Có thể animate twinkle (mờ-tỏ) + slow rotate (60s).
 * Reflection lag effect: sao phản chiếu twinkle chậm hơn 400ms.
 */
export function PolarisStar({
  size = 56,
  withReflection = true,
  animated = true,
  glow = false,
  color = 'currentColor',
  className,
}: PolarisStarProps) {
  // viewBox của logo: 52×52 cho star only, 52×72 nếu có reflection
  const viewBoxH = withReflection ? 72 : 52
  const aspectRatio = 52 / viewBoxH

  return (
    <span
      aria-hidden="true"
      className={cn('inline-block relative align-middle', glow && 'motion-glow rounded-full', className)}
      style={{ width: size, height: size / aspectRatio }}
    >
      <svg
        viewBox={`0 0 52 ${viewBoxH}`}
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main Polaris star */}
        <g className={cn(animated && 'motion-twinkle')} style={{ transformOrigin: '26px 26px' }}>
          <path d={logoConfig.iconPath} fill={color} />
        </g>

        {withReflection && (
          <>
            {/* Water surface line */}
            <line
              x1="8"
              y1="58"
              x2="44"
              y2="58"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.55"
            />
            {/* Reflection star — twinkle delayed bằng animation-delay */}
            <g
              className={cn(animated && 'motion-twinkle')}
              style={{
                transformOrigin: '26px 66px',
                opacity: 0.35,
                animationDelay: '0.4s',
              }}
            >
              <path d={logoConfig.reflectionPath} fill={color} />
            </g>
          </>
        )}
      </svg>
    </span>
  )
}
