'use client'

import { useState, useEffect, useCallback } from 'react'
import { Popover } from '@base-ui/react/popover'
import { MessageSquare } from 'lucide-react'
import type { UserRole } from '@/lib/auth'
import { MessagesPopover } from '@/components/features/chat/MessagesPopover'

const POLL_MS = 60_000

interface MessagesFabProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: UserRole
  currentUserId: string
  currentUserName: string
  currentUserAvatar: string | null
}

/**
 * MessagesFab — FAB tin nhắn với popover chat (Intercom-style).
 * Click → mở popover (KHÔNG navigate). Footer popover có link tới full page.
 *
 * Polling unread-count 60s khi tab visible. Pause khi tab hidden.
 */
export function MessagesFab({
  open,
  onOpenChange,
  role,
  currentUserId,
  currentUserName,
  currentUserAvatar,
}: MessagesFabProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchCount = useCallback(async () => {
    try {
      const r = await fetch('/api/conversations/unread-count')
      const j = await r.json()
      if (j.data) setUnreadCount(j.data.count ?? 0)
    } catch {
      /* silent */
    }
  }, [])

  useEffect(() => {
    fetchCount()
    let intervalId: ReturnType<typeof setInterval> | null = null

    function startPoll() {
      if (intervalId !== null) return
      intervalId = setInterval(fetchCount, POLL_MS)
    }
    function stopPoll() {
      if (intervalId === null) return
      clearInterval(intervalId)
      intervalId = null
    }
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        fetchCount()
        startPoll()
      } else {
        stopPoll()
      }
    }

    startPoll()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      stopPoll()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchCount])

  // Khi popover đóng → re-fetch unread count (vì user có thể vừa đọc tin)
  useEffect(() => {
    if (!open) fetchCount()
  }, [open, fetchCount])

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Popover.Trigger
        aria-label={`Tin nhắn${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
        className="relative grid place-items-center w-[52px] h-[52px] rounded-full
                   bg-ink text-paper dark:bg-paper dark:text-ink
                   ring-1 ring-ink/30 dark:ring-paper/30
                   shadow-xl shadow-black/30
                   hover:scale-[1.04] active:scale-[0.97] transition-transform cursor-pointer"
      >
        <MessageSquare className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full
                       bg-danger text-paper text-[10px] font-bold grid place-items-center
                       leading-none shadow-soft"
            aria-hidden
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        {/* collisionPadding=8 + width formula `100vw - 7rem` đảm bảo side="left"
            LUÔN fit bên trái FAB trên mọi viewport (iPhone SE 375 → desktop).
            Tránh base-ui auto-flip side khi viewport hẹp.
            7rem = FAB 52 + right 20 + sideOffset 10 + collisionPad 8 + buffer 22 */}
        <Popover.Positioner side="left" align="end" sideOffset={10} alignOffset={0} collisionPadding={8} className="z-[60]">
          <Popover.Popup
            className="z-50 relative glass-panel rounded-card-lg shadow-glass overflow-hidden
                       w-[min(380px,calc(100vw-7rem))] h-[min(480px,calc(100vh-15rem))]
                       origin-bottom-right data-[closed]:hidden"
          >
            <MessagesPopover
              role={role}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              currentUserAvatar={currentUserAvatar}
              onClose={() => onOpenChange(false)}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
