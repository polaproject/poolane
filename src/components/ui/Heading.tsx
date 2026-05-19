import * as React from 'react'
import { cn } from '@/lib/utils'

type Level = 1 | 2 | 3 | 4
type Variant = 'normal' | 'display' | 'quote' | 'blog' | 'greeting'

const LEVEL_CLASS: Record<Level, string> = {
  1: 'lqg-headline text-3xl sm:text-4xl leading-tight',
  2: 'lqg-headline text-xl sm:text-2xl leading-snug',
  3: 'lqg-headline text-base sm:text-lg leading-tight',
  4: 'lqg-headline text-sm font-semibold leading-tight',
}

interface HeadingProps {
  level: Level
  children: React.ReactNode
  /**
   * - normal (default) → sans bold, KHÔNG italic (mọi heading structural)
   * - display          → sans bold size lớn hơn (page hero, landing) — vẫn KHÔNG italic
   * - quote/blog/greeting → italic Cormorant (theo §13 — chỉ 3 case này)
   */
  variant?: Variant
  className?: string
  id?: string
}

/**
 * Phase 29 primitive — semantic heading h1-h4.
 *
 * Thay 5+ pattern inline:
 *   `<h1 className="font-heading text-4xl sm:text-5xl italic ...">` (VI PHẠM §13)
 *   `<h1 className="lqg-headline text-2xl">`
 *   `<h1 className="lqg-display ...">`
 *
 * Bằng 1 component: `<Heading level={1|2|3|4} variant?="..." />`
 *
 * §13 italic discipline ENFORCED:
 *   - variant 'normal'/'display' → KHÔNG italic (mặc định, mọi heading structural)
 *   - variant 'quote'/'blog'/'greeting' → italic Cormorant (chỉ 3 case này)
 */
export function Heading({ level, variant = 'normal', children, className, id }: HeadingProps) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4'

  // Display variant: tăng size cho hero page (chỉ áp cho level 1)
  const baseClass =
    variant === 'display' && level === 1
      ? 'lqg-headline text-4xl sm:text-5xl leading-tight'
      : LEVEL_CLASS[level]

  // Italic CHỈ 3 case theo §13
  const italicClass =
    variant === 'quote' || variant === 'blog' || variant === 'greeting' ? 'italic font-display' : ''

  return (
    <Tag id={id} className={cn(baseClass, italicClass, className)}>
      {children}
    </Tag>
  )
}
