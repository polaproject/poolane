'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface FormData {
  code: string
  description: string
  discountType: string
  discountValue: string
  appliesTo: string
  maxUses: string
  validFrom: string
  validUntil: string
  isActive: boolean
}

interface Props {
  mode: 'create' | 'edit'
  initial?: Partial<FormData> & { id?: string }
}

export function VoucherForm({ mode, initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({
    code: initial?.code ?? '',
    description: initial?.description ?? '',
    discountType: initial?.discountType ?? 'percent',
    discountValue: initial?.discountValue ?? '',
    appliesTo: initial?.appliesTo ?? 'any',
    maxUses: initial?.maxUses ?? '',
    validFrom: initial?.validFrom ?? '',
    validUntil: initial?.validUntil ?? '',
    isActive: initial?.isActive ?? true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = mode === 'create' ? {
        code: form.code.toUpperCase(),
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        appliesTo: form.appliesTo,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        validFrom: form.validFrom || undefined,
        validUntil: form.validUntil || undefined,
        isActive: form.isActive,
      } : {
        description: form.description || undefined,
        discountValue: Number(form.discountValue),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        validFrom: form.validFrom || null,
        validUntil: form.validUntil || null,
        isActive: form.isActive,
      }

      const url = mode === 'create' ? '/api/vouchers' : `/api/vouchers/${initial?.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }
      router.push('/admin/vouchers')
      router.refresh()
    } catch {
      setError('Không thể kết nối')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass-card glass-card-hover p-5 space-y-4">
      <Field label="Mã voucher" required>
        <input type="text" required maxLength={50} value={form.code}
          onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
          disabled={mode === 'edit'}
          placeholder="VD: WELCOME10"
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)] font-mono uppercase disabled:bg-gray-100" />
        {mode === 'edit' && <p className="text-xs text-foreground/40 mt-1">Không đổi được code</p>}
      </Field>

      <Field label="Mô tả">
        <input type="text" maxLength={300} value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="VD: Giảm 10% cho học viên đăng ký mới"
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Loại giảm" required>
          <select value={form.discountType} disabled={mode === 'edit'}
            onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)] disabled:bg-gray-100">
            <option value="percent">Phần trăm (%)</option>
            <option value="fixed">Số tiền cố định</option>
            <option value="free_pool_session">Tặng buổi vé miễn phí</option>
          </select>
        </Field>
        <Field label={form.discountType === 'percent' ? 'Phần trăm giảm' : form.discountType === 'fixed' ? 'Số tiền giảm (VNĐ)' : 'Số buổi tặng'} required>
          <input type="number" required min={0} value={form.discountValue}
            onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
            placeholder={form.discountType === 'percent' ? '10' : form.discountType === 'fixed' ? '50000' : '1'}
            className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
        </Field>
      </div>

      <Field label="Áp dụng cho" required>
        <select value={form.appliesTo} disabled={mode === 'edit'}
          onChange={e => setForm(f => ({ ...f, appliesTo: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)] disabled:bg-gray-100">
          <option value="any">Tất cả</option>
          <option value="course_only">Chỉ khoá học</option>
          <option value="shop_only">Chỉ Shop</option>
        </select>
      </Field>

      <Field label="Số lượt dùng tối đa">
        <input type="number" min={1} value={form.maxUses}
          onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
          placeholder="Bỏ trống = không giới hạn"
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Có hiệu lực từ">
          <input type="date" value={form.validFrom}
            onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
        </Field>
        <Field label="Hết hạn ngày">
          <input type="date" value={form.validUntil}
            onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
        </Field>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isActive}
          onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
          className="w-4 h-4" />
        <span className="text-sm text-foreground">Đang bật (học viên dùng được)</span>
      </label>

      {error && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={submitting}
          className="flex-1 bg-ink-soft text-paper rounded-lg py-2.5 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-50">
          {submitting ? 'Đang lưu...' : (mode === 'create' ? 'Tạo voucher' : 'Lưu thay đổi')}
        </button>
        <Link href="/admin/vouchers" className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-foreground/15 text-foreground/70">
          Huỷ
        </Link>
      </div>
    </form>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
    </div>
  )
}
