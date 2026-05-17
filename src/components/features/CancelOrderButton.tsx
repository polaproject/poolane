'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { X, Loader2, AlertTriangle } from 'lucide-react'

interface CancelOrderButtonProps {
  orderId: string
  orderStatus: string
  orderRef: string
}

export function CancelOrderButton({ orderId, orderStatus, orderRef }: CancelOrderButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`/api/student/orders/${orderId}/cancel`, {
        method: 'PATCH',
        signal: AbortSignal.timeout(10_000),
      })
      const j = await r.json()
      if (!r.ok || j.error) {
        setError(j.error?.message ?? 'Không thể huỷ đơn hàng')
        return
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Yêu cầu quá lâu, vui lòng thử lại')
      } else if (err instanceof TypeError) {
        setError('Kiểm tra kết nối mạng của bạn')
      } else {
        setError('Có lỗi xảy ra, vui lòng thử lại')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger
        className="text-xs text-foreground/50 hover:text-danger transition-colors underline-offset-2 hover:underline cursor-pointer"
      >
        Huỷ đơn
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm data-[closed]:opacity-0 transition-opacity duration-150" />
        <AlertDialog.Popup className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="glass-card rounded-card-lg p-6 w-full max-w-sm shadow-glass">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 h-9 w-9 rounded-pill bg-danger/10 grid place-items-center">
                <AlertTriangle className="h-5 w-5 text-danger" />
              </div>
              <div className="flex-1 min-w-0">
                <AlertDialog.Title className="lqg-headline text-base">Huỷ đơn hàng?</AlertDialog.Title>
                <AlertDialog.Description className="text-sm text-foreground/60 mt-1">
                  Đơn <span className="font-mono font-semibold">#{orderRef}</span> sẽ bị huỷ
                  {orderStatus === 'approved' && ' và tồn kho sẽ được hoàn lại'}.
                  Không thể khôi phục sau khi huỷ.
                </AlertDialog.Description>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="shrink-0 text-foreground/40 hover:text-foreground transition-colors"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <p className="text-sm text-danger bg-danger/8 rounded-lg px-3 py-2 mb-4">{error}</p>
            )}

            <div className="flex gap-2 justify-end">
              <AlertDialog.Close
                disabled={loading}
                className="glass-button px-4 py-2 rounded-lg text-sm cursor-pointer disabled:opacity-50"
              >
                Giữ đơn
              </AlertDialog.Close>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm bg-danger text-paper font-medium hover:brightness-110 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Xác nhận huỷ
              </button>
            </div>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
