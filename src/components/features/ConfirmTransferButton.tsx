'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Dialog } from '@base-ui/react/dialog'

interface Props {
  orderId: string
  memo: string
  amount: number
  onSuccess?: () => void
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

/**
 * Phase 18.1: refactor sang Dialog của @base-ui/react để render qua Portal
 * tại document.body — tránh bị clip trong parent có `will-change: transform`
 * + `overflow: hidden` (lqg-card-hover). Trước đó modal `fixed inset-0` bị
 * giam trong order card stacking context.
 */
export function ConfirmTransferButton({ orderId, memo, amount, onSuccess }: Props) {
  const [open, setOpen] = useState(false)
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
      setOpen(false)
      onSuccess?.()
      window.location.reload()
    } catch {
      setError('Không thể kết nối')
      setSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="inline-flex items-center justify-center gap-1.5 px-3 h-10 bg-success text-paper rounded-pill text-xs font-semibold hover:bg-success/90 transition"
      >
        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.25} /> Xác nhận đã nhận tiền
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-sm data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-200" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[min(440px,calc(100vw-2rem))] max-h-[calc(100vh-3rem)] overflow-y-auto bg-[var(--surface)] rounded-card-xl shadow-glass ring-1 ring-foreground/10 p-6 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95 transition-all duration-200">
          <Dialog.Title className="lqg-headline text-xl text-foreground mb-1">
            Xác nhận đã nhận chuyển khoản
          </Dialog.Title>
          <Dialog.Description className="text-sm text-foreground/65 mb-4 leading-relaxed">
            Hãy đối chiếu sao kê ngân hàng và xác nhận giao dịch có nội dung khớp:
          </Dialog.Description>

          <div className="bg-paper-tint/40 rounded-card p-4 mb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/65">Số tiền cần nhận:</span>
              <strong className="text-foreground">{fmt(amount)}</strong>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-foreground/65 shrink-0">Nội dung CK:</span>
              <code className="bg-ink/8 px-2 py-0.5 rounded font-mono font-bold text-foreground text-xs">{memo}</code>
            </div>
          </div>

          <label className="block text-xs uppercase tracking-wider text-foreground/55 font-semibold mb-1.5">
            Mã giao dịch ngân hàng (tuỳ chọn)
          </label>
          <input
            type="text"
            value={refNumber}
            onChange={e => setRefNumber(e.target.value)}
            placeholder={`Mặc định: ${memo}`}
            className="w-full px-3 h-10 text-sm rounded-card bg-paper-tint/30 ring-1 ring-foreground/15 focus:ring-accent/40 focus:outline-none mb-3 transition"
          />

          <label className="block text-xs uppercase tracking-wider text-foreground/55 font-semibold mb-1.5">
            Ghi chú (tuỳ chọn)
          </label>
          <textarea
            rows={2}
            maxLength={300}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-card bg-paper-tint/30 ring-1 ring-foreground/15 focus:ring-accent/40 focus:outline-none transition resize-none"
          />

          {error && <p className="text-sm text-danger mt-2">{error}</p>}

          <div className="flex gap-2 mt-5">
            <Dialog.Close
              disabled={submitting}
              className="px-4 h-10 text-sm font-medium rounded-pill ring-1 ring-foreground/15 text-foreground/75 hover:bg-foreground/5 transition disabled:opacity-50"
            >
              Huỷ
            </Dialog.Close>
            <button
              onClick={confirm}
              disabled={submitting}
              className="flex-1 bg-success text-paper rounded-pill h-10 text-sm font-semibold hover:bg-success/90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang xác nhận...</>
              ) : 'Xác nhận đã nhận tiền'}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
