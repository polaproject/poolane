'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

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
      router.refresh()
    } catch {
      setError('Không thể kết nối')
      setSubmitting(false)
    }
  }

  if (status === 'cancelled' || status === 'completed') return null

  return (
    <>
      <button
        onClick={() => setShowCancelModal(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
      >
        <Trash2 className="w-3.5 h-3.5" /> Huỷ buổi học
      </button>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="font-heading text-xl text-[#1C2B4A] mb-1">Huỷ buổi học</h3>
            <p className="text-sm text-[#1C2B4A]/60 mb-4">
              Hệ thống sẽ tự động hoàn lại 1 buổi vé cho mọi học viên đã được duyệt và gửi thông báo.
            </p>

            <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
              Lý do <span className="text-red-500">*</span>
            </label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg bg-white mb-3">
              {CANCEL_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>

            <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
              Mô tả chi tiết (tuỳ chọn)
            </label>
            <textarea rows={2} maxLength={300} value={reasonText}
              onChange={e => setReasonText(e.target.value)}
              placeholder="VD: Hồ bơi bị rò rỉ, sẽ sửa xong vào thứ Hai"
              className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg bg-white" />

            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

            <div className="flex gap-3 mt-4">
              <button onClick={doCancel} disabled={submitting}
                className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50">
                {submitting ? <span className="inline-flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-2" />Đang huỷ...</span> : 'Xác nhận huỷ'}
              </button>
              <button onClick={() => setShowCancelModal(false)} disabled={submitting}
                className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-[#1C2B4A]/15 text-[#1C2B4A]/70">
                Quay lại
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
