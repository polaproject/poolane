import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  /** italic display style (Cormorant) */
  display?: boolean
  className?: string
}

/**
 * Page header chuẩn — eyebrow + title + description + actions.
 * Dùng đầu mọi trang dashboard/admin/student/staff để đồng bộ.
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
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {display ? (
          <h1 className="heading-display">{title}</h1>
        ) : (
          <h1 className="font-heading text-3xl sm:text-4xl leading-tight">{title}</h1>
        )}
        {description && (
          <p className="text-sm sm:text-base opacity-70 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}
