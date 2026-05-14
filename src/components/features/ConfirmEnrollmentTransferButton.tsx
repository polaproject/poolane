'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  enrollmentId: string
  memo: string
  debt: number
  courseName: string
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export function ConfirmEnrollmentTransferButton({ enrollmentId, memo, debt, courseName }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [amount, setAmount] = useState(String(debt))
  const [refNumber, setRefNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setError(null)
    const amt = Number(amount)
    if (!amt || amt <= 0) {
      setError('Số tiền không hợp lệ')
      return
    }
    if (amt > debt) {
      setError(`Số tiền không được lớn hơn nợ còn ${fmt(debt)}`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/payments/confirm-enrollment-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
          amount: amt,
          referenceNumber: refNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        })
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }
      setShowModal(false)
      window.location.reload()
    } catch {
      setError('Không thể kết nối')
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700"
      >
        <CheckCircle2 className="w-3.5 h-3.5" /> Xác nhận nhận học phí
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="font-heading text-xl text-[#1C2B4A] mb-1">Xác nhận đã nhận học phí</h3>
            <p className="text-sm text-[#1C2B4A]/60 mb-4">
              Khoá: <strong>{courseName}</strong>. Đối chiếu sao kê và xác nhận:
            </p>

            <div className="bg-[#F6F1EA] rounded-xl p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#1C2B4A]/60">Nợ còn:</span>
                <strong className="text-[#1C2B4A]">{fmt(debt)}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#1C2B4A]/60">Nội dung CK cần tìm:</span>
                <code className="bg-[#1C2B4A]/8 px-2 py-0.5 rounded font-mono font-bold text-[#1C2B4A]">{memo}</code>
              </div>
            </div>

            <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
              Số tiền đã nhận <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={debt}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg bg-white mb-3"
            />

            <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
              Mã giao dịch ngân hàng (tuỳ chọn)
            </label>
            <input
              type="text"
              value={refNumber}
              onChange={e => setRefNumber(e.target.value)}
              placeholder={`Mặc định: ${memo}`}
              className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg bg-white mb-3"
            />

            <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              rows={2}
              maxLength={300}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg bg-white"
            />

            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

            <div className="flex gap-3 mt-4">
              <button
                onClick={confirm}
                disabled={submitting}
                className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Đang xác nhận...</span> : 'Xác nhận'}
              </button>
              <button
                onClick={() => { setShowModal(false); setError(null) }}
                disabled={submitting}
                className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-[#1C2B4A]/15 text-[#1C2B4A]/70"
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
