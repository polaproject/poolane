'use client'

import { LazyMotion, domAnimation, m } from 'motion/react'
import { Children, type ReactNode } from 'react'

interface StaggerProps {
  children: ReactNode
  /** Delay giữa các item (giây). Default 0.08. */
  step?: number
  /** Delay khởi đầu (giây). Default 0. */
  initialDelay?: number
  /** Khoảng dịch chuyển Y ban đầu (px). Default 16. */
  y?: number
  /** Có chỉ animate 1 lần không. Default true. */
  once?: boolean
  className?: string
}

/**
 * Stagger — wrap nhiều children, fade-slide-in tuần tự theo index.
 *
 * @example
 * <Stagger step={0.1}>
 *   <Card>1</Card>
 *   <Card>2</Card>
 *   <Card>3</Card>
 * </Stagger>
 */
export function Stagger({
  children,
  step = 0.08,
  initialDelay = 0,
  y = 16,
  once = true,
  className,
}: StaggerProps) {
  const items = Children.toArray(children)

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount: 0.1 }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: step,
              delayChildren: initialDelay,
            },
          },
        }}
        className={className}
      >
        {items.map((child, i) => (
          <m.div
            key={i}
            variants={{
              hidden: { opacity: 0, y },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.55, ease: [0.25, 1, 0.5, 1] },
              },
            }}
          >
            {child}
          </m.div>
        ))}
      </m.div>
    </LazyMotion>
  )
}
