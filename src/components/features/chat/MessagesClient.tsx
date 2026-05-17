'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Send, Plus, Check, CheckCheck, Loader2, X, MessageSquare } from 'lucide-react'
import type { UserRole } from '@/lib/auth'
import { Avatar } from '@/components/ui/Avatar'

// ─── Types ────────────────────────────────────────────────

interface Sender {
  id: string
  fullName: string
  avatarUrl: string | null
  role: string
}

interface Message {
  id: string
  content: string
  senderId: string
  senderRole: string
  createdAt: string
  readAt: string | null
  sender: Sender
}

interface ConversationParticipant {
  id: string
  fullName: string
  role: string
  avatarUrl: string | null
}

interface StudentInfo {
  id: string
  user: { id: string; fullName: string; avatarUrl: string | null }
}

interface Conversation {
  id: string
  staffUserId: string
  studentId: string
  lastMessageAt: string | null
  lastMessagePreview: string | null
  isResolved: boolean
  unreadCount: number
  staffUser: ConversationParticipant
  student?: StudentInfo
  messages?: Message[]
}

interface MessagesClientProps {
  initialConversations: Conversation[]
  currentUserId: string
  currentUserRole: UserRole
  currentUserName: string
  currentUserAvatar: string | null
}

// ─── Helpers ──────────────────────────────────────────────

function formatMsgTime(iso: string) {
  const d = new Date(iso)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return `Hôm qua ${format(d, 'HH:mm')}`
  return format(d, 'dd/MM HH:mm')
}

function formatConvTime(iso: string | null) {
  if (!iso) return ''
  return formatDistanceToNow(new Date(iso), { addSuffix: false, locale: vi })
}

const POLL_ACTIVE_MS = 3_000
const POLL_BG_MS = 30_000

// ─── Student list (admin/staff — search + select) ─────────

function StudentPicker({ onSelect, onClose }: { onSelect: (studentId: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [students, setStudents] = useState<Array<{ id: string; user: { fullName: string; avatarUrl: string | null } }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await fetch(`/api/students?search=${encodeURIComponent(q)}&status=active,enrolled,extension&page=1&pageSize=20`)
        const j = await r.json()
        setStudents(j.data?.items ?? [])
      } catch { setStudents([]) }
      setLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="glass-card rounded-card p-4 w-72 shadow-glass">
      <div className="flex items-center justify-between mb-3">
        <span className="lqg-headline text-sm">Chọn học viên</span>
        <button onClick={onClose} className="text-foreground/50 hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <input
        autoFocus
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Tìm tên học viên..."
        className="lqg-input w-full text-sm mb-2"
      />
      {loading && <p className="text-center text-foreground/40 text-xs py-2">Đang tìm...</p>}
      <div className="max-h-48 overflow-y-auto space-y-1">
        {students.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/10 transition-colors text-left"
          >
            <Avatar avatarUrl={s.user.avatarUrl} fullName={s.user.fullName} size="xs" />
            <span className="text-sm truncate">{s.user.fullName}</span>
          </button>
        ))}
        {!loading && students.length === 0 && q && (
          <p className="text-center text-foreground/40 text-xs py-2">Không tìm thấy</p>
        )}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────

export function MessagesClient({
  initialConversations,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserAvatar,
}: MessagesClientProps) {
  const router = useRouter()
  const isStaff = currentUserRole === 'admin' || currentUserRole === 'staff'

  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [activeId, setActiveId] = useState<string | null>(
    initialConversations.length > 0 ? initialConversations[0].id : null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [filterResolved, setFilterResolved] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMsgTimeRef = useRef<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeConv = conversations.find(c => c.id === activeId) ?? null

  // Asymmetric read receipt: chỉ HV xem được "đã xem" của admin/staff,
  // admin/staff KHÔNG xem được "đã xem" của HV (tránh áp lực reply).
  const showReadReceipts = currentUserRole === 'student'

  // Tìm tin nhắn cuối cùng mình gửi (không phải optimistic) để hiện status text
  const lastSentMessage = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.senderId === currentUserId && !m.id.startsWith('opt-')) return m
    }
    return null
  })()

  // ─── Fetch messages for active conversation ───────────

  const fetchMessages = useCallback(async (convId: string, since?: string) => {
    try {
      const url = since
        ? `/api/conversations/${convId}/messages?after=${encodeURIComponent(since)}`
        : `/api/conversations/${convId}/messages`
      const r = await fetch(url)
      const j = await r.json()
      if (!j.data?.messages) return
      const newMsgs: Message[] = j.data.messages
      if (newMsgs.length === 0) return

      if (since) {
        setMessages(prev => [...prev, ...newMsgs])
      } else {
        setMessages(newMsgs)
      }
      lastMsgTimeRef.current = newMsgs[newMsgs.length - 1].createdAt

      // Mark read + clear unread badge
      fetch(`/api/conversations/${convId}/read`, { method: 'PATCH' }).catch(() => null)
      setConversations(prev =>
        prev.map(c => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      )
    } catch { /* silent — retry on next poll */ }
    finally {
      // Reset loading sau cả success và error
      if (!since) setLoadingMsgs(false)
    }
  }, [])

  // Initial load when switching conversation
  useEffect(() => {
    if (!activeId) return
    setMessages([])
    setLoadingMsgs(true)
    lastMsgTimeRef.current = null
    fetchMessages(activeId)
  }, [activeId, fetchMessages])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Polling when chat window open
  useEffect(() => {
    if (!activeId) return

    function startPoll(ms: number) {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(() => {
        if (lastMsgTimeRef.current) {
          fetchMessages(activeId!, lastMsgTimeRef.current)
        }
      }, ms)
    }
    function stopPoll() {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        if (lastMsgTimeRef.current) fetchMessages(activeId!, lastMsgTimeRef.current)
        startPoll(POLL_ACTIVE_MS)
      } else {
        startPoll(POLL_BG_MS)
      }
    }

    startPoll(POLL_ACTIVE_MS)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      stopPoll()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [activeId, fetchMessages])

  // ─── Send message ───────────────────────────────────────

  async function handleSend() {
    if (!activeId || !input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    setSendError(null)
    // Optimistic — suffix random để tránh collision nếu 2 tin gửi cùng ms
    const optimistic: Message = {
      id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      content: text,
      senderId: currentUserId,
      senderRole: currentUserRole,
      createdAt: new Date().toISOString(),
      readAt: null,
      sender: { id: currentUserId, fullName: currentUserName, avatarUrl: currentUserAvatar, role: currentUserRole },
    }
    setMessages(prev => [...prev, optimistic])

    try {
      const r = await fetch(`/api/conversations/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      const j = await r.json()
      if (!r.ok || j.error) {
        setMessages(prev => prev.filter(m => m.id !== optimistic.id))
        setSendError(j.error?.message ?? 'Không thể gửi tin nhắn, vui lòng thử lại')
      } else if (j.data?.message) {
        const real: Message = j.data.message
        lastMsgTimeRef.current = real.createdAt
        setMessages(prev => prev.map(m => (m.id === optimistic.id ? real : m)))
        setConversations(prev =>
          prev.map(c =>
            c.id === activeId
              ? { ...c, lastMessageAt: real.createdAt, lastMessagePreview: text.slice(0, 100), unreadCount: 0 }
              : c
          )
        )
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setSendError('Lỗi kết nối, vui lòng thử lại')
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ─── Create new conversation ────────────────────────────

  async function handleCreateConversation(studentId?: string) {
    setShowPicker(false)
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
        setActiveId(newConv.id)
      }
    } catch { /* silent */ }
  }

  // ─── Resolve conversation ──────────────────────────────

  async function handleResolve() {
    if (!activeId) return
    try {
      await fetch(`/api/conversations/${activeId}/resolve`, { method: 'PATCH' })
      setConversations(prev =>
        prev.map(c => (c.id === activeId ? { ...c, isResolved: true } : c))
      )
      router.refresh()
    } catch { /* silent */ }
  }

  // ─── Render helpers ────────────────────────────────────

  function getOtherName(conv: Conversation) {
    if (isStaff) return conv.student?.user.fullName ?? 'Học viên'
    return conv.staffUser.fullName
  }
  function getOtherAvatar(conv: Conversation) {
    if (isStaff) return conv.student?.user.avatarUrl ?? null
    return conv.staffUser.avatarUrl
  }

  const filtered = conversations.filter(c =>
    filterResolved ? c.isResolved : !c.isResolved
  )

  // ─── Render ────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-6rem)] min-h-0 gap-0 rounded-card overflow-hidden glass-card border border-foreground/8">

      {/* Left pane — Conversation list */}
      <div className="w-72 shrink-0 flex flex-col border-r border-foreground/8 bg-[var(--lqg-bg-base)]/40">
        <div className="p-3 border-b border-foreground/8 flex items-center justify-between gap-2">
          <span className="lqg-headline text-sm">Tin nhắn</span>
          <div className="flex items-center gap-1">
            {/* Filter resolved/active */}
            <button
              onClick={() => setFilterResolved(v => !v)}
              className={`text-xs px-2 py-0.5 rounded-pill transition-colors ${
                filterResolved
                  ? 'bg-accent/15 text-accent'
                  : 'text-foreground/50 hover:text-foreground'
              }`}
            >
              {filterResolved ? 'Đã đóng' : 'Đang mở'}
            </button>
            {/* New conversation */}
            <div className="relative">
              <button
                onClick={() => {
                  if (isStaff) setShowPicker(v => !v)
                  else handleCreateConversation()
                }}
                className="glass-button p-1.5 rounded-lg"
                title="Nhắn tin mới"
              >
                <Plus className="h-4 w-4" />
              </button>
              {showPicker && isStaff && (
                <div className="absolute right-0 top-8 z-50">
                  <StudentPicker
                    onSelect={handleCreateConversation}
                    onClose={() => setShowPicker(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-6 text-center text-foreground/40 text-sm">
              {filterResolved ? 'Chưa có hội thoại nào đã đóng' : 'Chưa có tin nhắn nào'}
            </div>
          )}
          {filtered.map(conv => (
            <button
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors border-b border-foreground/5
                ${activeId === conv.id
                  ? 'bg-accent/10 border-l-2 border-l-accent'
                  : 'hover:bg-foreground/4'
                }`}
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
                  <span className="text-xs text-foreground/40 shrink-0">
                    {formatConvTime(conv.lastMessageAt)}
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
          ))}
        </div>
      </div>

      {/* Right pane — Chat window */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConv ? (
          <div className="flex-1 grid place-items-center text-foreground/40">
            <div className="text-center space-y-2">
              <MessageSquare className="h-10 w-10 mx-auto opacity-30" />
              <p className="text-sm">Chọn một cuộc hội thoại để bắt đầu</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-foreground/8 flex items-center gap-3">
              <Avatar
                avatarUrl={getOtherAvatar(activeConv)}
                fullName={getOtherName(activeConv)}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="lqg-headline text-sm truncate">{getOtherName(activeConv)}</p>
                {activeConv.isResolved && (
                  <span className="text-xs text-foreground/50">Đã đóng</span>
                )}
              </div>
              {isStaff && !activeConv.isResolved && (
                <button
                  onClick={handleResolve}
                  className="text-xs text-foreground/50 hover:text-foreground px-2 py-1 rounded-lg border border-foreground/15 hover:border-foreground/30 transition-colors"
                >
                  Đóng hội thoại
                </button>
              )}
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {loadingMsgs && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-foreground/30" />
                </div>
              )}
              {messages.map((msg, i) => {
                const isMine = msg.senderId === currentUserId
                const showAvatar = !isMine && (i === 0 || messages[i - 1].senderId !== msg.senderId)
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    {!isMine && (
                      <div className="w-6 shrink-0 self-end">
                        {showAvatar && (
                          <Avatar avatarUrl={msg.sender.avatarUrl} fullName={msg.sender.fullName} size="xs" />
                        )}
                      </div>
                    )}
                    <div className={`max-w-[70%] space-y-0.5 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div
                        className={`px-3 py-2 rounded-card text-sm leading-relaxed break-words
                          ${isMine
                            ? 'bg-accent/15 text-foreground rounded-br-sm'
                            : 'glass-card text-foreground rounded-bl-sm'
                          }`}
                      >
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-foreground/35">{formatMsgTime(msg.createdAt)}</span>
                        {isMine && !msg.id.startsWith('opt-') && (
                          showReadReceipts && msg.readAt
                            ? <CheckCheck className="h-3 w-3 text-accent" />
                            : <Check className="h-3 w-3 text-foreground/35" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {lastSentMessage && (
                <div className="flex justify-end pr-1">
                  {showReadReceipts && lastSentMessage.readAt ? (
                    <span className="text-[10px] text-accent font-medium inline-flex items-center gap-0.5">
                      <CheckCheck className="h-3 w-3" />
                      Đã xem · {format(new Date(lastSentMessage.readAt), 'HH:mm')}
                    </span>
                  ) : (
                    <span className="text-[10px] text-foreground/45 inline-flex items-center gap-0.5">
                      <Check className="h-3 w-3" />
                      Đã gửi
                    </span>
                  )}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            {activeConv.isResolved ? (
              <div className="px-4 py-3 border-t border-foreground/8 text-center text-sm text-foreground/40">
                Cuộc hội thoại đã được đóng
              </div>
            ) : (
              <div className="border-t border-foreground/8">
                {sendError && (
                  <div className="px-4 pt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-danger">{sendError}</p>
                    <button onClick={() => setSendError(null)} className="text-foreground/40 hover:text-foreground text-xs">✕</button>
                  </div>
                )}
                <div className="px-4 py-3 flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
                  rows={1}
                  className="lqg-input flex-1 resize-none text-sm min-h-[40px] max-h-32 py-2"
                  style={{ overflowY: 'auto' }}
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="glass-button p-2.5 rounded-lg bg-accent text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105 transition-all shrink-0"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
