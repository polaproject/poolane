'use client'

import { type HTMLAttributes, type ReactNode } from 'react'
import { useTilt } from '@/hooks/useTilt'
import { cn } from '@/lib/utils'

interface TiltCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Max tilt angle in degrees. Default 5. */
  maxTilt?: number
}

/**
 * TiltCard — wrap children với 3D micro-tilt khi hover (Apple Music style).
 * Dùng cho hero card lớn cần focus. Tránh áp cho mọi list card (perf).
 */
export function TiltCard({ children, className, maxTilt = 5, ...rest }: TiltCardProps) {
  const { ref, onMouseMove, onMouseLeave } = useTilt<HTMLDivElement>({ maxTilt })

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={cn('card-tilt', className)}
      {...rest}
    >
      {children}
    </div>
  )
}
