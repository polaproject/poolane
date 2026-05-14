'use client'

import { LazyMotion, domAnimation, m, type Variants } from 'motion/react'
import { type ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  /** Delay tính bằng giây (default 0) */
  delay?: number
  /** Khoảng dịch chuyển ban đầu theo trục Y (px). Default 24. */
  y?: number
  /** Khoảng dịch chuyển ban đầu theo trục X (px). Default 0. */
  x?: number
  /** Có chỉ animate 1 lần không (default true). */
  once?: boolean
  /** Duration giây (default 0.6). */
  duration?: number
  className?: string
}

/**
 * ScrollReveal — fade + slide vào khi cuộn tới element.
 * Dùng spring easing. Tự respect prefers-reduced-motion.
 *
 * @example
 * <ScrollReveal delay={0.1} y={20}>
 *   <Card>...</Card>
 * </ScrollReveal>
 */
export function ScrollReveal({
  children,
  delay = 0,
  y = 24,
  x = 0,
  once = true,
  duration = 0.6,
  className,
}: ScrollRevealProps) {
  const variants: Variants = {
    hidden: { opacity: 0, y, x },
    visible: { opacity: 1, y: 0, x: 0 },
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount: 0.15 }}
        variants={variants}
        transition={{
          duration,
          delay,
          ease: [0.25, 1, 0.5, 1], // ease-out-quart
        }}
        className={className}
      >
        {children}
      </m.div>
    </LazyMotion>
  )
}
