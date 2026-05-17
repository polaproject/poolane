'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Send, Loader2, Check, CheckCheck, Users } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { Avatar } from '@/components/ui/Avatar'

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

interface ParticipantInfo {
  id: string // userId
  fullName: string
  avatarUrl: string | null
  role: string
}

interface ParticipantReadState {
  userId: string
  lastReadAt: string | null
}

interface ChatThreadProps {
  conversationId: string
  isResolved: boolean
  isGroup: boolean
  groupName: string | null
  participants: ParticipantInfo[]
  currentUserId: string
  currentUserName: string
  currentUserAvatar: string | null
  currentUserRole: 'admin' | 'staff' | 'student'
  onBack: () => void
  onMessageSent?: (preview: string, createdAt: string) => void
}

function formatMsgTime(iso: string) {
  const d = new Date(iso)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return `Hôm qua ${format(d, 'HH:mm')}`
  return format(d, 'dd/MM HH:mm')
}

const POLL_ACTIVE_MS = 3_000
const POLL_BG_MS = 30_000
const DRAFT_KEY_PREFIX = 'chat-draft-'

export function ChatThread({
  conversationId,
  isResolved,
  isGroup,
  groupName,
  participants,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserRole,
  onBack,
  onMessageSent,
}: ChatThreadProps) {
  const draftKey = `${DRAFT_KEY_PREFIX}${conversationId}`

  const [messages, setMessages] = useState<Message[]>([])
  const [readStates, setReadStates] = useState<ParticipantReadState[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState(() => {
    if (typeof window === 'undefined') return ''
    return sessionStorage.getItem(draftKey) ?? ''
  })
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMsgTimeRef = useRef<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Persist draft
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (input.trim()) sessionStorage.setItem(draftKey, input)
    else sessionStorage.removeItem(draftKey)
  }, [input, draftKey])

  const fetchMessages = useCallback(
    async (since?: string) => {
      try {
        const url = since
          ? `/api/conversations/${conversationId}/messages?after=${encodeURIComponent(since)}`
          : `/api/conversations/${conversationId}/messages`
        const r = await fetch(url)
        const j = await r.json()
        if (!j.data) return

        // Always update readStates (participants.lastReadAt) — cho group receipt
        if (j.data.participants) {
          setReadStates(j.data.participants)
        }

        const newMsgs: Message[] = j.data.messages ?? []
        if (newMsgs.length === 0) {
          if (!since) setMessages([])
          return
        }

        if (since) {
          setMessages(prev => [...prev, ...newMsgs])
        } else {
          setMessages(newMsgs)
        }
        lastMsgTimeRef.current = newMsgs[newMsgs.length - 1].createdAt

        // Mark read
        fetch(`/api/conversations/${conversationId}/read`, { method: 'PATCH' }).catch(() => null)
      } catch {
        /* silent — retry on next poll */
      } finally {
        if (!since) setLoading(false)
      }
    },
    [conversationId],
  )

  // Initial load + polling
  useEffect(() => {
    setMessages([])
    setLoading(true)
    lastMsgTimeRef.current = null
    fetchMessages()

    function startPoll(ms: number) {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(() => {
        // Always re-fetch (with `since` if has data) — participants/readStates đổi liên tục
        if (lastMsgTimeRef.current) fetchMessages(lastMsgTimeRef.current)
        else fetchMessages()
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
        if (lastMsgTimeRef.current) fetchMessages(lastMsgTimeRef.current)
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
  }, [conversationId, fetchMessages])

  // Auto-scroll bottom (block: 'nearest' để không scroll background — Phase 19 fix)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    sessionStorage.removeItem(draftKey)
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
      const r = await fetch(`/api/conversations/${conversationId}/messages`, {
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
        setMessages(prev => prev.map(m => (m.id === optimistic.id ? real : m)))
        onMessageSent?.(text.slice(0, 100), real.createdAt)
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setSendError('Lỗi kết nối, vui lòng thử lại')
      setInput(text)
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

  // ─── Header info ──────────────────────────────────────
  const others = participants.filter(p => p.id !== currentUserId)
  const headerName = isGroup
    ? (groupName ?? others.map(p => p.fullName.split(' ').pop()).join(', ').slice(0, 40))
    : (others[0]?.fullName ?? 'Hội thoại')
  const headerAvatars = others.slice(0, 3)

  // ─── Read receipt logic ──────────────────────────────
  // DM: asymmetric — HV thấy, admin/staff không
  // Group: hiển thị "Đã xem bởi N/M" dưới last sent message
  const showDmReceipts = !isGroup && currentUserRole === 'student'

  const lastSentMessage = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.senderId === currentUserId && !m.id.startsWith('opt-')) return m
    }
    return null
  })()

  // Compute group read count
  const groupReadCount = (() => {
    if (!isGroup || !lastSentMessage) return null
    const lastSentTime = new Date(lastSentMessage.createdAt).getTime()
    const otherReaders = readStates
      .filter(s => s.userId !== currentUserId && s.lastReadAt)
      .filter(s => new Date(s.lastReadAt!).getTime() >= lastSentTime)
    return { read: otherReaders.length, total: others.length }
  })()

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-foreground/8 flex items-center gap-2.5">
        <button
          onClick={onBack}
          aria-label="Quay lại danh sách"
          className="shrink-0 p-1 rounded-lg hover:bg-foreground/5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-foreground/65" />
        </button>

        {/* Avatar(s) */}
        {isGroup ? (
          <div className="relative w-9 h-9 shrink-0">
            {headerAvatars.map((a, i) => (
              <div
                key={a.id}
                className="absolute ring-2 ring-paper rounded-pill"
                style={{ left: i * 8, top: i * 3, zIndex: headerAvatars.length - i }}
              >
                <Avatar avatarUrl={a.avatarUrl} fullName={a.fullName} size="xs" />
              </div>
            ))}
          </div>
        ) : (
          <Avatar avatarUrl={others[0]?.avatarUrl ?? null} fullName={headerName} size="sm" />
        )}

        <div className="flex-1 min-w-0">
          <p className="lqg-headline text-sm truncate">{headerName}</p>
          {isGroup && (
            <span className="text-[10px] text-foreground/55 inline-flex items-center gap-0.5">
              <Users className="h-2.5 w-2.5" /> {participants.length} thành viên
            </span>
          )}
          {isResolved && <span className="text-[10px] text-foreground/50 ml-1">· Đã đóng</span>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-foreground/30" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-center text-foreground/40 text-xs py-8">Hãy bắt đầu cuộc trò chuyện</p>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.senderId === currentUserId
          const prevMsg = i > 0 ? messages[i - 1] : null
          const showAvatar = !isMine && (i === 0 || prevMsg?.senderId !== msg.senderId)
          const showSenderLabel = isGroup && !isMine && (i === 0 || prevMsg?.senderId !== msg.senderId)
          return (
            <div key={msg.id} className={`flex gap-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
              {!isMine && (
                <div className="w-5 shrink-0 self-end">
                  {showAvatar && <Avatar avatarUrl={msg.sender.avatarUrl} fullName={msg.sender.fullName} size="xs" />}
                </div>
              )}
              <div className={`max-w-[75%] space-y-0.5 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                {showSenderLabel && (
                  <span className="text-[10px] text-foreground/55 px-1 font-medium">{msg.sender.fullName}</span>
                )}
                <div
                  className={`px-2.5 py-1.5 rounded-card text-sm leading-relaxed break-words
                    ${isMine ? 'bg-accent/15 text-foreground rounded-br-sm' : 'glass-card text-foreground rounded-bl-sm'}`}
                >
                  {msg.content}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-foreground/35">{formatMsgTime(msg.createdAt)}</span>
                  {/* Per-message tick CHỈ trong DM (group dùng aggregate dưới) */}
                  {isMine && !isGroup && !msg.id.startsWith('opt-') && (
                    showDmReceipts && msg.readAt
                      ? <CheckCheck className="h-2.5 w-2.5 text-accent" />
                      : <Check className="h-2.5 w-2.5 text-foreground/35" />
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* DM status dưới last sent */}
        {!isGroup && lastSentMessage && (
          <div className="flex justify-end pr-1">
            {showDmReceipts && lastSentMessage.readAt ? (
              <span className="text-[10px] text-accent font-medium inline-flex items-center gap-0.5">
                <CheckCheck className="h-2.5 w-2.5" />
                Đã xem · {format(new Date(lastSentMessage.readAt), 'HH:mm')}
              </span>
            ) : (
              <span className="text-[10px] text-foreground/45 inline-flex items-center gap-0.5">
                <Check className="h-2.5 w-2.5" />
                Đã gửi
              </span>
            )}
          </div>
        )}

        {/* Group status: "Đã xem bởi N/M" */}
        {isGroup && lastSentMessage && groupReadCount && (
          <div className="flex justify-end pr-1">
            {groupReadCount.read > 0 ? (
              <span className="text-[10px] text-accent font-medium inline-flex items-center gap-0.5">
                <CheckCheck className="h-2.5 w-2.5" />
                Đã xem bởi {groupReadCount.read}/{groupReadCount.total}
              </span>
            ) : (
              <span className="text-[10px] text-foreground/45 inline-flex items-center gap-0.5">
                <Check className="h-2.5 w-2.5" />
                Đã gửi
              </span>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isResolved ? (
        <div className="px-3 py-2.5 border-t border-foreground/8 text-center text-xs text-foreground/40">
          Cuộc hội thoại đã đóng
        </div>
      ) : (
        <div className="border-t border-foreground/8">
          {sendError && (
            <div className="px-3 pt-1.5 flex items-center justify-between gap-2">
              <p className="text-[11px] text-danger">{sendError}</p>
              <button
                onClick={() => setSendError(null)}
                className="text-foreground/40 hover:text-foreground text-xs"
                aria-label="Đóng thông báo lỗi"
              >
                ✕
              </button>
            </div>
          )}
          <div className="px-3 py-2 flex items-end gap-1.5">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              rows={1}
              className="lqg-input flex-1 resize-none text-sm min-h-[36px] max-h-24 py-1.5"
              style={{ overflowY: 'auto' }}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="p-2 rounded-lg bg-accent text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105 transition-all shrink-0"
              aria-label="Gửi"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
