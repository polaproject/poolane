'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Check, X, Loader2, Clock, Star, Ticket } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

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
    } catch {
      toast.error('Không thể tải danh sách đăng ký')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

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

      if (!res.ok || data.error) {
        toast.error(data.error?.message ?? 'Có lỗi xảy ra')
        return
      }

      toast.success(action === 'approve' ? '✓ Đã duyệt' : '✗ Đã từ chối')
      setRejectModal(null)
      fetchRegistrations()

    } catch {
      toast.error('Không thể kết nối')
    } finally {
      setProcessing(null)
    }
  }

  if (!sessionId) {
    return (
      <div className="p-6 text-center text-[#1C2B4A]/50">
        Chọn một buổi học từ <a href="/admin/schedule" className="text-[#5B8E9F] underline">lịch học</a>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Duyệt đăng ký</h1>
        <p className="text-sm text-[#1C2B4A]/50 mt-1">
          {registrations.length} học viên đang chờ duyệt
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#1C2B4A]/40" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="text-center py-12 text-[#1C2B4A]/40">
          Không có đăng ký nào đang chờ duyệt
        </div>
      ) : (
        <div className="space-y-3">
          {registrations.map(reg => {
            const ctx = reg.context
            return (
              <div key={reg.id} className="bg-white rounded-2xl border border-[#1C2B4A]/8 p-5 shadow-sm">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-[#1C2B4A]">{ctx.fullName}</p>
                    <p className="text-xs text-[#1C2B4A]/50">{ctx.phone}</p>
                  </div>
                  <div className="text-right">
                    {ctx.avgSkill !== null && (
                      <div className="flex items-center gap-1 justify-end">
                        <Star className="w-3 h-3 text-[#C8A84B]" />
                        <span className="text-sm font-semibold text-[#1C2B4A]">{ctx.avgSkill}</span>
                      </div>
                    )}
                    {reg.status === 'waitlist' && (
                      <Badge variant="outline" className="text-xs mt-1">Chờ chỗ trống</Badge>
                    )}
                  </div>
                </div>

                {/* Context tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {ctx.lastAttendedAt && (
                    <span className="text-xs bg-[#5B8E9F]/10 text-[#5B8E9F] px-2 py-0.5 rounded-full">
                      {formatDistanceToNow(new Date(ctx.lastAttendedAt), { addSuffix: true, locale: vi })}
                    </span>
                  )}
                  {ctx.activeEnrollments.map(e => (
                    <span key={e.course.code} className="text-xs bg-[#1C2B4A]/8 text-[#1C2B4A] px-2 py-0.5 rounded-full font-medium">
                      {e.course.code}
                    </span>
                  ))}
                  {ctx.sessionsLeft !== null && (
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      ctx.isLowTicket
                        ? 'bg-red-50 text-red-600'
                        : 'bg-[#1C2B4A]/8 text-[#1C2B4A]'
                    }`}>
                      <Ticket className="w-3 h-3" />
                      {ctx.sessionsLeft} buổi vé
                    </span>
                  )}
                  {ctx.sessionsLeft === null && (
                    <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                      Chưa có vé
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={processing === reg.id}
                    onClick={() => setRejectModal({ regId: reg.id, name: ctx.fullName })}
                  >
                    <X className="w-4 h-4 mr-1" /> Từ chối
                  </Button>
                  <Button
                    size="sm"
                    className="flex-2 bg-[#1C2B4A] text-[#F6F1EA] hover:bg-[#1C2B4A]/90"
                    style={{ flex: 2 }}
                    disabled={processing === reg.id}
                    onClick={() => handleDecide(reg.id, 'approve')}
                  >
                    {processing === reg.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><Check className="w-4 h-4 mr-1" /> Duyệt</>
                    }
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-[#1C2B4A] mb-1">Từ chối đăng ký</h3>
            <p className="text-sm text-[#1C2B4A]/60 mb-4">{rejectModal.name}</p>

            <div className="space-y-2 mb-4">
              {REJECT_REASONS.map(r => (
                <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={rejectReason === r.value}
                    onChange={e => setRejectReason(e.target.value)}
                    className="accent-[#1C2B4A]"
                  />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>

            <textarea
              placeholder="Ghi chú thêm cho học viên (tuỳ chọn)"
              value={rejectText}
              onChange={e => setRejectText(e.target.value)}
              rows={2}
              className="w-full text-sm px-3 py-2 rounded-lg border border-[#1C2B4A]/15 mb-4 resize-none focus:outline-none"
            />

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRejectModal(null)}>
                Huỷ
              </Button>
              <Button
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
                disabled={processing === rejectModal.regId}
                onClick={() => handleDecide(rejectModal.regId, 'reject', rejectReason, rejectText)}
              >
                {processing === rejectModal.regId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Từ chối'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
