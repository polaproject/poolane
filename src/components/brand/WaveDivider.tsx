'use client'

import { cn } from '@/lib/utils'

interface WaveDividerProps {
  /** Hướng wave: top = sóng ở mép trên, bottom = mép dưới. Default 'bottom'. */
  position?: 'top' | 'bottom'
  /** Lật ngược (sóng từ dưới lên). */
  flip?: boolean
  /** Chiều cao sóng (px). Default 80. */
  height?: number
  /** Tone màu — accent, mist, ink, paper. Default 'accent'. */
  tone?: 'accent' | 'mist' | 'ink' | 'paper'
  /** Đối lập (chìm xuống thay vì nổi lên). */
  inverted?: boolean
  className?: string
}

const TONE_FILL: Record<string, string> = {
  accent: 'fill-accent/15',
  mist: 'fill-mist/20',
  ink: 'fill-ink/12',
  paper: 'fill-paper/40',
}

const TONE_FILL_DEEP: Record<string, string> = {
  accent: 'fill-accent/25',
  mist: 'fill-mist/30',
  ink: 'fill-ink/20',
  paper: 'fill-paper/60',
}

/**
 * WaveDivider — sóng nước SVG animate, 2 layer parallax.
 * Đặt giữa các section để tạo cảm giác chuyển tiếp mềm.
 *
 * @example
 * <WaveDivider tone="mist" position="bottom" />
 */
export function WaveDivider({
  position = 'bottom',
  flip = false,
  height = 80,
  tone = 'accent',
  className,
}: WaveDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute left-0 right-0 overflow-hidden',
        position === 'top' && 'top-0',
        position === 'bottom' && 'bottom-0',
        className
      )}
      style={{ height }}
    >
      {/* Background wave — slower, deeper */}
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className={cn(
          'absolute left-0 w-[200%] h-full',
          flip && 'rotate-180'
        )}
        style={{ animation: 'pola-wave 14s linear infinite' }}
      >
        <path
          d="M0,64 C240,96 480,32 720,64 C960,96 1200,32 1440,64 L1440,120 L0,120 Z"
          className={TONE_FILL[tone]}
        />
      </svg>
      {/* Foreground wave — faster, lighter */}
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className={cn(
          'absolute left-0 w-[200%] h-full',
          flip && 'rotate-180'
        )}
        style={{ animation: 'pola-wave 8s linear infinite' }}
      >
        <path
          d="M0,80 C320,40 640,100 960,60 C1200,30 1320,70 1440,80 L1440,120 L0,120 Z"
          className={TONE_FILL_DEEP[tone]}
        />
      </svg>
    </div>
  )
}
