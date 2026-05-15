'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

const CANCEL_REASONS = [
  { value: 'pool_maintenance', label: 'Hồ bơi bảo trì' },
  { value: 'weather', label: 'Thời tiết xấu' },
  { value: 'teacher_sick', label: 'Giáo viên nghỉ' },
  { value: 'other', label: 'Lý do khác' },
]

export function SessionActions({ sessionId, status }: { sessionId: string; status: string }) {
  const router = useRouter()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [reason, setReason] = useState('pool_maintenance')
  const [reasonText, setReasonText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function doCancel() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, reasonText: reasonText.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }
      setShowCancelModal(false)
      toast.success('Đã huỷ buổi học + thông báo HV')
      router.refresh()
    } catch {
      setError('Không thể kết nối')
      setSubmitting(false)
    }
  }

  async function doRestore() {
    if (!confirm('Mở lại buổi học này? Học viên đã từng đăng ký sẽ được thông báo + giữ nguyên trạng thái duyệt.')) return
    setRestoring(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/restore`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Không thể mở lại')
        setRestoring(false)
        return
      }
      toast.success(`Đã mở lại buổi học + thông báo ${json.data.notifiedCount} HV`)
      router.refresh()
    } catch {
      toast.error('Không thể kết nối')
      setRestoring(false)
    }
  }

  // Completed: không cho phép action gì
  if (status === 'completed') return null

  // Cancelled: chỉ hiện "Mở lại buổi"
  if (status === 'cancelled') {
    return (
      <button
        onClick={doRestore}
        disabled={restoring}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-success/30 text-success hover:bg-success/10 disabled:opacity-50"
      >
        {restoring ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang mở lại...
          </>
        ) : (
          <>
            <RotateCcw className="w-3.5 h-3.5" /> Mở lại buổi
          </>
        )}
      </button>
    )
  }

  // Scheduled / in_progress: hiện "Huỷ buổi"
  return (
    <>
      <button
        onClick={() => setShowCancelModal(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-danger/30 text-danger hover:bg-danger/10"
      >
        <Trash2 className="w-3.5 h-3.5" /> Huỷ buổi học
      </button>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass-card shadow-xl p-6 max-w-md w-full">
            <h3 className="font-heading text-xl text-foreground mb-1">Huỷ buổi học</h3>
            <p className="text-sm text-foreground/60 mb-4">
              Hệ thống sẽ tự động hoàn lại 1 buổi vé cho mọi học viên đã được duyệt và gửi thông báo.
              Nếu cần mở lại, click nút "Mở lại buổi" sau khi huỷ.
            </p>

            <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
              Lý do <span className="text-danger">*</span>
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)] mb-3"
            >
              {CANCEL_REASONS.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
              Mô tả chi tiết (tuỳ chọn)
            </label>
            <textarea
              rows={2}
              maxLength={300}
              value={reasonText}
              onChange={e => setReasonText(e.target.value)}
              placeholder="VD: Hồ bơi bị rò rỉ, sẽ sửa xong vào thứ Hai"
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]"
            />

            {error && <p className="text-sm text-danger mt-2">{error}</p>}

            <div className="flex gap-3 mt-4">
              <button
                onClick={doCancel}
                disabled={submitting}
                className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? (
                  <span className="inline-flex items-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Đang huỷ...
                  </span>
                ) : (
                  'Xác nhận huỷ'
                )}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={submitting}
                className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-foreground/15 text-foreground/70"
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
