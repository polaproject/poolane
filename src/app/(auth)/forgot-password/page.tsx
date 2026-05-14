'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState('')
  const [hint, setHint] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, fullNameHint: hint || undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }
      setSuccess(true)
    } catch {
      setError('Không thể kết nối tới máy chủ')
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper p-4">
        <div className="w-full max-w-sm glass-card glass-card-hover p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
          <h2 className="font-heading text-xl text-foreground mb-2">Đã gửi yêu cầu</h2>
          <p className="text-sm text-foreground/60 mb-4">
            Lớp sẽ liên hệ bạn qua Zalo/SMS để xác minh và cung cấp mật khẩu mới trong vòng 24h.
          </p>
          <Link href="/login" className="text-sm font-semibold text-[#5B8E9F] hover:underline">
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-4">
      <div className="w-full max-w-sm">
        <div className="glass-card glass-card-hover p-6">
          <h2 className="font-heading text-2xl text-foreground mb-1">Quên mật khẩu</h2>
          <p className="text-sm text-foreground/50 mb-5">
            Nhập SĐT, lớp sẽ liên hệ giúp bạn lấy lại mật khẩu
          </p>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0912 345 678"
                required
                className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 bg-[var(--surface)]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1">
                Họ tên (giúp lớp xác minh nhanh hơn)
              </label>
              <input
                type="text"
                value={hint}
                onChange={e => setHint(e.target.value)}
                maxLength={100}
                placeholder="Nguyễn Văn A"
                className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 bg-[var(--surface)]"
              />
            </div>

            {error && (
              <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting || !phone}
              className="w-full bg-ink-soft text-paper rounded-lg py-2.5 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-50"
            >
              {submitting ? <span className="inline-flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-2" />Đang gửi...</span> : 'Gửi yêu cầu'}
            </button>
          </form>

          <Link href="/login" className="block text-center text-sm text-[#5B8E9F] hover:underline mt-4">
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
