'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ArrowLeft } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { PolarisStar } from '@/components/brand/PolarisStar'
import { GlassCard, GlassButton, GlassInput, AmbientMesh } from '@/components/ui/glass'

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

  // Success state — đã gửi yêu cầu
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <AmbientMesh />
        <div className="w-full max-w-sm relative z-10">
          <div className="flex flex-col items-center mb-8">
            <span className="mb-3 lqg-text-primary">
              <PolarisStar size={48} withReflection animated glow />
            </span>
            <h1 className="font-body font-bold text-lg tracking-[0.18em] lqg-text-primary">
              POOLANE
            </h1>
          </div>

          <GlassCard tier="heavy" radius="xl" interactive={false} className="p-7 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-success/15 ring-1 ring-success/30 mb-4">
              <CheckCircle2 className="h-7 w-7 text-success" strokeWidth={2} />
            </div>
            <h2 className="lqg-display text-2xl mb-2">Đã gửi yêu cầu</h2>
            <p className="text-sm lqg-text-secondary mb-5 leading-relaxed">
              Lớp sẽ liên hệ bạn qua Zalo/SMS để xác minh và cung cấp mật khẩu mới trong vòng{' '}
              <strong className="lqg-text-primary">24 giờ</strong>.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold lqg-text-accent hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.25} /> Quay lại đăng nhập
            </Link>
          </GlassCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AmbientMesh />
      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <span className="mb-3 lqg-text-primary">
            <PolarisStar size={48} withReflection animated glow />
          </span>
          <h1 className="font-body font-bold text-lg tracking-[0.18em] lqg-text-primary">
            POOLANE
          </h1>
          <p className="text-xs tracking-[0.15em] uppercase mt-0.5 lqg-text-tertiary">
            a Pola Project
          </p>
        </div>

        <GlassCard tier="heavy" radius="xl" interactive={false} className="p-6 sm:p-7">
          <div className="mb-5">
            <h2 className="lqg-display text-3xl mb-1">Quên mật khẩu</h2>
            <p className="text-sm lqg-text-secondary">
              Nhập SĐT, lớp sẽ liên hệ giúp bạn lấy lại mật khẩu trong 24h.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium lqg-text-primary">
                Số điện thoại <span className="text-danger">*</span>
              </Label>
              <GlassInput
                id="phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0912 345 678"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hint" className="text-sm font-medium lqg-text-primary">
                Họ tên
                <span className="ml-1 text-xs lqg-text-tertiary font-normal">
                  (giúp lớp xác minh nhanh hơn)
                </span>
              </Label>
              <GlassInput
                id="hint"
                type="text"
                value={hint}
                onChange={e => setHint(e.target.value)}
                maxLength={100}
                placeholder="Nguyễn Văn A"
                disabled={submitting}
              />
            </div>

            {error && (
              <div className="text-sm text-danger bg-danger/10 ring-1 ring-danger/30 rounded-card px-3 py-2.5">
                {error}
              </div>
            )}

            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              disabled={submitting || !phone}
              className="w-full mt-2"
            >
              {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </GlassButton>
          </form>
        </GlassCard>

        <Link
          href="/login"
          className="block text-center text-sm mt-6 lqg-text-secondary hover:lqg-text-primary transition"
        >
          <ArrowLeft className="inline h-3 w-3 mr-1" strokeWidth={2.25} />
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  )
}
