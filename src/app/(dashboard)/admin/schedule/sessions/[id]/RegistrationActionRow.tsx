'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Phone, BookOpen, TrendingUp, Loader2, Check, X, AlertCircle,
} from 'lucide-react'
import { Chip } from '@/components/ui/Chip'

type Variant = 'neutral' | 'accent' | 'mist' | 'success' | 'warn' | 'danger'

const REG_STATUS: Record<string, { label: string; variant: Variant }> = {
  pending:   { label: 'Chờ duyệt', variant: 'warn' },
  approved:  { label: 'Đã duyệt',  variant: 'success' },
  rejected:  { label: 'Từ chối',   variant: 'danger' },
  waitlist:  { label: 'Chờ slot',  variant: 'mist' },
  withdrawn: { label: 'Đã rút',    variant: 'neutral' },
}

const ATT_STATUS: Record<string, { label: string; variant: Variant }> = {
  present:  { label: 'Có mặt', variant: 'success' },
  absent:   { label: 'Vắng',   variant: 'danger' },
  walk_in:  { label: 'Walk-in', variant: 'mist' },
}

const REJECT_REASONS = [
  { value: 'capacity_full', label: 'Hết chỗ' },
  { value: 'skill_mismatch', label: 'Trình độ không phù hợp' },
  { value: 'teacher_decision', label: 'Theo quyết định giáo viên' },
  { value: 'other', label: 'Khác' },
]

export interface RegRowData {
  id: string
  status: string
  studentId: string
  studentCode: string
  fullName: string
  phone: string | null
  courseCode: string | null
  /** Vé bơi còn lại (n buổi) */
  sessionsLeft: number | null
  /** Tiến độ khoá đang học (vd "Buổi 5/10") */
  progressLabel: string | null
  /** Avg điểm assessment gần nhất (1-5), null nếu chưa có */
  avgScore: number | null
  /** Số kỹ năng yếu (<=2) trong assessment gần nhất */
  weakSkillCount: number
  /** Status enrollment (active/extension/completed) */
  enrollmentStatus: string | null
  /** Trạng thái điểm danh (nếu đã có) */
  attendance?: string | null
}

interface Props {
  reg: RegRowData
  sessionId: string
  showActions: boolean
}

export function RegistrationActionRow({ reg, sessionId, showActions }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('capacity_full')
  const [rejectReasonText, setRejectReasonText] = useState('')

  const regCfg = REG_STATUS[reg.status] ?? REG_STATUS.pending
  const attCfg = reg.attendance ? ATT_STATUS[reg.attendance] : null
  const isLowTicket = reg.sessionsLeft != null && reg.sessionsLeft <= 2

  const initials = reg.fullName
    .split(/\s+/)
    .map(w => w[0])
    .slice(-2)
    .join('')
    .toUpperCase()

  async function handleApprove() {
    setSubmitting('approve')
    try {
      const res = await fetch(`/api/sessions/${sessionId}/registrations/${reg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Không thể duyệt')
        setSubmitting(null)
        return
      }
      toast.success(`Đã duyệt ${reg.fullName}`)
      router.refresh()
      setSubmitting(null)
    } catch {
      toast.error('Không thể kết nối')
      setSubmitting(null)
    }
  }

  async function handleReject() {
    setSubmitting('reject')
    try {
      const res = await fetch(`/api/sessions/${sessionId}/registrations/${reg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejectedReason: rejectReason,
          rejectedReasonText: rejectReasonText.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Không thể từ chối')
        setSubmitting(null)
        return
      }
      toast.success(`Đã từ chối ${reg.fullName}`)
      setShowRejectModal(false)
      router.refresh()
      setSubmitting(null)
    } catch {
      toast.error('Không thể kết nối')
      setSubmitting(null)
    }
  }

  return (
    <>
      <div className="px-5 py-3.5 flex items-center gap-3 hover:bg-foreground/3 transition">
        {/* Avatar */}
        <div className="grid place-items-center h-10 w-10 rounded-pill bg-mist text-paper text-xs font-bold shrink-0">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Link
              href={`/admin/students/${reg.studentId}`}
              className="text-sm font-medium text-foreground hover:text-accent transition"
            >
              {reg.fullName}
            </Link>
            {reg.courseCode && (
              <span className="inline-flex items-center gap-1 text-xs text-accent font-semibold tabular-nums">
                <BookOpen className="h-3 w-3" strokeWidth={2.25} />
                {reg.courseCode}
              </span>
            )}
            {reg.enrollmentStatus === 'extension' && (
              <Chip variant="warn" className="text-[10px]">Ôn luyện</Chip>
            )}
            {reg.enrollmentStatus === 'completed' && (
              <Chip variant="success" className="text-[10px]">Tốt nghiệp</Chip>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-foreground/55 mt-0.5 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" strokeWidth={1.75} />
              {reg.phone ?? '—'}
            </span>
            <span className="font-mono opacity-75">{reg.studentCode}</span>
            {reg.progressLabel && (
              <span className="inline-flex items-center gap-1 text-mist font-medium">
                <TrendingUp className="h-3 w-3" strokeWidth={2} />
                {reg.progressLabel}
              </span>
            )}
            {reg.avgScore !== null && (
              <span className={`inline-flex items-center gap-0.5 tabular-nums ${
                reg.avgScore >= 4 ? 'text-success font-medium' :
                reg.avgScore <= 2 ? 'text-danger font-medium' :
                ''
              }`}>
                ★ {reg.avgScore.toFixed(1)}/5
              </span>
            )}
            {reg.weakSkillCount > 0 && (
              <span className="text-warn font-medium tabular-nums">
                {reg.weakSkillCount} kỹ năng yếu
              </span>
            )}
            {reg.sessionsLeft !== null && (
              <span className={isLowTicket ? 'text-danger font-medium' : ''}>
                Vé: {reg.sessionsLeft}
              </span>
            )}
          </div>
        </div>

        {/* Status + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {attCfg && (
            <Chip variant={attCfg.variant} active className="text-[10px]">
              {attCfg.label}
            </Chip>
          )}

          {showActions ? (
            <>
              <button
                type="button"
                onClick={handleApprove}
                disabled={submitting !== null}
                title="Duyệt đăng ký"
                aria-label="Duyệt"
                className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-success text-paper hover:scale-110 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
              >
                {submitting === 'approve' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={submitting !== null}
                title="Từ chối"
                aria-label="Từ chối"
                className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-danger/10 text-danger ring-1 ring-danger/30 hover:bg-danger/20 transition disabled:opacity-50"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <Chip variant={regCfg.variant} active className="text-[10px]">
              {regCfg.label}
            </Chip>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-card-xl bg-[var(--surface)] shadow-xl p-6 max-w-md w-full">
            <h3 className="lqg-headline text-xl text-foreground mb-1">Từ chối đăng ký</h3>
            <p className="text-sm text-foreground/60 mb-4">
              Học viên: <strong>{reg.fullName}</strong>
            </p>

            <label className="block text-xs uppercase tracking-wider text-foreground/55 font-semibold mb-1.5">
              Lý do <span className="text-danger">*</span>
            </label>
            <select
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)] mb-3"
            >
              {REJECT_REASONS.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <label className="block text-xs uppercase tracking-wider text-foreground/55 font-semibold mb-1.5">
              Ghi chú thêm (HV sẽ thấy)
            </label>
            <textarea
              rows={2}
              maxLength={200}
              value={rejectReasonText}
              onChange={e => setRejectReasonText(e.target.value)}
              placeholder="VD: Buổi này ưu tiên HV trình độ Sải"
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]"
            />

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={handleReject}
                disabled={submitting === 'reject'}
                className="flex-1 bg-danger text-paper rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {submitting === 'reject' ? (
                  <span className="inline-flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Đang từ chối...
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2">
                    <AlertCircle className="h-4 w-4" strokeWidth={2.25} />
                    Xác nhận từ chối
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                disabled={submitting === 'reject'}
                className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-foreground/15 text-foreground/70 hover:bg-foreground/5"
              >
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
