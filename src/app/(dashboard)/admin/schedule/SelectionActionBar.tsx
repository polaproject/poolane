'use client'

import { Check, X as XIcon, UserMinus, Undo2, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

export type BulkAction = 'approve' | 'reject' | 'withdraw' | 'restore'

interface Props {
  selectedCount: number
  /** Count theo status hiện đang chọn — drive enable/disable + hiển thị (n) */
  counts: { pending: number; approved: number; withdrawn: number }
  busy: BulkAction | null
  onAction: (action: BulkAction) => void
  onClear: () => void
}

/**
 * Top sticky action bar — chỉ render khi có selection. Action button enable
 * dựa trên số HV chọn ở status hợp lệ.
 */
export function SelectionActionBar({ selectedCount, counts, busy, onAction, onClear }: Props) {
  if (selectedCount === 0) return null

  return (
    <div className="sticky top-2 z-30 mb-3">
      <div className="rounded-card-lg bg-ink text-paper ring-1 ring-paper/15 shadow-glass px-4 py-2.5 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onClear}
          aria-label="Bỏ chọn tất cả"
          className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-paper/10 transition"
        >
          <XIcon className="h-4 w-4" strokeWidth={2.25} />
        </button>
        <span className="text-sm font-medium">
          {selectedCount} HV đã chọn
        </span>
        <span className="text-xs text-paper/55">
          ({counts.pending} chờ · {counts.approved} đã duyệt · {counts.withdrawn} nghỉ)
        </span>

        <div className="ml-auto flex items-center gap-1.5 flex-wrap">
          <ActionBtn
            color="success"
            disabled={counts.pending === 0 || busy !== null}
            busy={busy === 'approve'}
            onClick={() => onAction('approve')}
            icon={<Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
            label={`Duyệt${counts.pending > 0 ? ` (${counts.pending})` : ''}`}
          />
          <ActionBtn
            color="danger"
            disabled={counts.pending === 0 || busy !== null}
            busy={busy === 'reject'}
            onClick={() => onAction('reject')}
            icon={<XIcon className="h-3.5 w-3.5" strokeWidth={2.5} />}
            label={`Không duyệt${counts.pending > 0 ? ` (${counts.pending})` : ''}`}
          />
          <ActionBtn
            color="warn"
            disabled={counts.approved === 0 || busy !== null}
            busy={busy === 'withdraw'}
            onClick={() => onAction('withdraw')}
            icon={<UserMinus className="h-3.5 w-3.5" strokeWidth={2.25} />}
            label={`Cho nghỉ${counts.approved > 0 ? ` (${counts.approved})` : ''}`}
          />
          <ActionBtn
            color="mist"
            disabled={counts.withdrawn === 0 || busy !== null}
            busy={busy === 'restore'}
            onClick={() => onAction('restore')}
            icon={<Undo2 className="h-3.5 w-3.5" strokeWidth={2.25} />}
            label={`Cho đi học lại${counts.withdrawn > 0 ? ` (${counts.withdrawn})` : ''}`}
          />
        </div>
      </div>
    </div>
  )
}

interface BtnProps {
  color: 'success' | 'danger' | 'warn' | 'mist'
  disabled: boolean
  busy: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}
function ActionBtn({ color, disabled, busy, onClick, icon, label }: BtnProps) {
  const colorClass: Record<typeof color, string> = {
    success: 'bg-success text-paper hover:bg-success/90',
    danger: 'bg-danger/20 text-danger ring-1 ring-danger/40 hover:bg-danger/30',
    warn: 'bg-warn/20 text-warn ring-1 ring-warn/40 hover:bg-warn/30',
    mist: 'bg-mist/20 text-mist ring-1 ring-mist/40 hover:bg-mist/30',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 h-8 px-3 rounded-pill text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${colorClass[color]}`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      <span>{label}</span>
    </button>
  )
}
