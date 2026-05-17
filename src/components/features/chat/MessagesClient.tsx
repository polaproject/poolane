'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Send, Plus, Check, CheckCheck, Loader2, MessageSquare, Users, ArrowLeft } from 'lucide-react'
import type { UserRole } from '@/lib/auth'
import { Avatar } from '@/components/ui/Avatar'
import { UserPicker } from './UserPicker'

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

interface ParticipantSummary {
  id: string
  userId: string
  role: string
  user: { id: string; fullName: string; role: string; avatarUrl: string | null }
}

interface ParticipantReadState {
  userId: string
  lastReadAt: string | null
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

interface MessagesClientProps {
  initialConversations: Conversation[]
  currentUserId: string
  currentUserRole: UserRole
  currentUserName: string
  currentUserAvatar: string | null
}

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

export function MessagesClient({
  initialConversations,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserAvatar,
}: MessagesClientProps) {
  const router = useRouter()

  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  // Không auto-select first conv — để mobile user thấy list trước, click vào để mở chat.
  // Desktop user vẫn click 1 lần để bắt đầu (consistent với popover).
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [readStates, setReadStates] = useState<ParticipantReadState[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [filterResolved, setFilterResolved] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const lastMsgTimeRef = useRef<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sendingRef = useRef(false)

  const activeConv = conversations.find(c => c.id === activeId) ?? null

  // Display helpers
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

  // Phase 23: symmetric — cả 2 bên thấy CheckCheck khi đối phương đã đọc.
  void currentUserRole // intentionally unused
  const isGroupActive = activeConv?.isGroup ?? false

  function groupReadByMsg(msgCreatedAt: string): boolean {
    if (!isGroupActive) return false
    const msgTime = new Date(msgCreatedAt).getTime()
    return readStates.some(
      s => s.userId !== currentUserId && s.lastReadAt && new Date(s.lastReadAt).getTime() >= msgTime,
    )
  }

  // ─── Fetch messages ──────────────────────────────────
  const fetchMessages = useCallback(
    async (convId: string, since?: string) => {
      try {
        const url = since
          ? `/api/conversations/${convId}/messages?after=${encodeURIComponent(since)}`
          : `/api/conversations/${convId}/messages`
        const r = await fetch(url)
        const j = await r.json()
        if (!j.data) return

        if (j.data.participants) setReadStates(j.data.participants)
        const newMsgs: Message[] = j.data.messages ?? []

        if (newMsgs.length === 0) {
          if (!since) setMessages([])
          return
        }

        if (since) {
          // Dedupe: tránh duplicate khi polling race với POST response
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const filtered = newMsgs.filter(m => !existingIds.has(m.id))
            return filtered.length === 0 ? prev : [...prev, ...filtered]
          })
        } else setMessages(newMsgs)

        lastMsgTimeRef.current = newMsgs[newMsgs.length - 1].createdAt

        fetch(`/api/conversations/${convId}/read`, { method: 'PATCH' }).catch(() => null)
        setConversations(prev => prev.map(c => (c.id === convId ? { ...c, unreadCount: 0 } : c)))
      } catch {
        /* silent */
      } finally {
        if (!since) setLoadingMsgs(false)
      }
    },
    [],
  )

  // Initial load on conv switch
  useEffect(() => {
    if (!activeId) return
    setMessages([])
    setReadStates([])
    setLoadingMsgs(true)
    lastMsgTimeRef.current = null
    fetchMessages(activeId)
  }, [activeId, fetchMessages])

  // Phase 22 fix: direct scrollTop trên overflow container (không propagate
  // → tránh page background scroll). Skip khi empty.
  useEffect(() => {
    if (messages.length === 0) return
    const el = messagesContainerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  // Polling
  useEffect(() => {
    if (!activeId) return

    function startPoll(ms: number) {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(() => {
        if (lastMsgTimeRef.current) fetchMessages(activeId!, lastMsgTimeRef.current)
        else fetchMessages(activeId!)
      }, ms)
    }
    function stopPoll() {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
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

  async function handleSend() {
    if (!activeId || !input.trim() || sendingRef.current) return
    sendingRef.current = true
    const text = input.trim()
    setInput('')
    setSending(true)
    setSendError(null)

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
        setInput(text)
      } else if (j.data?.message) {
        const real: Message = j.data.message
        lastMsgTimeRef.current = real.createdAt
        // Dedupe: nếu polling đã add real (race), không add lại
        setMessages(prev => {
          const withoutOpt = prev.filter(m => m.id !== optimistic.id)
          if (withoutOpt.some(m => m.id === real.id)) return withoutOpt
          return [...withoutOpt, real]
        })
        setConversations(prev =>
          prev.map(c =>
            c.id === activeId
              ? { ...c, lastMessageAt: real.createdAt, lastMessagePreview: text.slice(0, 100), unreadCount: 0 }
              : c,
          ),
        )
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setSendError('Lỗi kết nối, vui lòng thử lại')
      setInput(text)
    } finally {
      sendingRef.current = false
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

  async function handleCreateConversation(payload: { participantIds: string[]; name?: string }) {
    setShowPicker(false)
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
        setActiveId(newConv.id)
      }
    } catch {
      /* silent */
    }
  }

  async function handleResolve() {
    if (!activeId) return
    try {
      await fetch(`/api/conversations/${activeId}/resolve`, { method: 'PATCH' })
      setConversations(prev => prev.map(c => (c.id === activeId ? { ...c, isResolved: true } : c)))
      router.refresh()
    } catch {
      /* silent */
    }
  }

  // Phase 22: lastSentMessage + groupReadCount đã xóa (per-message tick thay aggregate)

  const filtered = conversations.filter(c => (filterResolved ? c.isResolved : !c.isResolved))

  return (
    <div className="flex h-[calc(100vh-6rem)] min-h-0 gap-0 rounded-card overflow-hidden glass-card border border-foreground/8">
      {/* Left pane — mobile: hide khi có conv active; desktop: luôn show */}
      <div className={`w-full sm:w-72 shrink-0 flex-col border-r border-foreground/8 bg-[var(--lqg-bg-base)]/40 relative
        ${activeId ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-3 border-b border-foreground/8 flex items-center justify-between gap-2">
          <span className="lqg-headline text-sm">Tin nhắn</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterResolved(v => !v)}
              className={`text-xs px-2 py-0.5 rounded-pill transition-colors ${
                filterResolved ? 'bg-accent/15 text-accent' : 'text-foreground/50 hover:text-foreground'
              }`}
            >
              {filterResolved ? 'Đã đóng' : 'Đang mở'}
            </button>
            <button
              onClick={() => setShowPicker(true)}
              className="glass-button p-1.5 rounded-lg"
              title="Nhắn tin mới"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showPicker && (
          <div className="absolute top-14 right-3 z-20">
            <UserPicker
              onCreate={handleCreateConversation}
              onClose={() => setShowPicker(false)}
              className="w-auto"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-6 text-center text-foreground/40 text-sm">
              {filterResolved ? 'Chưa có hội thoại nào đã đóng' : 'Chưa có tin nhắn nào'}
            </div>
          )}
          {filtered.map(conv => {
            const avatars = getDisplayAvatars(conv)
            return (
              <button
                key={conv.id}
                onClick={() => setActiveId(conv.id)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors border-b border-foreground/5
                  ${activeId === conv.id ? 'bg-accent/10 border-l-2 border-l-accent' : 'hover:bg-foreground/4'}`}
              >
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
                    <span className="text-xs text-foreground/40 shrink-0">{formatConvTime(conv.lastMessageAt)}</span>
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
      </div>

      {/* Right pane — chat. Mobile: chỉ show khi có conv active; desktop: luôn show */}
      <div className={`flex-1 flex-col min-w-0 ${activeId ? 'flex' : 'hidden sm:flex'}`}>
        {!activeConv ? (
          <div className="flex-1 grid place-items-center text-foreground/40">
            <div className="text-center space-y-2">
              <MessageSquare className="h-10 w-10 mx-auto opacity-30" />
              <p className="text-sm">Chọn một cuộc hội thoại để bắt đầu</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-foreground/8 flex items-center gap-3">
              {/* Mobile back button (chỉ hiện < sm) — đóng conv → về list */}
              <button
                onClick={() => setActiveId(null)}
                aria-label="Quay lại danh sách"
                className="sm:hidden shrink-0 p-1 rounded-lg hover:bg-foreground/5 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-foreground/65" />
              </button>
              {activeConv.isGroup ? (
                <div className="relative w-9 h-9 shrink-0">
                  {getDisplayAvatars(activeConv).map((a, i, arr) => (
                    <div
                      key={a.id}
                      className="absolute ring-2 ring-paper rounded-pill"
                      style={{ left: i * 8, top: i * 3, zIndex: arr.length - i }}
                    >
                      <Avatar avatarUrl={a.url} fullName={a.name} size="xs" />
                    </div>
                  ))}
                </div>
              ) : (
                <Avatar
                  avatarUrl={getDisplayAvatars(activeConv)[0]?.url ?? null}
                  fullName={getDisplayName(activeConv)}
                  size="sm"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="lqg-headline text-sm truncate">{getDisplayName(activeConv)}</p>
                {activeConv.isGroup && (
                  <span className="text-[10px] text-foreground/55 inline-flex items-center gap-0.5">
                    <Users className="h-2.5 w-2.5" /> {activeConv.participants.length} thành viên
                  </span>
                )}
                {activeConv.isResolved && <span className="text-xs text-foreground/50 ml-1">· Đã đóng</span>}
              </div>
              {(currentUserRole === 'admin' || currentUserRole === 'staff') && !activeConv.isResolved && (
                <button
                  onClick={handleResolve}
                  className="text-xs text-foreground/50 hover:text-foreground px-2 py-1 rounded-lg border border-foreground/15 hover:border-foreground/30 transition-colors"
                >
                  Đóng hội thoại
                </button>
              )}
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1.5 min-h-0">
              {loadingMsgs && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-foreground/30" />
                </div>
              )}
              {messages.map((msg, i) => {
                const isMine = msg.senderId === currentUserId
                const prevMsg = i > 0 ? messages[i - 1] : null
                const nextMsg = i < messages.length - 1 ? messages[i + 1] : null
                const showAvatar = !isMine && (i === 0 || prevMsg?.senderId !== msg.senderId)
                const showSenderLabel = isGroupActive && !isMine && (i === 0 || prevMsg?.senderId !== msg.senderId)

                // Phase 22 time dedup: ẩn time + tick nếu next msg cùng phút
                const minKey = (d: string) => format(new Date(d), 'yyyy-MM-dd HH:mm')
                const sameMinAsNext = nextMsg && minKey(msg.createdAt) === minKey(nextMsg.createdAt)
                const showMeta = !sameMinAsNext

                const isRead = isGroupActive ? groupReadByMsg(msg.createdAt) : !!msg.readAt
                const showTick = isMine && !msg.id.startsWith('opt-')
                const useDoubleTick = showTick && isRead // symmetric

                return (
                  <div key={msg.id} className="flex items-end gap-2">
                    {!isMine && (
                      <>
                        <div className="w-6 shrink-0 self-end">
                          {showAvatar && <Avatar avatarUrl={msg.sender.avatarUrl} fullName={msg.sender.fullName} size="xs" />}
                        </div>
                        <div className="max-w-[70%] flex flex-col items-start space-y-0.5">
                          {showSenderLabel && (
                            <span className="text-[10px] text-foreground/55 px-1 font-medium">{msg.sender.fullName}</span>
                          )}
                          <div className="px-3 py-2 rounded-card rounded-bl-sm text-sm leading-relaxed break-words glass-card text-foreground">
                            {msg.content}
                          </div>
                        </div>
                        {showMeta && (
                          <span className="ml-auto text-[10px] text-foreground/35 self-end shrink-0">
                            {formatMsgTime(msg.createdAt)}
                          </span>
                        )}
                      </>
                    )}
                    {isMine && (
                      <>
                        {showMeta && (
                          <span className="text-[10px] text-foreground/35 self-end shrink-0 inline-flex items-center gap-0.5">
                            {formatMsgTime(msg.createdAt)}
                            {showTick && (
                              useDoubleTick
                                ? <CheckCheck className="h-3 w-3 text-accent" />
                                : <Check className="h-3 w-3 text-foreground/35" />
                            )}
                          </span>
                        )}
                        <div className="ml-auto max-w-[70%] flex flex-col items-end space-y-0.5">
                          <div className="px-3 py-2 rounded-card rounded-br-sm text-sm leading-relaxed break-words bg-accent/15 text-foreground">
                            {msg.content}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Input */}
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
                    className="lqg-input flex-1 resize-none text-sm min-h-[40px] max-h-32 py-2 px-3"
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
