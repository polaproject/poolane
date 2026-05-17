'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Users, X as XIcon, AlertCircle } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import { CAPACITY } from '@/config/constants'
import { useScheduleSelection } from './ScheduleSelectionContext'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export type RegStatus = 'pending' | 'approved' | 'waitlist' | 'withdrawn'

export interface SessionRegData {
  id: string
  status: RegStatus
  student: { id: string; fullName: string; avatarUrl: string | null }
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
}

/**
 * Session card với selection theo Context.
 * Row HV: button toàn dòng. Click → toggle selection. Shift+click → range
 * select. Avatar img + tên 1 dòng truncate. Border accent khi selected.
 *
 * Card header rút gọn: chỉ Chip capacity (X/Y) + chip border "Chi tiết →"
 * link tới session detail. Bỏ slotLabel "5:30/18:00" (đã có trong header
 * grid "Ca sáng · 5:30 – 7:30").
 */
export function InteractiveSessionCard({ session, cap }: Props) {
  const { selectedIds, toggle, toggleRange, registerLookup } = useScheduleSelection()

  const approved = session.registrations.filter(r => r.status === 'approved')
  const pending = session.registrations.filter(r => r.status === 'pending')
  const withdrawn = session.registrations.filter(r => r.status === 'withdrawn')
  const isFull = approved.length >= cap
  const isLow =
    approved.length < (session.timeSlot === 'morning' ? CAPACITY.MORNING_MIN : CAPACITY.EVENING_MIN)
  const isCancelled = session.status === 'cancelled'

  // Đăng ký regs vào context lookup khi mount/update (cho range select +
  // bulk action handler trong header biết status từng reg)
  useEffect(() => {
    registerLookup(session.registrations.map(r => ({
      id: r.id,
      sessionId: session.id,
      status: r.status,
      fullName: r.student.fullName,
    })))
  }, [session, registerLookup])

  // orderedIds = display order (approved → pending → withdrawn) cho range select
  const orderedIds = useMemo(
    () => [...approved, ...pending, ...withdrawn].map(r => r.id),
    [approved, pending, withdrawn]
  )

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

    function handleClick(e: React.MouseEvent) {
      if (isCancelled) return
      if (e.shiftKey) toggleRange(reg.id, orderedIds)
      else toggle(reg.id)
    }

    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isCancelled}
        aria-pressed={isSelected}
        className={`w-full flex items-center gap-1.5 px-1.5 py-1 rounded-card text-left transition-all ring-1 ${
          isSelected
            ? 'ring-2 ring-accent bg-accent/10'
            : 'ring-transparent hover:ring-foreground/15 hover:bg-foreground/3'
        } ${isCancelled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {/* Avatar */}
        <div className={`h-6 w-6 rounded-pill overflow-hidden shrink-0 grid place-items-center bg-paper-tint ${
          variant === 'pending' ? 'ring-1 ring-dashed ring-accent' : 'ring-1 ring-foreground/15'
        } ${isWithdrawn ? 'opacity-50' : ''}`}>
          {reg.student.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={reg.student.avatarUrl} alt={reg.student.fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[9px] font-bold text-foreground/70">
              {initials(reg.student.fullName)}
            </span>
          )}
        </div>

        {/* Tên 1 dòng truncate */}
        <span
          title={reg.student.fullName}
          className={`text-xs flex-1 min-w-0 truncate ${
            isWithdrawn
              ? 'text-foreground/40 line-through'
              : variant === 'pending'
                ? 'text-foreground/70 italic'
                : 'text-foreground'
          }`}
        >
          {reg.student.fullName}
        </span>

        {/* Course chip — chỉ hiện khi có khoá, không hiện khi đã rút */}
        {reg.course && variant !== 'withdrawn' && (
          <Chip variant="neutral" className="text-[9px] px-1.5 py-0 shrink-0">{reg.course.code}</Chip>
        )}
      </button>
    )
  }

  const totalRegs = approved.length + pending.length + withdrawn.length

  return (
    <div
      className={`rounded-card p-3 ring-1 hover:-translate-y-0.5 hover:shadow-soft transition-all min-h-[180px] flex flex-col ${tone}`}
    >
      {/* Header rút gọn — chỉ capacity + "Chi tiết →" chip border */}
      <div className="flex items-center justify-between mb-2 gap-1.5">
        <Chip variant={isFull ? 'mist' : isLow ? 'warn' : 'neutral'} className="text-[10px]">
          <Users className="h-2.5 w-2.5" strokeWidth={2.25} /> {approved.length}/{cap}
        </Chip>
        <Link
          href={`/admin/schedule/sessions/${session.id}`}
          className="inline-flex items-center gap-0.5 px-2 h-5 rounded-pill ring-1 ring-foreground/15 text-[10px] font-medium text-foreground/70 hover:bg-foreground/5 hover:ring-foreground/25 transition shrink-0"
        >
          Chi tiết →
        </Link>
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
