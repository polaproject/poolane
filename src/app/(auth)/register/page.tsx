'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { PolarisStar } from '@/components/brand/PolarisStar'
import { GlassCard, GlassButton, GlassInput, AmbientMesh } from '@/components/ui/glass'
import { DateInput } from '@/components/forms/DateInput'
import { VnAddressSelect } from '@/components/forms/VnAddressSelect'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

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
    province: '',
    photoConsent: false,
    termsAcknowledged: false,
  })
  // Track UI-only state cho address dropdown
  const [provinceCode, setProvinceCode] = useState<number | null>(null)
  const [wardCode, setWardCode] = useState<number | null>(null)
  const [emailFocused, setEmailFocused] = useState(false)
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
            <PolarisStar size={48} animated />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Ngày sinh" required error={fieldErrors.dob}>
                <DateInput
                  value={form.dob}
                  onChange={iso => update('dob', iso)}
                />
              </Field>
              <Field label="Giới tính" required error={fieldErrors.gender}>
                <select
                  value={form.gender}
                  onChange={e => update('gender', e.target.value as 'male' | 'female' | 'other')}
                  className="lqg-input lqg-input-md w-full"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </Field>
            </div>

            <Field label="Email" required error={fieldErrors.email}>
              {emailFocused && (
                <p className="text-xs lqg-text-secondary -mt-1 mb-1.5 px-1 leading-relaxed">
                  💡 Email dùng để nhận hoá đơn, thông báo đăng ký lớp bơi, lịch học và các cập nhật quan trọng.
                </p>
              )}
              <GlassInput
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="email@example.com"
              />
            </Field>

            {/* Address — đơn vị hành chính mới: Tỉnh + Phường/Xã */}
            <VnAddressSelect
              provinceCode={provinceCode}
              wardCode={wardCode}
              onChange={data => {
                setProvinceCode(data.provinceCode)
                setWardCode(data.wardCode)
                setForm(f => ({ ...f, province: data.province, ward: data.ward }))
                if (fieldErrors.province) setFieldErrors(e => ({ ...e, province: '' }))
              }}
              errorProvince={fieldErrors.province}
              errorWard={fieldErrors.ward}
            />

            {/* Consent */}
            <div className="space-y-2 pt-3 border-t border-foreground/10">
              <label className="flex items-start gap-2 text-xs lqg-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.photoConsent}
                  onChange={e => update('photoConsent', e.target.checked)}
                  className="mt-0.5 accent-[var(--lqg-accent)]"
                />
                <span className="inline-flex items-start gap-1.5 flex-wrap">
                  Tôi đồng ý cho lớp ghi hình kỹ thuật bơi của mình để dạy học.
                  <InfoTooltip label="Vì sao nên đồng ý">
                    <p className="font-semibold mb-1.5 text-foreground">Tại sao bạn nên đồng ý?</p>
                    <p className="mb-1.5">Khi giáo viên có thể quay video kỹ thuật của bạn, bạn sẽ:</p>
                    <ul className="list-disc pl-4 space-y-0.5 mb-2">
                      <li>Xem lại tư thế bơi sai để tự điều chỉnh</li>
                      <li>So sánh tiến bộ qua các buổi học</li>
                      <li>Học nhanh hơn nhờ feedback trực quan</li>
                    </ul>
                    <p className="italic text-foreground/65">Video chỉ dùng nội bộ lớp, không đăng public trừ khi bạn đồng ý riêng.</p>
                  </InfoTooltip>
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
              {fieldErrors.termsAcknowledged && (
                <p className="text-xs text-danger">{fieldErrors.termsAcknowledged}</p>
              )}
            </div>

            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              disabled={submitting || !form.termsAcknowledged}
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
