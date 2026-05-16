'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Bell, Check, CheckCheck, Loader2, RefreshCw, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

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
  general: '💙',
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (data.data) {
        setNotifications(data.data.notifications)
        setUnreadCount(data.data.unreadCount)
      }
    } catch { toast.error('Không thể tải thông báo') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadNotifications() }, [loadNotifications])

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, readAt: new Date().toISOString() } : n
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  async function handleItemClick(n: Notification) {
    if (!n.readAt) {
      try { await fetch(`/api/notifications/${n.id}`, { method: 'PATCH' }) } catch {}
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    if (n.actionUrl) router.push(n.actionUrl)
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.readAt)
    await Promise.all(unread.map(n => fetch(`/api/notifications/${n.id}`, { method: 'PATCH' })))
    setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    setUnreadCount(0)
    toast.success('Đã đọc tất cả thông báo')
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-foreground" />
          <h1 className="font-heading text-2xl text-foreground">Thông báo</h1>
          {unreadCount > 0 && (
            <span className="bg-ink-soft text-paper text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" /> Đọc hết
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={loadNotifications} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-foreground/40" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-foreground/40">
          <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p>Chưa có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const clickable = !!n.actionUrl
            const Inner = (
              <div className="flex gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">
                  {TYPE_ICONS[n.type] ?? '💙'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className={`text-sm font-semibold ${!n.readAt ? 'text-foreground' : 'text-foreground/60'}`}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.readAt && (
                        <button
                          onClick={e => { e.stopPropagation(); markRead(n.id) }}
                          aria-label="Đánh dấu đã đọc"
                          className="p-1 hover:bg-foreground/8 rounded-lg transition-colors"
                        >
                          <Check className="w-3.5 h-3.5 text-[#5B8E9F]" />
                        </button>
                      )}
                      {clickable && (
                        <ArrowRight className="w-3.5 h-3.5 text-foreground/40" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-foreground/60 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-xs text-foreground/35 mt-2">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                  </p>
                </div>
              </div>
            )
            const baseCls = `glass-card border p-4 transition-colors w-full text-left ${
              !n.readAt ? 'border-foreground/20 bg-ink/2' : 'border-foreground/8 opacity-75'
            } ${clickable ? 'hover:bg-foreground/[0.04] cursor-pointer' : ''}`
            return clickable ? (
              <button
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={baseCls}
              >
                {Inner}
              </button>
            ) : (
              <div key={n.id} className={baseCls}>{Inner}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
