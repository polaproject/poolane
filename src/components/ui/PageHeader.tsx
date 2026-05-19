import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  /**
   * Bigger display size (clamp 2.5-4.5rem). Default false renders text-3xl/4xl.
   * Phase 13: cả 2 đều dùng sans (lqg-headline), khác nhau ở SIZE.
   */
  display?: boolean
  className?: string
}

/**
 * @deprecated Phase 29 — Use `<PageHero>` from `@/components/layouts` instead.
 *
 * PageHero là full hero block (bao gồm `hero-block` wrapper + max-w container).
 * PageHeader CHỈ render inner content — buộc page phải tự inline `<div hero-block>...</div>`.
 *
 * Sau khi migrate 42 trang sang `<PageHero>`, component này sẽ bị xoá ở Phase 29.4.
 *
 * Phase 13 typography: cả title đều dùng sans (.lqg-headline).
 * Italic serif chỉ giữ cho quote/greeting/blog body.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  display = false,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 space-y-2">
        {eyebrow && <p className="lqg-eyebrow">{eyebrow}</p>}
        {display ? (
          <h1 className="lqg-headline text-4xl sm:text-5xl">{title}</h1>
        ) : (
          <h1 className="lqg-headline text-2xl sm:text-3xl">{title}</h1>
        )}
        {description && (
          <p className="text-sm sm:text-base opacity-75 max-w-2xl lqg-text-secondary">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}
