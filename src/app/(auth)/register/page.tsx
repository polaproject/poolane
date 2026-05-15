'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { PolarisStar } from '@/components/brand/PolarisStar'
import { GlassCard, GlassButton, GlassInput, AmbientMesh } from '@/components/ui/glass'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dob: '',
    gender: 'male' as 'male' | 'female' | 'other',
    email: '',
    ward: '',
    district: '',
    province: '',
    photoConsent: false,
    termsAcknowledged: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(f => ({ ...f, [k]: v }))
    if (fieldErrors[k as string]) {
      setFieldErrors(e => {
        const { [k as string]: _, ...rest } = e
        return rest
      })
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Mật khẩu xác nhận không khớp' })
      return
    }

    setSubmitting(true)
    try {
      const { confirmPassword: _, ...payload } = form
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!res.ok) {
        if (json.error?.details?.fieldErrors) {
          const fe: Record<string, string> = {}
          for (const [k, v] of Object.entries(json.error.details.fieldErrors)) {
            if (Array.isArray(v) && v.length > 0) fe[k] = String(v[0])
          }
          setFieldErrors(fe)
        }
        toast.error(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }

      toast.success(`Tạo tài khoản thành công! Mã: ${json.data.studentCode}`)
      setTimeout(() => router.push('/login'), 1500)
    } catch {
      toast.error('Không thể kết nối tới máy chủ')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10 relative">
      <AmbientMesh />
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <span className="mb-3 lqg-text-primary">
            <PolarisStar size={48} withReflection={false} animated glow={false} />
          </span>
          <h1 className="font-body font-bold text-lg tracking-[0.18em] lqg-text-primary">
            POOLANE
          </h1>
          <p className="text-xs tracking-[0.15em] uppercase mt-0.5 lqg-text-tertiary">
            a Pola Project
          </p>
        </div>

        {/* Register card */}
        <GlassCard tier="heavy" radius="xl" interactive={false} className="p-6 sm:p-7">
          <div className="mb-5">
            <h2 className="lqg-display text-3xl mb-1">Tạo tài khoản</h2>
            <p className="text-sm lqg-text-secondary">
              Bắt đầu hành trình bơi cùng Poolane 🌊
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Họ và tên" required error={fieldErrors.fullName}>
              <GlassInput
                type="text"
                maxLength={100}
                value={form.fullName}
                onChange={e => update('fullName', e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </Field>

            <Field label="Số điện thoại" required error={fieldErrors.phone}>
              <GlassInput
                type="tel"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="0912 345 678"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Mật khẩu" required error={fieldErrors.password}>
                <GlassInput
                  type="password"
                  revealable
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder="≥ 8 ký tự"
                />
              </Field>
              <Field label="Xác nhận" required error={fieldErrors.confirmPassword}>
                <GlassInput
                  type="password"
                  revealable
                  value={form.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)}
                  placeholder="Nhập lại"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngày sinh" required error={fieldErrors.dob}>
                <GlassInput
                  type="date"
                  value={form.dob}
                  onChange={e => update('dob', e.target.value)}
                />
              </Field>
              <Field label="Giới tính" required error={fieldErrors.gender}>
                <select
                  value={form.gender}
                  onChange={e => update('gender', e.target.value as 'male' | 'female' | 'other')}
                  className="lqg-input w-full"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </Field>
            </div>

            <Field label="Email" error={fieldErrors.email}>
              <GlassInput
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="(tuỳ chọn) email@example.com"
              />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Phường/Xã" required error={fieldErrors.ward}>
                <GlassInput
                  type="text"
                  value={form.ward}
                  onChange={e => update('ward', e.target.value)}
                />
              </Field>
              <Field label="Quận/Huyện" required error={fieldErrors.district}>
                <GlassInput
                  type="text"
                  value={form.district}
                  onChange={e => update('district', e.target.value)}
                />
              </Field>
              <Field label="Tỉnh" required error={fieldErrors.province}>
                <GlassInput
                  type="text"
                  value={form.province}
                  onChange={e => update('province', e.target.value)}
                />
              </Field>
            </div>

            {/* Consent */}
            <div className="space-y-2 pt-3 border-t border-foreground/10">
              <label className="flex items-start gap-2 text-xs lqg-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.photoConsent}
                  onChange={e => update('photoConsent', e.target.checked)}
                  className="mt-0.5 accent-[var(--lqg-accent)]"
                />
                <span>
                  Tôi đồng ý cho lớp ghi hình kỹ thuật bơi của mình để dạy học.{' '}
                  <span className="text-danger">*</span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-xs lqg-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.termsAcknowledged}
                  onChange={e => update('termsAcknowledged', e.target.checked)}
                  className="mt-0.5 accent-[var(--lqg-accent)]"
                />
                <span>
                  Tôi đã đọc và đồng ý{' '}
                  <Link href="/privacy" target="_blank" className="lqg-text-accent hover:underline">
                    chính sách bảo mật & điều khoản sử dụng
                  </Link>
                  . <span className="text-danger">*</span>
                </span>
              </label>
              {fieldErrors.photoConsent && (
                <p className="text-xs text-danger">{fieldErrors.photoConsent}</p>
              )}
              {fieldErrors.termsAcknowledged && (
                <p className="text-xs text-danger">{fieldErrors.termsAcknowledged}</p>
              )}
            </div>

            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              disabled={submitting || !form.photoConsent || !form.termsAcknowledged}
              className="w-full mt-3"
            >
              {submitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </GlassButton>
          </form>
        </GlassCard>

        <p className="text-center text-sm mt-6 lqg-text-secondary">
          Đã có tài khoản?{' '}
          <Link href="/login" className="lqg-text-accent hover:underline font-semibold">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────
// Field — Label + children + error helper
// ───────────────────────────────────────────────
function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium lqg-text-primary">
        {label} {required && <span className="text-danger">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
