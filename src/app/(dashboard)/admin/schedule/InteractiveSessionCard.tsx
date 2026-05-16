'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Users, Check, X as XIcon, AlertCircle, Loader2, ChevronRight,
  UserMinus, ExternalLink,
} from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import { CAPACITY } from '@/config/constants'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export interface SessionRegData {
  id: string
  status: 'pending' | 'approved' | 'waitlist'
  student: { id: string; fullName: string }
  course: { code: string } | null
}

export interface SessionData {
  id: string
  timeSlot: 'morning' | 'evening'
  status: string
  registrations: SessionRegData[]
}

interface Props {
  session: SessionData
  cap: number
  slotLabel: string
}

export function InteractiveSessionCard({ session, cap, slotLabel }: Props) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)

  const approved = session.registrations.filter(r => r.status === 'approved')
  const pending = session.registrations.filter(r => r.status === 'pending')
  const isFull = approved.length >= cap
  const isLow =
    approved.length < (session.timeSlot === 'morning' ? CAPACITY.MORNING_MIN : CAPACITY.EVENING_MIN)
  const isCancelled = session.status === 'cancelled'

  const tone = isCancelled
    ? 'bg-danger/8 ring-danger/30'
    : isFull
      ? 'bg-mist/10 ring-mist/30'
      : isLow
        ? 'bg-warn/10 ring-warn/30'
        : 'bg-[var(--surface)] ring-foreground/8'

  async function handleApprove(regId: string, studentName: string) {
    setSubmitting(regId)
    try {
      const res = await fetch(`/api/sessions/${session.id}/registrations/${regId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Không thể duyệt')
        return
      }
      toast.success(`Đã duyệt ${studentName}`)
      setExpandedId(null)
      router.refresh()
    } catch {
      toast.error('Không thể kết nối')
    } finally {
      setSubmitting(null)
    }
  }

  async function handleReject(regId: string, studentName: string) {
    setSubmitting(regId)
    try {
      const res = await fetch(`/api/sessions/${session.id}/registrations/${regId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejectedReason: 'teacher_decision',
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Không thể từ chối')
        return
      }
      toast.success(`Đã từ chối ${studentName}`)
      setExpandedId(null)
      router.refresh()
    } catch {
      toast.error('Không thể kết nối')
    } finally {
      setSubmitting(null)
    }
  }

  async function handleWithdraw(regId: string, studentName: string) {
    setSubmitting(regId)
    try {
      const res = await fetch(`/api/sessions/${session.id}/registrations/${regId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw' }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Không thể rút HV khỏi buổi')
        return
      }
      toast.success(`Đã rút ${studentName} khỏi buổi học`)
      setExpandedId(null)
      router.refresh()
    } catch {
      toast.error('Không thể kết nối')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div
      className={`rounded-card p-3 ring-1 hover:-translate-y-0.5 hover:shadow-soft transition-all min-h-[180px] flex flex-col ${tone}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-foreground/65">{slotLabel}</span>
        <div className="flex items-center gap-1.5">
          <Chip variant={isFull ? 'mist' : isLow ? 'warn' : 'neutral'} className="text-[10px]">
            <Users className="h-2.5 w-2.5" strokeWidth={2.25} /> {approved.length}/{cap}
          </Chip>
          <Link
            href={`/admin/schedule/sessions/${session.id}`}
            aria-label="Xem chi tiết buổi"
            title="Chi tiết"
            className="grid place-items-center h-5 w-5 rounded-pill hover:bg-foreground/10 transition"
          >
            <ChevronRight className="h-3 w-3 text-foreground/50" strokeWidth={2} />
          </Link>
        </div>
      </div>

      {isCancelled && (
        <div className="text-xs text-danger inline-flex items-center gap-1 mb-2 font-medium">
          <XIcon className="h-3 w-3" strokeWidth={2.25} /> Đã huỷ
        </div>
      )}

      <div className="flex-1 space-y-1 min-h-0">
        {approved.length === 0 && pending.length === 0 ? (
          <p className="text-xs text-foreground/30 italic">Chưa có HV</p>
        ) : (
          <>
            {approved.map(r => {
              const isExpanded = expandedId === r.id
              const isBusy = submitting === r.id
              return (
                <div key={r.id}>
                  <button
                    type="button"
                    onClick={() => !isCancelled && setExpandedId(isExpanded ? null : r.id)}
                    disabled={isCancelled}
                    className={`w-full text-left flex items-center gap-1.5 rounded-md -mx-1 px-1 py-0.5 transition ${
                      isExpanded ? 'bg-mist/15' : 'hover:bg-foreground/5'
                    } ${isCancelled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="grid place-items-center h-5 w-5 rounded-pill bg-mist text-paper text-[9px] font-bold shrink-0">
                      {initials(r.student.fullName)}
                    </div>
                    <span className="text-xs text-foreground truncate flex-1">
                      {r.student.fullName}
                    </span>
                    {r.course && (
                      <Chip variant="neutral" className="text-[9px] px-1.5 py-0">
                        {r.course.code}
                      </Chip>
                    )}
                  </button>

                  {isExpanded && !isCancelled && (
                    <div className="flex items-center gap-1 mt-1 mb-1 px-1">
                      <button
                        type="button"
                        onClick={() => handleWithdraw(r.id, r.student.fullName)}
                        disabled={isBusy}
                        title="Rút HV khỏi buổi học để mở slot cho người khác"
                        className="flex-1 inline-flex items-center justify-center gap-1 h-7 px-2 rounded-md bg-warn/15 text-warn text-[10px] font-semibold ring-1 ring-warn/30 hover:bg-warn/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isBusy ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <UserMinus className="h-3 w-3" strokeWidth={2.25} /> Cho nghỉ buổi
                          </>
                        )}
                      </button>
                      <Link
                        href={`/admin/students/${r.student.id}`}
                        title={`Xem hồ sơ ${r.student.fullName}`}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-mist/10 text-mist hover:bg-mist/20 transition"
                      >
                        <ExternalLink className="h-3 w-3" strokeWidth={2.25} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setExpandedId(null)}
                        disabled={isBusy}
                        aria-label="Huỷ thao tác"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-foreground/55 hover:bg-foreground/10 transition disabled:opacity-50"
                      >
                        <XIcon className="h-3 w-3" strokeWidth={2} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {pending.map(r => {
              const isExpanded = expandedId === r.id
              const isBusy = submitting === r.id
              return (
                <div key={r.id}>
                  <button
                    type="button"
                    onClick={() => !isCancelled && setExpandedId(isExpanded ? null : r.id)}
                    disabled={isCancelled}
                    className={`w-full text-left flex items-center gap-1.5 rounded-md -mx-1 px-1 py-0.5 transition ${
                      isExpanded ? 'bg-accent/10' : 'hover:bg-foreground/5'
                    } ${isCancelled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="grid place-items-center h-5 w-5 rounded-pill ring-1 ring-dashed ring-accent text-accent text-[9px] font-bold shrink-0">
                      ?
                    </div>
                    <span className="text-xs text-foreground/70 truncate flex-1 italic">
                      {r.student.fullName}
                    </span>
                    <span className="text-[9px] text-accent font-bold">CHỜ</span>
                  </button>

                  {isExpanded && !isCancelled && (
                    <div className="flex items-center gap-1 mt-1 mb-1 px-1">
                      <button
                        type="button"
                        onClick={() => handleApprove(r.id, r.student.fullName)}
                        disabled={isBusy}
                        className="flex-1 inline-flex items-center justify-center gap-1 h-7 px-2 rounded-md bg-success text-paper text-[10px] font-semibold hover:bg-success/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isBusy ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-3 w-3" strokeWidth={2.5} /> Duyệt
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(r.id, r.student.fullName)}
                        disabled={isBusy}
                        className="flex-1 inline-flex items-center justify-center gap-1 h-7 px-2 rounded-md bg-danger/15 text-danger text-[10px] font-semibold ring-1 ring-danger/30 hover:bg-danger/25 transition disabled:opacity-50"
                      >
                        <XIcon className="h-3 w-3" strokeWidth={2.5} /> Từ chối
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedId(null)}
                        disabled={isBusy}
                        aria-label="Huỷ thao tác"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-foreground/55 hover:bg-foreground/10 transition disabled:opacity-50"
                      >
                        <XIcon className="h-3 w-3" strokeWidth={2} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {pending.length > 0 && expandedId === null && (
        <div className="text-xs text-accent mt-2 pt-2 border-t border-foreground/8 inline-flex items-center gap-1 font-medium">
          <AlertCircle className="h-3 w-3" strokeWidth={2.25} /> {pending.length} chờ duyệt
        </div>
      )}
    </div>
  )
}
