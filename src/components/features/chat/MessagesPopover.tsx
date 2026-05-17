'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, MessageSquare, Loader2, ArrowRight, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Avatar } from '@/components/ui/Avatar'
import type { UserRole } from '@/lib/auth'
import { UserPicker } from './UserPicker'
import { ChatThread } from './ChatThread'

interface ParticipantSummary {
  id: string
  userId: string
  role: string
  user: { id: string; fullName: string; role: string; avatarUrl: string | null }
}

interface Conversation {
  id: string
  name: string | null
  isGroup: boolean
  lastMessageAt: string | null
  lastMessagePreview: string | null
  isResolved: boolean
  unreadCount: number
  participants: ParticipantSummary[]
}

interface MessagesPopoverProps {
  role: UserRole
  currentUserId: string
  currentUserName: string
  currentUserAvatar: string | null
  onClose?: () => void
}

const FULL_PAGE_HREF: Record<UserRole, string> = {
  admin: '/admin/messages',
  staff: '/staff/messages',
  student: '/student/messages',
}

export function MessagesPopover({
  role,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onClose,
}: MessagesPopoverProps) {
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
      if (j.data?.conversations) setConversations(j.data.conversations)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
    if (view !== 'list') return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchConversations()
    }, 10_000)
    return () => clearInterval(id)
  }, [fetchConversations, view])

  async function handleCreateConversation(payload: { participantIds: string[]; name?: string }) {
    setShowPicker(false)
    setCreating(true)
    try {
      const r = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await r.json()
      if (j.data) {
        const newConv: Conversation = { ...j.data, unreadCount: 0 }
        setConversations(prev => {
          const exists = prev.find(c => c.id === newConv.id)
          return exists ? prev : [newConv, ...prev]
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

  // ─── Display helpers ──────────────────────────────────
  function getDisplayName(conv: Conversation): string {
    if (conv.name) return conv.name
    const others = conv.participants.filter(p => p.userId !== currentUserId)
    if (others.length === 0) return 'Tôi'
    if (others.length === 1) return others[0].user.fullName
    const joined = others.map(p => p.user.fullName.split(' ').pop()).join(', ')
    return joined.length > 40 ? joined.slice(0, 40) + '…' : joined
  }

  function getDisplayAvatars(conv: Conversation) {
    return conv.participants
      .filter(p => p.userId !== currentUserId)
      .slice(0, 3)
      .map(p => ({ url: p.user.avatarUrl, name: p.user.fullName, id: p.userId }))
  }

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null

  // ─── Chat view ─────────────────────────────────────────
  if (view === 'chat' && activeConv) {
    return (
      <ChatThread
        conversationId={activeConv.id}
        isResolved={activeConv.isResolved}
        isGroup={activeConv.isGroup}
        groupName={activeConv.name}
        participants={activeConv.participants.map(p => ({
          id: p.user.id,
          fullName: p.user.fullName,
          avatarUrl: p.user.avatarUrl,
          role: p.user.role,
        }))}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        currentUserRole={role}
        onBack={() => setView('list')}
        onMessageSent={(preview, createdAt) => {
          setConversations(prev =>
            prev.map(c =>
              c.id === activeConv.id
                ? { ...c, lastMessagePreview: preview, lastMessageAt: createdAt, unreadCount: 0 }
                : c,
            ),
          )
        }}
      />
    )
  }

  // ─── List view ─────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-2.5 border-b border-foreground/8 flex items-center justify-between gap-2">
        <p className="lqg-headline text-sm">Tin nhắn</p>
        <button
          onClick={() => setShowPicker(true)}
          disabled={creating}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-pill text-[11px] font-medium bg-accent/15 text-accent hover:bg-accent/25 transition disabled:opacity-50"
          aria-label="Nhắn tin mới"
        >
          {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Mới
        </button>
      </div>

      {/* UserPicker overlay */}
      {showPicker && (
        <div className="absolute inset-x-3 top-12 z-10">
          <UserPicker
            onCreate={handleCreateConversation}
            onClose={() => setShowPicker(false)}
            className="w-auto"
          />
        </div>
      )}

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
            <p className="text-xs text-foreground/40">Bấm &quot;Mới&quot; để bắt đầu</p>
          </div>
        )}
        {conversations.map(conv => {
          const avatars = getDisplayAvatars(conv)
          return (
            <button
              key={conv.id}
              onClick={() => {
                setActiveConvId(conv.id)
                setView('chat')
              }}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors border-b border-foreground/5 hover:bg-foreground/4"
            >
              {/* Avatar — single hoặc stacked group */}
              {conv.isGroup && avatars.length > 1 ? (
                <div className="relative w-9 h-9 shrink-0">
                  {avatars.map((a, i) => (
                    <div
                      key={a.id}
                      className="absolute ring-2 ring-paper rounded-pill"
                      style={{ left: i * 8, top: i * 3, zIndex: avatars.length - i }}
                    >
                      <Avatar avatarUrl={a.url} fullName={a.name} size="xs" />
                    </div>
                  ))}
                </div>
              ) : (
                <Avatar
                  avatarUrl={avatars[0]?.url ?? null}
                  fullName={avatars[0]?.name ?? getDisplayName(conv)}
                  size="sm"
                  variant={conv.unreadCount > 0 ? 'accent' : 'default'}
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-sm truncate inline-flex items-center gap-1 ${conv.unreadCount > 0 ? 'font-semibold' : 'font-normal'}`}>
                    {conv.isGroup && <Users className="h-3 w-3 text-foreground/50 shrink-0" />}
                    {getDisplayName(conv)}
                  </span>
                  <span className="text-[10px] text-foreground/40 shrink-0">
                    {conv.lastMessageAt
                      ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false, locale: vi })
                      : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-foreground/80' : 'text-foreground/50'}`}>
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
          )
        })}
      </div>

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
