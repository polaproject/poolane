'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, X, Check, UserMinus, Undo2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useScheduleSelection, type BulkAction } from './ScheduleSelectionContext'

interface Props {
  weekOffset: number
}

const ACTION_VALID: Record<BulkAction, string[]> = {
  approve: ['pending', 'waitlist'],
  reject: ['pending', 'waitlist'],
  withdraw: ['approved'],
  restore: ['withdrawn'],
}

const ACTION_LABEL: Record<BulkAction, string> = {
  approve: 'duyệt',
  reject: 'không duyệt',
  withdraw: 'cho nghỉ',
  restore: 'cho đi học lại',
}

/**
 * ScheduleHeaderControls — render trong hero của /admin/schedule.
 * Toggle giữa 2 mode:
 *   - Default: prev/next pill + "Hôm nay" (luôn render, disabled khi current) + "Tạo buổi"
 *   - Selection: ✕ + "X HV chọn (counts)" + 4 bulk action buttons
 *
 * Cùng row position → không xô lệch grid bên dưới khi user select.
 */
export function ScheduleHeaderControls({ weekOffset }: Props) {
  const { selectedIds, counts, clear, lookup, busy, setBusy } = useScheduleSelection()
  const router = useRouter()
  const hasSelection = selectedIds.size > 0

  async function handleAction(action: BulkAction) {
    const targets: Array<{ regId: string; sessionId: string }> = []
    for (const id of selectedIds) {
      const r = lookup.get(id)
      if (r && ACTION_VALID[action].includes(r.status)) {
        targets.push({ regId: id, sessionId: r.sessionId })
      }
    }
    if (targets.length === 0) {
      toast.error('Không có HV nào ở trạng thái phù hợp')
      return
    }

    setBusy(action)
    const payload = action === 'reject' ? { action, rejectedReason: 'teacher_decision' } : { action }

    let ok = 0
    let fail = 0
    await Promise.all(targets.map(async t => {
      try {
        const res = await fetch(`/api/sessions/${t.sessionId}/registrations/${t.regId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) ok++
        else fail++
      } catch {
        fail++
      }
    }))

    if (ok > 0) toast.success(`Đã ${ACTION_LABEL[action]} ${ok} HV${fail > 0 ? ` · ${fail} thất bại` : ''}`)
    else if (fail > 0) toast.error(`Không thể ${ACTION_LABEL[action]} ${fail} HV`)

    setBusy(null)
    clear()
    router.refresh()
  }

  if (hasSelection) {
    return (
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={clear}
          aria-label="Bỏ chọn"
          className="grid place-items-center h-8 w-8 rounded-full glass-pill hover:bg-paper/10 transition shrink-0"
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </button>
        <span className="text-xs font-medium text-paper px-1 shrink-0">
          {selectedIds.size} HV chọn
          <span className="text-paper/55 ml-1">
            ({counts.pending}·{counts.approved}·{counts.withdrawn})
          </span>
        </span>
        <BulkBtn
          action="approve"
          color="success"
          disabled={counts.pending === 0 || busy !== null}
          busy={busy === 'approve'}
          count={counts.pending}
          onClick={() => handleAction('approve')}
          icon={<Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
          label="Duyệt"
        />
        <BulkBtn
          action="reject"
          color="danger"
          disabled={counts.pending === 0 || busy !== null}
          busy={busy === 'reject'}
          count={counts.pending}
          onClick={() => handleAction('reject')}
          icon={<X className="h-3.5 w-3.5" strokeWidth={2.5} />}
          label="Không duyệt"
        />
        <BulkBtn
          action="withdraw"
          color="warn"
          disabled={counts.approved === 0 || busy !== null}
          busy={busy === 'withdraw'}
          count={counts.approved}
          onClick={() => handleAction('withdraw')}
          icon={<UserMinus className="h-3.5 w-3.5" strokeWidth={2.25} />}
          label="Cho nghỉ"
        />
        <BulkBtn
          action="restore"
          color="mist"
          disabled={counts.withdrawn === 0 || busy !== null}
          busy={busy === 'restore'}
          count={counts.withdrawn}
          onClick={() => handleAction('restore')}
          icon={<Undo2 className="h-3.5 w-3.5" strokeWidth={2.25} />}
          label="Phục hồi"
        />
      </div>
    )
  }

  // Default: nav buttons
  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      {/* Pill chỉ prev/next — width cố định, không bị shift bởi "Hôm nay" */}
      <div className="inline-flex items-center gap-1 glass-pill p-1">
        <Link
          href={`/admin/schedule?week=${weekOffset - 1}`}
          aria-label="Tuần trước"
          className="grid place-items-center h-8 w-8 rounded-pill hover:bg-paper/10 transition"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
        </Link>
        <Link
          href={`/admin/schedule?week=${weekOffset + 1}`}
          aria-label="Tuần sau"
          className="grid place-items-center h-8 w-8 rounded-pill hover:bg-paper/10 transition"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
        </Link>
      </div>
      {/* "Hôm nay" tách riêng — luôn render, disabled khi đang current */}
      <Link
        href="/admin/schedule"
        aria-disabled={weekOffset === 0}
        tabIndex={weekOffset === 0 ? -1 : 0}
        className={`h-8 px-3 rounded-pill text-xs font-medium inline-flex items-center glass-pill transition ${
          weekOffset === 0
            ? 'opacity-40 pointer-events-none'
            : 'hover:bg-paper/10'
        }`}
      >
        Hôm nay
      </Link>
      <Link
        href="/admin/sessions/new"
        className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 h-8 rounded-pill text-sm hover:bg-accent/90 transition shadow-cta"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} /> Tạo buổi
      </Link>
    </div>
  )
}

interface BulkBtnProps {
  action: BulkAction
  color: 'success' | 'danger' | 'warn' | 'mist'
  disabled: boolean
  busy: boolean
  count: number
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function BulkBtn({ color, disabled, busy, count, onClick, icon, label }: BulkBtnProps) {
  const colorMap: Record<typeof color, string> = {
    success: 'bg-success text-paper hover:bg-success/90',
    danger: 'bg-danger/20 text-paper ring-1 ring-danger/40 hover:bg-danger/30',
    warn: 'bg-warn/20 text-paper ring-1 ring-warn/40 hover:bg-warn/30',
    mist: 'bg-mist/20 text-paper ring-1 ring-mist/40 hover:bg-mist/30',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 h-8 px-2.5 rounded-pill text-xs font-semibold transition shrink-0 disabled:opacity-30 disabled:cursor-not-allowed ${colorMap[color]}`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      <span>{label}{count > 0 ? ` (${count})` : ''}</span>
    </button>
  )
}
