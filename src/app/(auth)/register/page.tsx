'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: '', phone: '', password: '', confirmPassword: '',
    dob: '', gender: 'male' as 'male' | 'female' | 'other',
    email: '', ward: '', district: '', province: '',
    photoConsent: false, termsAcknowledged: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(f => ({ ...f, [k]: v }))
    if (fieldErrors[k as string]) {
      setFieldErrors(e => { const { [k as string]: _, ...rest } = e; return rest })
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
    <div className="min-h-screen flex items-center justify-center bg-[#F6F1EA] p-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <svg width="36" height="46" viewBox="0 0 52 68" fill="none" className="mb-2">
            <path d="M26 2 C26 2 28.5 22 29.5 25.5 C33 26.5 50 26 50 26 C50 26 33 26 29.5 27.5 C28.5 31 26 50 26 50 C26 50 23.5 31 22.5 27.5 C19 26 2 26 2 26 C2 26 19 26 22.5 25.5 C23.5 22 26 2 26 2 Z" fill="#1C2B4A"/>
          </svg>
          <h1 className="font-body font-bold text-lg tracking-[0.18em] text-[#1C2B4A]">POOLANE</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-6">
          <h2 className="font-heading text-2xl text-[#1C2B4A] mb-1">Tạo tài khoản</h2>
          <p className="text-sm text-[#1C2B4A]/50 mb-5">Bắt đầu hành trình bơi cùng Poolane 🌊</p>

          <form onSubmit={onSubmit} className="space-y-3">
            <Field label="Họ và tên" required error={fieldErrors.fullName}>
              <input type="text" maxLength={100} value={form.fullName} onChange={e => update('fullName', e.target.value)}
                className="input-pola" placeholder="Nguyễn Văn A" />
            </Field>

            <Field label="Số điện thoại" required error={fieldErrors.phone}>
              <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                className="input-pola" placeholder="0912 345 678" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Mật khẩu" required error={fieldErrors.password}>
                <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
                  className="input-pola" placeholder="≥ 8 ký tự" />
              </Field>
              <Field label="Xác nhận" required error={fieldErrors.confirmPassword}>
                <input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)}
                  className="input-pola" placeholder="Nhập lại" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngày sinh" required error={fieldErrors.dob}>
                <input type="date" value={form.dob} onChange={e => update('dob', e.target.value)} className="input-pola" />
              </Field>
              <Field label="Giới tính" required error={fieldErrors.gender}>
                <select value={form.gender} onChange={e => update('gender', e.target.value as 'male' | 'female' | 'other')} className="input-pola">
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </Field>
            </div>

            <Field label="Email" error={fieldErrors.email}>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                className="input-pola" placeholder="(tuỳ chọn)" />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Phường/Xã" required error={fieldErrors.ward}>
                <input type="text" value={form.ward} onChange={e => update('ward', e.target.value)} className="input-pola" />
              </Field>
              <Field label="Quận/Huyện" required error={fieldErrors.district}>
                <input type="text" value={form.district} onChange={e => update('district', e.target.value)} className="input-pola" />
              </Field>
              <Field label="Tỉnh" required error={fieldErrors.province}>
                <input type="text" value={form.province} onChange={e => update('province', e.target.value)} className="input-pola" />
              </Field>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#1C2B4A]/10">
              <label className="flex items-start gap-2 text-xs text-[#1C2B4A]/70 cursor-pointer">
                <input type="checkbox" checked={form.photoConsent} onChange={e => update('photoConsent', e.target.checked)} className="mt-0.5" />
                <span>Tôi đồng ý cho lớp ghi hình kỹ thuật bơi của mình để dạy học. <span className="text-red-500">*</span></span>
              </label>
              <label className="flex items-start gap-2 text-xs text-[#1C2B4A]/70 cursor-pointer">
                <input type="checkbox" checked={form.termsAcknowledged} onChange={e => update('termsAcknowledged', e.target.checked)} className="mt-0.5" />
                <span>Tôi đã đọc và đồng ý <a href="/privacy" target="_blank" className="text-[#5B8E9F] underline">chính sách bảo mật & điều khoản sử dụng</a>. <span className="text-red-500">*</span></span>
              </label>
              {fieldErrors.photoConsent && <p className="text-xs text-red-600">{fieldErrors.photoConsent}</p>}
              {fieldErrors.termsAcknowledged && <p className="text-xs text-red-600">{fieldErrors.termsAcknowledged}</p>}
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-[#1C2B4A] text-[#F6F1EA] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#1C2B4A]/90 disabled:opacity-50 mt-4">
              {submitting ? <span className="inline-flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-2" />Đang tạo...</span> : 'Tạo tài khoản'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#1C2B4A]/50 mt-4">
          Đã có tài khoản? <Link href="/login" className="text-[#5B8E9F] hover:underline font-semibold">Đăng nhập</Link>
        </p>
      </div>

      <style jsx global>{`
        .input-pola {
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #1C2B4A;
          background: #fff;
          border: 1px solid rgba(28, 43, 74, 0.15);
          border-radius: 0.5rem;
          outline: none;
        }
        .input-pola:focus {
          border-color: rgba(28, 43, 74, 0.4);
          box-shadow: 0 0 0 3px rgba(28, 43, 74, 0.1);
        }
      `}</style>
    </div>
  )
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
