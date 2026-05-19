import * as React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'tertiary' | 'muted'
type Size = 'xs' | 'sm' | 'base' | 'lg'

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
  muted: 'text-muted',
}

const SIZE_CLASS: Record<Size, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
}

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: Variant
  size?: Size
  as?: 'p' | 'span' | 'div'
}

/**
 * Phase 29 primitive — semantic body text.
 * Thay opacity chaos (/50, /55, /65, /70, /75, /80) bằng 4 level rõ ràng.
 *
 * Variants (via --foreground color-mix):
 *   primary   → 100% (main text)
 *   secondary → 72%  (description, subtitle) DEFAULT
 *   tertiary  → 55%  (metadata)
 *   muted     → 40%  (disabled, hint)
 */
export function Text({
  variant = 'primary',
  size = 'base',
  as: As = 'p',
  className,
  ...rest
}: TextProps) {
  return <As className={cn(VARIANT_CLASS[variant], SIZE_CLASS[size], className)} {...rest} />
}
