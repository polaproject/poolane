'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Check, X, Loader2, Star, Ticket, CheckSquare, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Chip } from '@/components/ui/Chip'

type Registration = {
  id: string
  status: string
  registeredAt: string
  context: {
    fullName: string
    phone: string
    avgSkill: number | null
    sessionsLeft: number | null
    lastAttendedAt: string | null
    activeEnrollments: Array<{ course: { code: string; name: string } }>
    isLowTicket: boolean
  }
}

const REJECT_REASONS = [
  { value: 'capacity_full', label: 'Ca đã đủ chỗ' },
  { value: 'skill_mismatch', label: 'Kỹ năng chưa phù hợp' },
  { value: 'teacher_decision', label: 'Quyết định giáo viên' },
  { value: 'other', label: 'Lý do khác' },
]

export default function RegistrationsPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ regId: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('capacity_full')
  const [rejectText, setRejectText] = useState('')

  const fetchRegistrations = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await fetch(`/api/sessions/${sessionId}/registrations`)
      const data = await res.json()
      if (data.data) setRegistrations(data.data)
    } catch { toast.error('Không thể tải danh sách') }
    finally { setLoading(false) }
  }, [sessionId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchRegistrations() }, [fetchRegistrations])

  async function handleDecide(regId: string, action: 'approve' | 'reject', reason?: string, reasonText?: string) {
    setProcessing(regId)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/registrations/${regId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectedReason: reason, rejectedReasonText: reasonText }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { toast.error(data.error?.message ?? 'Có lỗi xảy ra'); return }
      toast.success(action === 'approve' ? 'Đã duyệt' : 'Đã từ chối')
      setRejectModal(null)
      fetchRegistrations()
    } catch { toast.error('Không thể kết nối') }
    finally { setProcessing(null) }
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-paper grid place-items-center p-6">
        <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-8 text-center max-w-md">
          <CheckSquare className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
          <p className="lqg-headline text-2xl text-foreground mb-1">Chưa chọn buổi</p>
          <p className="text-sm text-foreground/55 mb-4">Vào lịch học, click vào ô buổi → &ldquo;Xử lý đăng ký&rdquo;.</p>
          <a href="/admin/schedule" className="inline-flex items-center gap-1.5 bg-ink text-paper font-semibold px-5 py-2.5 rounded-pill text-sm hover:bg-foreground/90 transition">
            Mở lịch học
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-3xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
            <CheckSquare className="h-3 w-3 text-accent" strokeWidth={1.75} /> {registrations.length} đăng ký chờ
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Duyệt đăng ký</h1>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-3xl mx-auto relative z-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={1.75} />
          </div>
        ) : registrations.length === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <Check className="h-10 w-10 mx-auto mb-3 text-success" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">Đã hết</p>
            <p className="text-sm text-foreground/55">Không có đăng ký nào đang chờ duyệt.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {registrations.map(reg => {
              const ctx = reg.context
              return (
                <div key={reg.id} className="glass-card glass-card-hover p-5">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{ctx.fullName}</p>
                      <p className="text-xs text-foreground/55">{ctx.phone}</p>
                    </div>
                    <div className="text-right space-y-1">
                      {ctx.avgSkill !== null && (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                          <Star className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} /> {ctx.avgSkill}
                        </span>
                      )}
                      {reg.status === 'waitlist' && <Chip variant="mist">Chờ chỗ</Chip>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {ctx.lastAttendedAt && (
                      <Chip variant="mist">{formatDistanceToNow(new Date(ctx.lastAttendedAt), { addSuffix: true, locale: vi })}</Chip>
                    )}
                    {ctx.activeEnrollments.map(e => (
                      <Chip key={e.course.code} variant="neutral">{e.course.code}</Chip>
                    ))}
                    {ctx.sessionsLeft !== null && (
                      <Chip variant={ctx.isLowTicket ? 'danger' : 'mist'} active={ctx.isLowTicket}>
                        <Ticket className="h-3 w-3" strokeWidth={2.25} /> {ctx.sessionsLeft} buổi
                      </Chip>
                    )}
                    {ctx.sessionsLeft === null && (
                      <Chip variant="warn" active>
                        <AlertCircle className="h-3 w-3" strokeWidth={2.25} /> Chưa có vé
                      </Chip>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setRejectModal({ regId: reg.id, name: ctx.fullName })}
                      disabled={processing === reg.id}
                      className="flex-1 h-10 rounded-pill ring-1 ring-danger/30 text-danger text-sm hover:bg-danger/5 transition inline-flex items-center justify-center gap-1.5"
                    >
                      <X className="h-4 w-4" strokeWidth={2.25} /> Từ chối
                    </button>
                    <button
                      onClick={() => handleDecide(reg.id, 'approve')}
                      disabled={processing === reg.id}
                      className="flex-[2] h-10 rounded-pill bg-ink text-paper text-sm font-semibold hover:bg-foreground/90 transition inline-flex items-center justify-center gap-1.5"
                    >
                      {processing === reg.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><Check className="h-4 w-4 text-accent" strokeWidth={2.5} /> Duyệt</>
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm grid place-items-center z-50 p-4">
          <div className="rounded-card-xl bg-[var(--surface)] shadow-glass ring-1 ring-foreground/8 p-6 w-full max-w-md">
            <p className="eyebrow text-danger mb-1">Từ chối đăng ký</p>
            <h3 className="lqg-headline text-2xl text-foreground mb-4">{rejectModal.name}</h3>

            <div className="space-y-2 mb-4">
              {REJECT_REASONS.map(r => (
                <label
                  key={r.value}
                  className={`flex items-center gap-2 cursor-pointer rounded-card px-3 py-2 ring-1 transition ${
                    rejectReason === r.value
                      ? 'bg-paper-tint/60 ring-accent/30'
                      : 'ring-foreground/10 hover:bg-paper-tint/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={rejectReason === r.value}
                    onChange={e => setRejectReason(e.target.value)}
                    className="accent-ink"
                  />
                  <span className="text-sm text-foreground">{r.label}</span>
                </label>
              ))}
            </div>

            <textarea
              placeholder="Ghi chú thêm cho học viên (tuỳ chọn)"
              value={rejectText}
              onChange={e => setRejectText(e.target.value)}
              rows={2}
              className="w-full text-sm px-3 py-2 rounded-card bg-paper-tint/40 ring-1 ring-foreground/10 focus:ring-accent/40 focus:outline-none resize-none mb-4 transition"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 h-10 rounded-pill ring-1 ring-foreground/15 text-sm hover:bg-foreground/5 transition"
              >
                Huỷ
              </button>
              <button
                onClick={() => handleDecide(rejectModal.regId, 'reject', rejectReason, rejectText)}
                disabled={processing === rejectModal.regId}
                className="flex-1 h-10 rounded-pill bg-danger text-paper text-sm font-semibold hover:bg-danger/90 transition disabled:opacity-60 inline-flex items-center justify-center"
              >
                {processing === rejectModal.regId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
