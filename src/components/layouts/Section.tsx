import * as React from 'react'
import { cn } from '@/lib/utils'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'

interface SectionProps {
  /** Section title (h2) — optional */
  title?: React.ReactNode
  /** Description ngay dưới title */
  description?: React.ReactNode
  /** Action element bên phải header (button, link) */
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * Phase 29 primitive — group of cards/content with optional header.
 *
 * Thay pattern inline:
 *   <section className="space-y-3">
 *     <div className="flex items-end justify-between">
 *       <div>
 *         <h2 className="lqg-headline text-xl sm:text-2xl">...</h2>
 *         <p className="text-sm text-foreground/65">...</p>
 *       </div>
 *       <button>...</button>
 *     </div>
 *     {children}
 *   </section>
 *
 * Bằng:
 *   <Section title="..." description="..." actions={<Button />}>...</Section>
 */
export function Section({ title, description, actions, children, className }: SectionProps) {
  const hasHeader = !!(title || actions)
  return (
    <section className={cn('space-y-3', className)}>
      {hasHeader && (
        <header className="flex items-end justify-between gap-3 flex-wrap">
          {(title || description) && (
            <div className="min-w-0">
              {title && <Heading level={2}>{title}</Heading>}
              {description &&
                (typeof description === 'string' ? (
                  <Text variant="secondary" size="sm">
                    {description}
                  </Text>
                ) : (
                  description
                ))}
            </div>
          )}
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
