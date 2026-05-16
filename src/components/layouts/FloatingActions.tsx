'use client'

import { useEffect, useState, useCallback } from 'react'
import type { UserRole } from '@/lib/auth'
import { NotificationFab } from './NotificationFab'
import { QuickAddFab } from './QuickAddFab'

type OpenPanel = 'notif' | 'add' | null

/** Settings từ /api/settings — null khi đang loading, default object khi fetch xong */
interface PublicSettings {
  quick_add: { admin: string[]; staff: string[]; student: string[] }
  notif_filter: { types: string[] }
}

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

  /** Admin-configured settings (Quick Add items + notification filter) */
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(j => { if (j.data) setSettings(j.data) })
      .catch(() => { /* silent — fallback default trong child component */ })
  }, [])

  // Phase 18.13: cart bar nay ngang hàng FAB+ (right padding chừa chỗ FAB)
  // → FAB KHÔNG cần push up khi cart hiện. Giữ baseline ổn định:
  // mobile = 64px (bottom-nav clearance), desktop = 0.
  const mobileBase = '64px'
  const desktopBase = '0px'

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
        <NotificationFab
          open={openPanel === 'notif'}
          onOpenChange={onNotifChange}
          allowedTypes={settings?.notif_filter.types ?? []}
        />
      </div>
      <div className={hidden ? '' : 'pointer-events-auto'}>
        <QuickAddFab
          role={role}
          open={openPanel === 'add'}
          onOpenChange={onAddChange}
          itemKeys={settings?.quick_add[role] ?? null}
        />
      </div>
    </div>
  )
}
