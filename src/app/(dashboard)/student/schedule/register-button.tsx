'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Clock, Check, X, Hourglass } from 'lucide-react'

interface RegisterPlusProps {
  sessionId: string
  studentId: string
  disabled?: boolean
  disabledReason?: string
  enrollmentId?: string
  isFull?: boolean
}

/**
 * Compact `+` button cho mỗi session row.
 * Sau khi đăng ký → morph thành Clock icon (pending status, vàng).
 * Disabled (hết vé / full) → opacity giảm + tooltip.
 */
export function RegisterPlusButton({
  sessionId,
  studentId,
  disabled,
  disabledReason,
  enrollmentId,
  isFull,
}: RegisterPlusProps) {
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  async function handleRegister() {
    if (disabled || loading || registered) return
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, courseId: enrollmentId }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        toast.error(data.error?.message ?? 'Không thể đăng ký')
        return
      }

      setRegistered(true)
      toast.success('Đã đăng ký! Chờ giáo viên duyệt 😊')
    } catch {
      toast.error('Không thể kết nối')
    } finally {
      setLoading(false)
    }
  }

  // After registration → show pending status icon
  if (registered) {
    return (
      <span
        className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-warn/15 text-warn ring-1 ring-warn/30"
        title="Chờ duyệt"
        aria-label="Chờ duyệt"
      >
        <Clock className="h-4 w-4" strokeWidth={2} />
      </span>
    )
  }

  // Full session — show muted X
  if (isFull) {
    return (
      <span
        className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-foreground/5 text-foreground/40 ring-1 ring-foreground/10"
        title="Hết chỗ"
        aria-label="Buổi đã đầy"
      >
        <X className="h-4 w-4" strokeWidth={2} />
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleRegister}
      disabled={disabled || loading}
      title={disabledReason ?? 'Đăng ký buổi này'}
      aria-label={disabledReason ?? 'Đăng ký buổi này'}
      className={`
        inline-flex items-center justify-center h-10 w-10 rounded-full
        transition-transform duration-150 active:scale-90
        ${disabled
          ? 'bg-foreground/5 text-foreground/30 ring-1 ring-foreground/10 cursor-not-allowed'
          : 'bg-accent text-ink hover:scale-110 ring-1 ring-accent/40 shadow-soft'}
      `}
    >
      {loading
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : <Plus className="h-5 w-5" strokeWidth={2.5} />
      }
    </button>
  )
}

/**
 * Status icon cho học viên đã đăng ký (pending/approved/rejected/waitlist).
 * Dùng thay cho `+` button khi có registration record.
 */
export function StatusIcon({ status }: { status: string }) {
  const config: Record<string, { Icon: typeof Clock; label: string; bg: string; fg: string; ring: string }> = {
    pending:  { Icon: Clock,     label: 'Chờ duyệt',     bg: 'bg-warn/15',    fg: 'text-warn',    ring: 'ring-warn/30' },
    approved: { Icon: Check,     label: 'Đã duyệt',      bg: 'bg-success/15', fg: 'text-success', ring: 'ring-success/30' },
    rejected: { Icon: X,         label: 'Không duyệt',   bg: 'bg-danger/15',  fg: 'text-danger',  ring: 'ring-danger/30' },
    waitlist: { Icon: Hourglass, label: 'Chờ chỗ trống', bg: 'bg-mist/15',    fg: 'text-mist',    ring: 'ring-mist/30' },
  }
  const c = config[status] ?? config.pending
  const Icon = c.Icon
  return (
    <span
      className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${c.bg} ${c.fg} ring-1 ${c.ring}`}
      title={c.label}
      aria-label={c.label}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
    </span>
  )
}
