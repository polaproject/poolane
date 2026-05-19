import * as React from 'react'
import { cn } from '@/lib/utils'

interface EyebrowProps extends React.HTMLAttributes<HTMLParagraphElement> {
  icon?: React.ReactNode
}

/**
 * Phase 29 primitive — eyebrow label trước title.
 * Thay 60% chỗ inline `text-xs tracking-widest uppercase` bằng 1 component.
 *
 * Style: text-[0.7rem] tracking-widest uppercase + var(--text-tertiary).
 * Icon optional bên trái (vd <Icon /> + "Báo cáo tuỳ chỉnh").
 */
export function Eyebrow({ icon, className, children, ...rest }: EyebrowProps) {
  return (
    <p
      className={cn(
        'lqg-eyebrow text-tertiary inline-flex items-center gap-1.5',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </p>
  )
}
