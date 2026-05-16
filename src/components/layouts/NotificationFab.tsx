'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Popover } from '@base-ui/react/popover'
import { Bell, Loader2, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

type Notification = {
  id: string
  type: string
  title: string
  body: string
  readAt: string | null
  createdAt: string
  actionUrl: string | null
}

const TYPE_ICONS: Record<string, string> = {
  approval: '✅',
  rejection: '❌',
  cancellation: '🚫',
  absence: '📋',
  debt: '💰',
  birthday: '🎂',
  badge: '🏆',
  event: '🎉',
  general: '💙',
}

const POLL_MS = 60_000

interface NotificationFabProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationFab({ open, onOpenChange }: NotificationFabProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (data.data) {
        setNotifications(data.data.notifications ?? [])
        setUnreadCount(data.data.unreadCount ?? 0)
      }
    } catch {
      // silent fail — sẽ retry vòng poll sau
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    let intervalId: ReturnType<typeof setInterval> | null = null

    function startPoll() {
      if (intervalId !== null) return
      intervalId = setInterval(fetchNotifications, POLL_MS)
    }
    function stopPoll() {
      if (intervalId === null) return
      clearInterval(intervalId)
      intervalId = null
    }
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        // Tab return → fetch ngay (có thể đã idle lâu) + resume poll
        fetchNotifications()
        startPoll()
      } else {
        stopPoll()
      }
    }

    if (document.visibilityState === 'visible') startPoll()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      stopPoll()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchNotifications])

  async function handleItemClick(n: Notification) {
    if (!n.readAt) {
      try {
        await fetch(`/api/notifications/${n.id}`, { method: 'PATCH' })
      } catch {
        // ignore — state vẫn cập nhật optimistic
      }
      setNotifications(prev =>
        prev.map(x => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    onOpenChange(false)
    if (n.actionUrl) router.push(n.actionUrl)
  }

  const unread = notifications.filter(n => !n.readAt)
  const preview = (unread.length > 0 ? unread : notifications).slice(0, 7)
  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Popover.Trigger
        aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
        className="relative grid place-items-center w-[52px] h-[52px] rounded-full bg-ink text-paper dark:bg-paper dark:text-ink ring-1 ring-ink/30 dark:ring-paper/30 shadow-xl shadow-black/30 hover:scale-[1.04] active:scale-[0.97] transition-transform"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-paper text-[10px] font-bold grid place-items-center leading-none shadow-soft"
            aria-hidden
          >
            {badgeText}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="end" sideOffset={10} alignOffset={0} className="z-[60]">
          <Popover.Popup
            className="z-50 glass-panel rounded-card-lg w-[min(380px,calc(100vw-2.5rem))] max-h-[480px] flex flex-col origin-bottom-right shadow-glass overflow-hidden data-[closed]:hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/8">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-foreground">Thông báo</p>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-foreground/10 text-foreground/70">
                    {unreadCount} chưa đọc
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-1.5 py-1.5">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-4 h-4 animate-spin text-foreground/40" />
                </div>
              ) : preview.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <Bell className="w-6 h-6 mx-auto mb-2 text-foreground/30" />
                  <p className="text-sm text-foreground/50">Chưa có thông báo mới</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {preview.map(n => (
                    <li key={n.id}>
                      <button
                        onClick={() => handleItemClick(n)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex gap-2.5 transition-colors hover:bg-foreground/5 ${
                          !n.readAt ? 'bg-foreground/[0.03]' : ''
                        }`}
                      >
                        <span className="text-base flex-shrink-0 mt-0.5" aria-hidden>
                          {TYPE_ICONS[n.type] ?? '💙'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <p
                              className={`text-sm flex-1 min-w-0 truncate ${
                                !n.readAt ? 'font-semibold text-foreground' : 'text-foreground/65'
                              }`}
                            >
                              {n.title}
                            </p>
                            {!n.readAt && (
                              <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" aria-hidden />
                            )}
                          </div>
                          <p className="text-xs text-foreground/55 mt-0.5 line-clamp-2 leading-snug">
                            {n.body}
                          </p>
                          <p className="text-[10px] text-foreground/35 mt-1">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-foreground/8 px-3 py-2">
              <Popover.Close
                nativeButton={false}
                render={
                  <Link
                    href="/shared/notifications"
                    className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-foreground/70 hover:text-foreground transition-colors rounded-lg"
                  >
                    Xem tất cả
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
