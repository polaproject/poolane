'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  orderId: string
  memo: string
  amount: number
  onSuccess?: () => void
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export function ConfirmTransferButton({ orderId, memo, amount, onSuccess }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [refNumber, setRefNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/payments/confirm-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
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
      onSuccess?.()
      // Refresh page
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
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-success text-white rounded-lg text-xs font-semibold hover:bg-success"
      >
        <CheckCircle2 className="w-3.5 h-3.5" /> Xác nhận đã nhận tiền
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass-card shadow-xl p-6 max-w-md w-full">
            <h3 className="font-heading text-xl text-foreground mb-1">Xác nhận đã nhận chuyển khoản</h3>
            <p className="text-sm text-foreground/60 mb-4">
              Hãy đối chiếu sao kê ngân hàng và xác nhận giao dịch có nội dung khớp:
            </p>

            <div className="bg-paper rounded-xl p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/60">Số tiền cần nhận:</span>
                <strong className="text-foreground">{fmt(amount)}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground/60">Nội dung CK:</span>
                <code className="bg-ink/8 px-2 py-0.5 rounded font-mono font-bold text-foreground">{memo}</code>
              </div>
            </div>

            <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
              Mã giao dịch ngân hàng (tuỳ chọn)
            </label>
            <input
              type="text"
              value={refNumber}
              onChange={e => setRefNumber(e.target.value)}
              placeholder={`Mặc định: ${memo}`}
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)] mb-3"
            />

            <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              rows={2}
              maxLength={300}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]"
            />

            {error && <p className="text-sm text-danger mt-2">{error}</p>}

            <div className="flex gap-3 mt-4">
              <button
                onClick={confirm}
                disabled={submitting}
                className="flex-1 bg-success text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-success disabled:opacity-50"
              >
                {submitting ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Đang xác nhận...</span> : 'Xác nhận'}
              </button>
              <button
                onClick={() => { setShowModal(false); setError(null) }}
                disabled={submitting}
                className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-foreground/15 text-foreground/70"
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
