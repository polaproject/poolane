'use client'

import Link from 'next/link'
import {
  Users, X as XIcon, AlertCircle, ChevronRight, Check,
} from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import { CAPACITY } from '@/config/constants'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export type RegStatus = 'pending' | 'approved' | 'waitlist' | 'withdrawn'

export interface SessionRegData {
  id: string
  status: RegStatus
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
  /** Set regId đang chọn (managed by parent ScheduleGrid) */
  selectedIds: Set<string>
  onToggle: (regId: string) => void
}

/**
 * Presentational session card với checkbox-driven multi-select.
 * Click checkbox / row body để toggle selection.
 * Action thực tế (Duyệt/Từ chối/Cho nghỉ/Phục hồi) do SelectionActionBar trigger
 * — không expand inline trong card nữa.
 */
export function InteractiveSessionCard({ session, cap, slotLabel, selectedIds, onToggle }: Props) {
  const approved = session.registrations.filter(r => r.status === 'approved')
  const pending = session.registrations.filter(r => r.status === 'pending')
  const withdrawn = session.registrations.filter(r => r.status === 'withdrawn')
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

  function Row({ reg, variant }: { reg: SessionRegData; variant: 'approved' | 'pending' | 'withdrawn' }) {
    const isSelected = selectedIds.has(reg.id)
    const isWithdrawn = variant === 'withdrawn'
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => !isCancelled && onToggle(reg.id)}
          disabled={isCancelled}
          aria-label={isSelected ? 'Bỏ chọn' : 'Chọn'}
          aria-pressed={isSelected}
          className={`grid place-items-center h-4 w-4 rounded-full border shrink-0 transition ${
            isSelected
              ? 'bg-accent border-accent text-ink'
              : 'bg-transparent border-foreground/30 hover:border-accent/60'
          } ${isCancelled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isSelected && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
        </button>

        <div
          className={`grid place-items-center h-5 w-5 rounded-pill text-[9px] font-bold shrink-0 ${
            variant === 'approved'
              ? 'bg-mist text-paper'
              : variant === 'pending'
                ? 'ring-1 ring-dashed ring-accent text-accent'
                : 'ring-1 ring-foreground/25 text-foreground/45 line-through'
          }`}
        >
          {variant === 'pending' ? '?' : initials(reg.student.fullName)}
        </div>

        <span
          className={`text-xs truncate flex-1 ${
            isWithdrawn
              ? 'text-foreground/40 line-through'
              : variant === 'pending'
                ? 'text-foreground/70 italic'
                : 'text-foreground'
          }`}
        >
          {reg.student.fullName}
        </span>

        {reg.course && variant !== 'withdrawn' && (
          <Chip variant="neutral" className="text-[9px] px-1.5 py-0">
            {reg.course.code}
          </Chip>
        )}
        {variant === 'pending' && (
          <span className="text-[9px] text-accent font-bold">CHỜ</span>
        )}
        {variant === 'withdrawn' && (
          <span className="text-[9px] text-foreground/40 font-bold uppercase">Nghỉ</span>
        )}
      </div>
    )
  }

  const totalRegs = approved.length + pending.length + withdrawn.length

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
        {totalRegs === 0 ? (
          <p className="text-xs text-foreground/30 italic">Chưa có HV</p>
        ) : (
          <>
            {approved.map(r => <Row key={r.id} reg={r} variant="approved" />)}
            {pending.map(r => <Row key={r.id} reg={r} variant="pending" />)}
            {withdrawn.map(r => <Row key={r.id} reg={r} variant="withdrawn" />)}
          </>
        )}
      </div>

      {pending.length > 0 && (
        <div className="text-xs text-accent mt-2 pt-2 border-t border-foreground/8 inline-flex items-center gap-1 font-medium">
          <AlertCircle className="h-3 w-3" strokeWidth={2.25} /> {pending.length} chờ duyệt
        </div>
      )}
    </div>
  )
}
