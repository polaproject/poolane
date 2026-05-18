'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog } from '@base-ui/react/dialog'
import { RotateCcw, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  paymentId: string
}

/**
 * Button "Đảo bút toán" + Dialog confirm với input lý do.
 * KHÔNG xoá Payment gốc — chỉ tạo bút toán đảo (amount âm).
 */
export function TransactionRowActions({ paymentId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleReverse() {
    if (reason.trim().length < 3) {
      toast.error('Lý do tối thiểu 3 ký tự')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/transactions/${paymentId}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error(data.error?.message ?? 'Không thể đảo bút toán')
        return
      }
      toast.success('Đã tạo bút toán đảo')
      setOpen(false)
      setReason('')
      router.refresh()
    } catch {
      toast.error('Không thể kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-foreground/65 hover:text-danger px-2 py-1 rounded-md hover:bg-danger/5 transition shrink-0"
        title="Đảo bút toán"
      >
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} /> Đảo
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-sm data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-200" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[min(440px,calc(100vw-2rem))] max-h-[calc(100vh-3rem)] overflow-y-auto bg-[var(--surface)] rounded-card-xl shadow-glass ring-1 ring-foreground/10 p-5 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95 transition-all duration-200">
            <Dialog.Close
              aria-label="Đóng"
              className="absolute top-3 right-3 h-9 w-9 rounded-pill bg-foreground/5 hover:bg-foreground/10 grid place-items-center transition"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </Dialog.Close>

            <Dialog.Title className="lqg-headline text-xl text-foreground mb-2 pr-10">
              Đảo bút toán
            </Dialog.Title>
            <Dialog.Description className="text-sm text-foreground/65 mb-4 leading-relaxed">
              Hệ thống sẽ tạo Payment mới với số tiền âm (đảo). KHÔNG xoá bản gốc.
              Audit log đầy đủ.
            </Dialog.Description>

            <label className="block text-sm font-medium text-foreground mb-1">
              Lý do <span className="text-danger">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Vd: Nhập sai amount, đúng phải 550k"
              className="w-full px-3 py-2 rounded-lg border border-foreground/15 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="px-4 h-10 text-sm font-medium rounded-pill ring-1 ring-foreground/15 hover:bg-foreground/5 transition disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleReverse}
                disabled={submitting || reason.trim().length < 3}
                className="flex-1 bg-danger text-paper rounded-pill h-10 text-sm font-semibold hover:brightness-105 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Đang đảo...</>
                ) : (
                  'Xác nhận đảo bút toán'
                )}
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
