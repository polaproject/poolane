'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface StarFieldProps {
  /** Số lượng sao. Default 30. */
  density?: number
  /** Kích thước tối đa của sao (px). Default 3. */
  maxSize?: number
  /** Class cho container (cần position relative/absolute để stars trải bên trong). */
  className?: string
  /** Seed để random ổn định giữa SSR/CSR. Default cố định. */
  seed?: number
}

// Simple LCG random — deterministic theo seed → SSR + CSR khớp nhau, không hydration error.
function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0xffffffff
  }
}

/**
 * StarField — trải N ngôi sao tí hon ngẫu nhiên trong container.
 * Mỗi sao có twinkle animation với delay + duration random.
 * Theme-aware (dùng currentColor — đặt text-paper hoặc text-accent ở parent).
 */
export function StarField({ density = 30, maxSize = 3, className, seed = 42 }: StarFieldProps) {
  const stars = useMemo(() => {
    const rand = seededRandom(seed)
    return Array.from({ length: density }, () => ({
      top: rand() * 100,
      left: rand() * 100,
      size: 1 + rand() * (maxSize - 1),
      delay: rand() * 5,
      duration: 2 + rand() * 2.5,
      opacity: 0.3 + rand() * 0.5,
    }))
  }, [density, maxSize, seed])

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {stars.map((s, i) => (
        <span
          key={i}
          className="motion-twinkle absolute rounded-full bg-current"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
