import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href: string
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-paper-tint flex items-center justify-center mx-auto mb-3">
          <Icon className="w-7 h-7 text-foreground/35" />
        </div>
      )}
      <p className="text-base font-semibold text-foreground mb-1">{title}</p>
      {description && (
        <p className="text-sm text-foreground/55 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="inline-block mt-4 px-4 py-2 bg-ink text-paper rounded-lg text-sm font-semibold hover:bg-foreground/90 transition"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
