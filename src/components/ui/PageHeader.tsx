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
 * Page header chuẩn — eyebrow + title + description + actions.
 * Dùng đầu mọi trang dashboard/admin/student/staff để đồng bộ.
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
