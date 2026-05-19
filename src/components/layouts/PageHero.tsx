import * as React from 'react'
import { cn } from '@/lib/utils'
import { Heading } from '@/components/ui/Heading'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Text } from '@/components/ui/Text'

type Width = 'narrow' | 'content' | 'wide' | 'full'

interface PageHeroProps {
  /** Label nhỏ trên title — có thể là string hoặc icon + text */
  eyebrow?: React.ReactNode
  /** Page title (h1) */
  title: React.ReactNode
  /** Subtitle / description ngay dưới title */
  description?: React.ReactNode
  /** Action buttons bên phải (right-aligned) */
  actions?: React.ReactNode
  /** Container max-width — narrow/content/wide/full (default 'content') */
  width?: Width
  /** Heading variant — 'display' cho hero lớn hơn, 'greeting' cho italic chào HV */
  titleVariant?: 'normal' | 'display' | 'greeting'
  className?: string
}

/**
 * Phase 29 primitive — full hero block với title/eyebrow/description/actions.
 *
 * Thay pattern (62 trang lặp):
 *   <div className="hero-block pt-8 pb-12 relative overflow-hidden">
 *     <div className="relative max-w-Xxl mx-auto">
 *       <p className="eyebrow text-paper/55 mb-2">...</p>
 *       <h1 className="font-heading text-4xl sm:text-5xl italic">...</h1>
 *       <p className="text-paper/65 text-sm mt-2 max-w-xl">...</p>
 *     </div>
 *   </div>
 *
 * Bằng:
 *   <PageHero eyebrow="..." title="..." description="..." width="wide" />
 */
export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  width = 'content',
  titleVariant = 'display',
  className,
}: PageHeroProps) {
  return (
    <div
      className={cn('hero-block relative overflow-hidden', className)}
      style={{ paddingTop: 'var(--hero-pt)', paddingBottom: 'var(--hero-pb)' }}
    >
      <div
        className="relative mx-auto flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        style={{ maxWidth: `var(--w-${width})` }}
      >
        <div className="min-w-0 flex-1 space-y-2">
          {eyebrow ? (typeof eyebrow === 'string' ? <Eyebrow>{eyebrow}</Eyebrow> : eyebrow) : null}
          <Heading level={1} variant={titleVariant}>
            {title}
          </Heading>
          {description ? (
            typeof description === 'string' ? (
              <Text variant="secondary" size="sm" className="max-w-xl mt-1">
                {description}
              </Text>
            ) : (
              description
            )
          ) : null}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
