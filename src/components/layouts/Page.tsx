import * as React from 'react'
import { cn } from '@/lib/utils'

type BottomSpace = 'default' | 'cart' | 'none'

interface PageProps {
  children: React.ReactNode
  /**
   * Bottom padding reserved space:
   *   - default → `--page-pb` (48px)
   *   - cart    → `--page-pb-with-cart` (128px, dùng cho /student/shop có cart bar)
   *   - none    → 0 (auth pages centered)
   */
  bottomSpace?: BottomSpace
  className?: string
}

const BOTTOM_VAR: Record<BottomSpace, string> = {
  default: 'var(--page-pb)',
  cart: 'var(--page-pb-with-cart)',
  none: '0',
}

/**
 * Phase 29 primitive — top-level page wrapper.
 *
 * Thay `<div className="min-h-screen pb-12">` (64 trang lặp).
 *
 * - min-h-screen luôn áp (đảm bảo page fill viewport).
 * - paddingBottom qua CSS var → sửa --page-pb 1 chỗ → 99 trang đổi.
 * - bottomSpace="cart" cho shop (chừa chỗ cart-drawer).
 * - bottomSpace="none" cho auth/centered layout.
 */
export function Page({ children, bottomSpace = 'default', className }: PageProps) {
  return (
    <div
      className={cn('min-h-screen', className)}
      style={{ paddingBottom: BOTTOM_VAR[bottomSpace] }}
    >
      {children}
    </div>
  )
}
