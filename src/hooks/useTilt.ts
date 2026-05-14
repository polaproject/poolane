'use client'

import { useCallback, useRef, type RefObject } from 'react'

interface UseTiltOptions {
  /** Max tilt angle in degrees (cap ±). Default 5. */
  maxTilt?: number
  /** Damping for snap-back (ms). Default 400. */
  resetDuration?: number
}

/**
 * useTilt — 3D micro-tilt khi cursor di chuyển trên card (Apple Music style).
 * Cap ±5° default. Tự respect prefers-reduced-motion.
 *
 * @example
 * const { ref, onMouseMove, onMouseLeave } = useTilt()
 * <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} className="card-tilt">
 *   ...
 * </div>
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>(
  options: UseTiltOptions = {}
) {
  const { maxTilt = 5 } = options
  const ref = useRef<T>(null) as RefObject<T | null>

  const onMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      const el = ref.current
      if (!el) return
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / (rect.width / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)

      const tiltX = Math.max(-maxTilt, Math.min(maxTilt, dx * maxTilt))
      const tiltY = Math.max(-maxTilt, Math.min(maxTilt, -dy * maxTilt))

      el.style.setProperty('--tilt-x', `${tiltX}deg`)
      el.style.setProperty('--tilt-y', `${tiltY}deg`)
    },
    [maxTilt]
  )

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--tilt-x', '0deg')
    el.style.setProperty('--tilt-y', '0deg')
  }, [])

  return { ref, onMouseMove, onMouseLeave }
}
