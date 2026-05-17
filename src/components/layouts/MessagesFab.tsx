'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import type { UserRole } from '@/lib/auth'

const POLL_MS = 60_000

const MESSAGES_HREF: Record<UserRole, string> = {
  admin: '/admin/messages',
  staff: '/staff/messages',
  student: '/student/messages',
}

interface MessagesFabProps {
  role: UserRole
}

export function MessagesFab({ role }: MessagesFabProps) {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchCount = useCallback(async () => {
    try {
      const r = await fetch('/api/conversations/unread-count')
      const j = await r.json()
      if (j.data) setUnreadCount(j.data.count ?? 0)
    } catch { /* silent */ }
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

  return (
    <button
      onClick={() => router.push(MESSAGES_HREF[role])}
      aria-label={`Tin nhắn${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
      className="relative h-12 w-12 rounded-pill bg-ink dark:bg-paper text-paper dark:text-ink
                 shadow-glass hover:scale-105 active:scale-95 transition-transform
                 grid place-items-center"
    >
      <MessageSquare className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1
                         bg-accent text-ink text-[10px] font-bold rounded-pill
                         grid place-items-center leading-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
