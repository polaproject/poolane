'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, MessageSquare, Loader2, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Avatar } from '@/components/ui/Avatar'
import type { UserRole } from '@/lib/auth'
import { StudentPicker } from './StudentPicker'
import { ChatThread } from './ChatThread'

interface Participant {
  id: string
  fullName: string
  avatarUrl: string | null
  role?: string
}

interface Conversation {
  id: string
  staffUserId: string
  studentId: string
  lastMessageAt: string | null
  lastMessagePreview: string | null
  isResolved: boolean
  unreadCount: number
  staffUser: Participant
  student?: { id: string; user: { id: string; fullName: string; avatarUrl: string | null } }
}

interface MessagesPopoverProps {
  role: UserRole
  currentUserId: string
  currentUserName: string
  currentUserAvatar: string | null
  /** Khi popover đóng, parent có thể dùng để refresh badge count */
  onClose?: () => void
}

const FULL_PAGE_HREF: Record<UserRole, string> = {
  admin: '/admin/messages',
  staff: '/staff/messages',
  student: '/student/messages',
}

/**
 * Popover chat — 2 view:
 * - 'list': danh sách conversation + "+ Mới" + footer "Xem tất cả →"
 * - 'chat': single conversation thread (ChatThread)
 *
 * Polling: list view poll 10s, chat view poll 3s (xử lý trong ChatThread).
 */
export function MessagesPopover({
  role,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onClose,
}: MessagesPopoverProps) {
  const isStaff = role === 'admin' || role === 'staff'

  const [view, setView] = useState<'list' | 'chat'>('list')
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [creating, setCreating] = useState(false)

  const fetchConversations = useCallback(async () => {
    try {
      const r = await fetch('/api/conversations')
      const j = await r.json()
      if (j.data?.conversations) {
        setConversations(j.data.conversations)
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
    // Polling chỉ trong list view (chat view có polling riêng)
    if (view !== 'list') return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchConversations()
    }, 10_000)
    return () => clearInterval(id)
  }, [fetchConversations, view])

  async function handleCreateConversation(studentId?: string) {
    setShowPicker(false)
    setCreating(true)
    try {
      const r = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentId ? { studentId } : {}),
      })
      const j = await r.json()
      if (j.data) {
        const newConv: Conversation = { ...j.data, unreadCount: 0 }
        setConversations(prev => {
          const exists = prev.find(c => c.id === newConv.id)
          if (exists) return prev
          return [newConv, ...prev]
        })
        setActiveConvId(newConv.id)
        setView('chat')
      }
    } catch {
      /* silent */
    } finally {
      setCreating(false)
    }
  }

  function getOtherName(conv: Conversation) {
    if (isStaff) return conv.student?.user.fullName ?? 'Học viên'
    return conv.staffUser.fullName
  }
  function getOtherAvatar(conv: Conversation) {
    if (isStaff) return conv.student?.user.avatarUrl ?? null
    return conv.staffUser.avatarUrl
  }

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null

  // ─── Chat view ─────────────────────────────────────────
  if (view === 'chat' && activeConv) {
    return (
      <ChatThread
        conversationId={activeConv.id}
        isResolved={activeConv.isResolved}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        currentUserRole={role}
        recipient={{
          fullName: getOtherName(activeConv),
          avatarUrl: getOtherAvatar(activeConv),
        }}
        onBack={() => setView('list')}
        onMessageSent={(preview, createdAt) => {
          // Cập nhật preview + lastMessageAt trong list (để khi quay lại thấy đúng)
          setConversations(prev =>
            prev.map(c => (c.id === activeConv.id ? { ...c, lastMessagePreview: preview, lastMessageAt: createdAt, unreadCount: 0 } : c))
          )
        }}
      />
    )
  }

  // ─── List view ─────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-foreground/8 flex items-center justify-between gap-2">
        <p className="lqg-headline text-sm">Tin nhắn</p>
        <button
          onClick={() => {
            if (isStaff) setShowPicker(true)
            else handleCreateConversation()
          }}
          disabled={creating}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-pill text-[11px] font-medium bg-accent/15 text-accent hover:bg-accent/25 transition disabled:opacity-50"
          aria-label="Nhắn tin mới"
        >
          {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Mới
        </button>
      </div>

      {/* Student picker overlay (admin/staff) */}
      {showPicker && (
        <div className="absolute inset-x-3 top-12 z-10">
          <StudentPicker
            onSelect={handleCreateConversation}
            onClose={() => setShowPicker(false)}
            className="w-auto"
          />
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-foreground/30" />
          </div>
        )}
        {!loading && conversations.length === 0 && (
          <div className="px-6 py-10 text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-foreground/20 mb-2" strokeWidth={1.5} />
            <p className="text-sm text-foreground/55 mb-1">Chưa có tin nhắn nào</p>
            <p className="text-xs text-foreground/40">
              {isStaff ? 'Bấm "Mới" để bắt đầu' : 'Bấm "Mới" để nhắn tin với giáo viên'}
            </p>
          </div>
        )}
        {conversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => {
              setActiveConvId(conv.id)
              setView('chat')
            }}
            className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors border-b border-foreground/5 hover:bg-foreground/4"
          >
            <Avatar
              avatarUrl={getOtherAvatar(conv)}
              fullName={getOtherName(conv)}
              size="sm"
              variant={conv.unreadCount > 0 ? 'accent' : 'default'}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold' : 'font-normal'}`}>
                  {getOtherName(conv)}
                </span>
                <span className="text-[10px] text-foreground/40 shrink-0">
                  {conv.lastMessageAt
                    ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false, locale: vi })
                    : ''}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <p
                  className={`text-xs truncate ${
                    conv.unreadCount > 0 ? 'text-foreground/80' : 'text-foreground/50'
                  }`}
                >
                  {conv.lastMessagePreview ?? 'Bắt đầu cuộc trò chuyện'}
                </p>
                {conv.unreadCount > 0 && (
                  <span className="shrink-0 h-4 min-w-4 px-1 bg-accent text-ink text-[10px] font-bold rounded-pill grid place-items-center">
                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <Link
        href={FULL_PAGE_HREF[role]}
        onClick={() => onClose?.()}
        className="border-t border-foreground/8 px-3 py-2 text-center text-xs text-foreground/60 hover:text-foreground hover:bg-foreground/3 transition-colors inline-flex items-center justify-center gap-1"
      >
        Xem tất cả tin nhắn
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  )
}
