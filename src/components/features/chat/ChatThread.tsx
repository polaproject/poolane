'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Send, Loader2, Check, CheckCheck } from 'lucide-react'
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

interface ChatThreadProps {
  conversationId: string
  isResolved: boolean
  currentUserId: string
  currentUserName: string
  currentUserAvatar: string | null
  currentUserRole: 'admin' | 'staff' | 'student'
  recipient: {
    fullName: string
    avatarUrl: string | null
    role?: string
  }
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

/**
 * Single conversation chat view — header + messages + input.
 * Polling 3s khi tab focused, 30s khi hidden. Draft preserve qua sessionStorage.
 */
export function ChatThread({
  conversationId,
  isResolved,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserRole,
  recipient,
  onBack,
  onMessageSent,
}: ChatThreadProps) {
  const draftKey = `${DRAFT_KEY_PREFIX}${conversationId}`

  const [messages, setMessages] = useState<Message[]>([])
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

  // Persist draft to sessionStorage on every input change
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
        if (!j.data?.messages) return
        const newMsgs: Message[] = j.data.messages
        if (newMsgs.length === 0) return

        if (since) {
          setMessages(prev => [...prev, ...newMsgs])
        } else {
          setMessages(newMsgs)
        }
        lastMsgTimeRef.current = newMsgs[newMsgs.length - 1].createdAt

        fetch(`/api/conversations/${conversationId}/read`, { method: 'PATCH' }).catch(() => null)
      } catch {
        /* silent — retry on next poll */
      } finally {
        if (!since) setLoading(false)
      }
    },
    [conversationId]
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
        if (lastMsgTimeRef.current) fetchMessages(lastMsgTimeRef.current)
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

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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
        setSendError(j.error?.message ?? 'Không thể gửi tin nhắn')
        setInput(text) // restore so user không mất tin
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

  // Asymmetric read receipt: HV xem được "Đã xem" của admin/staff,
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
        <Avatar avatarUrl={recipient.avatarUrl} fullName={recipient.fullName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="lqg-headline text-sm truncate">{recipient.fullName}</p>
          {isResolved && <span className="text-[10px] text-foreground/50">Đã đóng</span>}
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
          const showAvatar = !isMine && (i === 0 || messages[i - 1].senderId !== msg.senderId)
          return (
            <div key={msg.id} className={`flex gap-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
              {!isMine && (
                <div className="w-5 shrink-0 self-end">
                  {showAvatar && <Avatar avatarUrl={msg.sender.avatarUrl} fullName={msg.sender.fullName} size="xs" />}
                </div>
              )}
              <div className={`max-w-[75%] space-y-0.5 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`px-2.5 py-1.5 rounded-card text-sm leading-relaxed break-words
                    ${isMine ? 'bg-accent/15 text-foreground rounded-br-sm' : 'glass-card text-foreground rounded-bl-sm'}`}
                >
                  {msg.content}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-foreground/35">{formatMsgTime(msg.createdAt)}</span>
                  {isMine && !msg.id.startsWith('opt-') && (
                    showReadReceipts && msg.readAt
                      ? <CheckCheck className="h-2.5 w-2.5 text-accent" />
                      : <Check className="h-2.5 w-2.5 text-foreground/35" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {/* Status text dưới last sent message — chỉ HV thấy "đã xem" */}
        {lastSentMessage && (
          <div className="flex justify-end pr-1">
            {showReadReceipts && lastSentMessage.readAt ? (
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
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
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
