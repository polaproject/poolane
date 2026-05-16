'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Clock, Check, X, Hourglass } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface RegisterPlusProps {
  sessionId: string
  studentId: string
  sessionDate: Date
  timeSlot: 'morning' | 'evening' | string
  disabled?: boolean
  disabledReason?: string
  enrollmentId?: string
  isFull?: boolean
}

/**
 * Compact `+` button cho mỗi session row.
 * Click → mở confirm dialog (tránh misclick mobile) → submit.
 * Sau khi đăng ký → morph thành Clock icon (pending status, vàng).
 */
export function RegisterPlusButton({
  sessionId,
  studentId,
  sessionDate,
  timeSlot,
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
      const pos = data.data?.waitlistPosition as number | null | undefined
      if (typeof pos === 'number' && pos > 0) {
        toast.success(`Bạn đang ở vị trí #${pos} trong danh sách chờ`)
      } else {
        toast.success('Đã đăng ký! Chờ giáo viên duyệt 😊')
      }
    } catch {
      toast.error('Không thể kết nối')
    } finally {
      setLoading(false)
    }
  }

  // After registration → pending icon
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

  // Full session — muted X
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

  const isMorning = timeSlot === 'morning'
  const timeText = isMorning ? 'sáng (5:30 – 7:30)' : 'chiều (18:00 – 20:00)'
  const dateText = format(sessionDate, 'EEEE, dd/MM/yyyy', { locale: vi })
  const confirmTitle = `Đăng ký buổi ${timeText}?`
  const confirmDesc = `${dateText.charAt(0).toUpperCase() + dateText.slice(1)} — giáo viên sẽ duyệt sau khi bạn đăng ký.`

  // Trigger button — sẽ được ConfirmDialog "render" thay vì wrap.
  // Phải KHÔNG có onClick fetch — onClick mở dialog tự động qua AlertDialog.Trigger.
  const triggerButton = (
    <button
      type="button"
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

  // Nếu disabled, trả button thường (không mở dialog).
  if (disabled) return triggerButton

  return (
    <ConfirmDialog
      trigger={triggerButton}
      title={confirmTitle}
      description={confirmDesc}
      confirmLabel="Đăng ký"
      cancelLabel="Huỷ"
      onConfirm={handleRegister}
    />
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
