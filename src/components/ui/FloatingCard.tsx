import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'

interface FloatingCardProps {
  icon?: LucideIcon
  /** Label nhỏ trên title (vd "Buổi tiếp theo") */
  label?: string
  title: React.ReactNode
  /** Thông tin phụ hiển thị trong vùng meta dưới */
  meta?: React.ReactNode
  action?: { label: string; href: string }
  /** Tone: light (paper) hoặc dark (ink) */
  tone?: 'light' | 'dark'
  className?: string
}

const TONE: Record<'light' | 'dark', string> = {
  light: 'bg-paper text-foreground ring-1 ring-foreground/8',
  dark:  'bg-ink text-paper ring-1 ring-paper/12',
}

/**
 * Overlay mini-card — pattern "floating card" peeking ra từ panel chính.
 * Có icon avatar + label + title + meta + CTA.
 */
export function FloatingCard({
  icon: Icon,
  label,
  title,
  meta,
  action,
  tone = 'light',
  className,
}: FloatingCardProps) {
  return (
    <div
      className={cn(
        'rounded-card-lg p-4 shadow-glass max-w-xs',
        TONE[tone],
        className
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={cn(
              'grid place-items-center h-10 w-10 rounded-pill shrink-0',
              tone === 'light' ? 'bg-ink text-accent' : 'bg-accent text-ink'
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {label && <p className="text-xs opacity-60 leading-none">{label}</p>}
          <p className="font-heading italic text-lg leading-tight mt-1 truncate">{title}</p>
        </div>
      </div>
      {(meta || action) && (
        <div
          className={cn(
            'mt-3 pt-3 flex items-center justify-between text-xs gap-2',
            tone === 'light' ? 'border-t border-foreground/8' : 'border-t border-paper/12'
          )}
        >
          {meta && <span className="opacity-70 min-w-0 truncate">{meta}</span>}
          {action && (
            <Link
              href={action.href}
              className="inline-flex items-center gap-1 font-medium shrink-0"
            >
              {action.label} <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
