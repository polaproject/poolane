'use client'

import { useState, type ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Loader2, Lock, X } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  trigger: ReactNode
}

/**
 * ChangePasswordDialog — modal đổi mật khẩu self-service.
 *
 * 3 fields: Mật khẩu hiện tại + Mật khẩu mới + Xác nhận.
 * Server verify currentPassword khớp (qua signInWithPassword fresh client)
 * trước khi update. Nếu sai → "Mật khẩu hiện tại không đúng".
 *
 * Flow:
 * 1. User nhập 3 field, validate client (length, match)
 * 2. POST /api/auth/change-password với { currentPassword, newPassword }
 * 3. Server verify + update + audit log
 * 4. Toast success + đóng modal
 */
export function ChangePasswordDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirm('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại')
      return
    }
    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải ít nhất 8 ký tự')
      return
    }
    if (newPassword !== confirm) {
      setError('Xác nhận không khớp')
      return
    }
    if (newPassword === currentPassword) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error?.message ?? 'Có lỗi xảy ra')
        return
      }

      toast.success('Đổi mật khẩu thành công 🎉')
      setOpen(false)
      reset()
    } catch {
      setError('Không thể kết nối tới máy chủ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
      <Dialog.Trigger render={(props) => <span {...props}>{trigger}</span>} />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-sm data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-200" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[min(420px,calc(100vw-2rem))] max-h-[calc(100vh-3rem)] overflow-y-auto bg-[var(--surface)] rounded-card-xl shadow-glass ring-1 ring-foreground/10 p-6 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95 transition-all duration-200">
          <Dialog.Close
            aria-label="Đóng"
            className="absolute top-3 right-3 h-9 w-9 rounded-pill bg-foreground/5 hover:bg-foreground/10 grid place-items-center transition"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </Dialog.Close>

          <div className="grid place-items-center h-12 w-12 rounded-pill bg-accent/15 mb-3">
            <Lock className="h-5 w-5 text-accent" strokeWidth={1.75} />
          </div>
          <Dialog.Title className="lqg-headline text-xl text-foreground mb-1">Đổi mật khẩu</Dialog.Title>
          <Dialog.Description className="text-sm text-foreground/65 mb-4 leading-relaxed">
            Vui lòng nhập mật khẩu hiện tại để xác minh, sau đó đặt mật khẩu mới (≥ 8 ký tự).
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-foreground/55 font-semibold mb-1.5">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mật khẩu đang dùng"
                autoFocus
                required
                disabled={submitting}
                autoComplete="current-password"
                className="w-full px-3 h-10 text-sm rounded-card bg-paper-tint/30 ring-1 ring-foreground/15 focus:ring-accent/40 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-foreground/55 font-semibold mb-1.5">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="≥ 8 ký tự"
                required
                minLength={8}
                disabled={submitting}
                autoComplete="new-password"
                className="w-full px-3 h-10 text-sm rounded-card bg-paper-tint/30 ring-1 ring-foreground/15 focus:ring-accent/40 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-foreground/55 font-semibold mb-1.5">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Nhập lại"
                required
                disabled={submitting}
                autoComplete="new-password"
                className="w-full px-3 h-10 text-sm rounded-card bg-paper-tint/30 ring-1 ring-foreground/15 focus:ring-accent/40 focus:outline-none transition"
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Dialog.Close
                disabled={submitting}
                className="px-4 h-10 text-sm font-medium rounded-pill ring-1 ring-foreground/15 hover:bg-foreground/5 transition disabled:opacity-50"
              >
                Huỷ
              </Dialog.Close>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-accent text-ink rounded-pill h-10 text-sm font-semibold hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang đổi...
                  </>
                ) : (
                  'Đổi mật khẩu'
                )}
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
