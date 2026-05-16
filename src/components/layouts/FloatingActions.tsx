'use client'

import { useEffect, useState, useCallback } from 'react'
import type { UserRole } from '@/lib/auth'
import { NotificationFab } from './NotificationFab'
import { QuickAddFab } from './QuickAddFab'

type OpenPanel = 'notif' | 'add' | null

interface FloatingActionsProps {
  role: UserRole
  /** Khi sidebar mobile mở → ẩn FAB để không peek qua backdrop (cùng z-40) */
  hidden?: boolean
}

/**
 * Mobile bottom nav cao ~60px → FAB cần đẩy lên trên để không bị che.
 * Desktop (lg+) không có bottom nav → 20px là đủ.
 *
 * Edge case: trên `/student/shop` khi giỏ hàng có item, sticky cart bar
 * (z-30, fixed bottom) overlap với FAB → MutationObserver detect element
 * có `data-shop-cart-bar` → đẩy FAB lên thêm chiều cao cart.
 */
export function FloatingActions({ role, hidden = false }: FloatingActionsProps) {
  /** Chỉ 1 popover mở tại 1 thời điểm — tránh stack 2 panel chồng nhau */
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null)
  const onNotifChange = useCallback((open: boolean) => setOpenPanel(open ? 'notif' : null), [])
  const onAddChange = useCallback((open: boolean) => setOpenPanel(open ? 'add' : null), [])

  /** Chiều cao cart sticky bar nếu đang hiện diện (`/student/shop`) — override baseline */
  const [cartHeight, setCartHeight] = useState(0)

  useEffect(() => {
    function measure() {
      const cart = document.querySelector('[data-shop-cart-bar]') as HTMLElement | null
      setCartHeight(cart ? cart.getBoundingClientRect().height : 0)
    }
    measure()
    const obs = new MutationObserver(measure)
    obs.observe(document.body, { childList: true, subtree: true, attributes: true })
    window.addEventListener('resize', measure)
    return () => {
      obs.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  // Cart bar thay thế bottom-nav clearance (cùng vị trí bottom-0). Khi cart hiện:
  // baseline = cart.height + 12. Khi không cart: baseline = 64 mobile / 0 desktop (bottom-nav).
  const mobileBase = cartHeight > 0 ? `${cartHeight + 12}px` : '64px'
  const desktopBase = cartHeight > 0 ? `${cartHeight + 12}px` : '0px'

  return (
    <div
      aria-hidden={hidden}
      style={
        {
          '--fab-base-mobile': mobileBase,
          '--fab-base-desktop': desktopBase,
        } as React.CSSProperties
      }
      className={`fixed right-5 z-40 flex flex-col gap-3 pointer-events-none
                  bottom-[calc(var(--fab-base-mobile,64px)+1.25rem+env(safe-area-inset-bottom,0px))]
                  lg:bottom-[calc(var(--fab-base-desktop,0px)+1.25rem+env(safe-area-inset-bottom,0px))]
                  transition-[bottom,opacity] duration-200
                  ${hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className={hidden ? '' : 'pointer-events-auto'}>
        <NotificationFab open={openPanel === 'notif'} onOpenChange={onNotifChange} />
      </div>
      <div className={hidden ? '' : 'pointer-events-auto'}>
        <QuickAddFab role={role} open={openPanel === 'add'} onOpenChange={onAddChange} />
      </div>
    </div>
  )
}
