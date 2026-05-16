'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Popover } from '@base-ui/react/popover'
import { Bell, Loader2, ArrowRight, CheckCheck } from 'lucide-react'
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
  /** Allowed notification types (empty = show all). Admin tự config qua /admin/settings */
  allowedTypes: string[]
}

export function NotificationFab({ open, onOpenChange, allowedTypes }: NotificationFabProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [, setUnreadCount] = useState(0)
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
    // Mark read optimistic — noti VẪN ở trong list (chỉ đổi visual đã đọc/chưa đọc).
    // Owner muốn giữ noti để user phòng bấm nhầm — chỉ visual change, không filter out.
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

  async function markAllRead() {
    const unreadList = notifications.filter(n => !n.readAt)
    if (unreadList.length === 0) return
    // Optimistic: mark all read trong state trước, gửi PATCH song song
    const nowIso = new Date().toISOString()
    setNotifications(prev => prev.map(x => x.readAt ? x : { ...x, readAt: nowIso }))
    setUnreadCount(0)
    await Promise.all(
      unreadList.map(n =>
        fetch(`/api/notifications/${n.id}`, { method: 'PATCH' }).catch(() => null)
      )
    )
  }

  // Filter theo admin settings: allowedTypes empty = show all, else chỉ hiện types trong list.
  // KHÔNG filter unread riêng — luôn show toàn bộ filtered để noti vẫn ở list sau khi đọc
  // (owner muốn user phân biệt visual read/unread, không bị "biến mất").
  const filtered = allowedTypes.length === 0
    ? notifications
    : notifications.filter(n => allowedTypes.includes(n.type))
  // Sort: unread đầu, sau đó read; trong mỗi nhóm theo createdAt desc (mặc định từ API)
  const sorted = [...filtered].sort((a, b) => {
    const aUnread = !a.readAt ? 0 : 1
    const bUnread = !b.readAt ? 0 : 1
    return aUnread - bUnread
  })
  // Owner: "hiển thị 4 tin là hợp lý, có thể cuộn lên xuống"
  // Giữ 20 noti trong DOM (perf limit) — viewport scroll area = ~4 items chiều cao
  const preview = sorted.slice(0, 20)
  const filteredUnreadCount = filtered.filter(n => !n.readAt).length
  const badgeText = filteredUnreadCount > 99 ? '99+' : String(filteredUnreadCount)

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Popover.Trigger
        aria-label={`Thông báo${filteredUnreadCount > 0 ? ` (${filteredUnreadCount} chưa đọc)` : ''}`}
        className="relative grid place-items-center w-[52px] h-[52px] rounded-full bg-ink text-paper dark:bg-paper dark:text-ink ring-1 ring-ink/30 dark:ring-paper/30 shadow-xl shadow-black/30 hover:scale-[1.04] active:scale-[0.97] transition-transform"
      >
        <Bell className="w-5 h-5" />
        {filteredUnreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-paper text-[10px] font-bold grid place-items-center leading-none shadow-soft"
            aria-hidden
          >
            {badgeText}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="left" align="end" sideOffset={10} alignOffset={0} className="z-[60]">
          <Popover.Popup
            className="z-50 glass-panel rounded-card-lg w-[min(380px,calc(100vw-2.5rem))] max-h-[480px] flex flex-col origin-bottom-right shadow-glass overflow-hidden data-[closed]:hidden"
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-foreground/8">
              <div className="flex items-center gap-2 min-w-0">
                <p className="font-semibold text-sm text-foreground">Thông báo</p>
                {filteredUnreadCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-foreground/10 text-foreground/70 flex-shrink-0">
                    {filteredUnreadCount} chưa đọc
                  </span>
                )}
              </div>
              {filteredUnreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  title="Đánh dấu tất cả là đã đọc"
                  className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline transition-colors flex-shrink-0"
                >
                  <CheckCheck className="w-3 h-3" strokeWidth={2.25} />
                  Đánh dấu đọc tất cả
                </button>
              )}
            </div>

            {/* Scroll area — viewport ~4 items (~76px mỗi item); 20 items max trong DOM */}
            <div className="overflow-y-auto px-1.5 py-1.5 max-h-[304px]">
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
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex gap-2.5 transition-colors cursor-pointer ${
                          !n.readAt
                            ? 'bg-accent/8 hover:bg-accent/12 ring-1 ring-accent/15'
                            : 'hover:bg-foreground/5'
                        }`}
                      >
                        <span className="text-base flex-shrink-0 mt-0.5" aria-hidden>
                          {TYPE_ICONS[n.type] ?? '💙'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <p
                              className={`text-sm flex-1 min-w-0 truncate ${
                                !n.readAt ? 'font-semibold text-foreground' : 'text-foreground/55'
                              }`}
                            >
                              {n.title}
                            </p>
                            {!n.readAt && (
                              <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" aria-hidden />
                            )}
                          </div>
                          <p className={`text-xs mt-0.5 line-clamp-2 leading-snug ${
                            !n.readAt ? 'text-foreground/70' : 'text-foreground/45'
                          }`}>
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
