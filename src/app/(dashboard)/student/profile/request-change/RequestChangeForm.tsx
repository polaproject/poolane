'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { APPROVAL_REQUIRED_FIELDS, FIELD_LABELS, type ApprovalRequiredField } from '@/config/profile-fields'
import { DateInput } from '@/components/forms/DateInput'
import { VnAddressSelect } from '@/components/forms/VnAddressSelect'

type Current = Record<ApprovalRequiredField, string>

// Phone VN format — đồng nhất với register schema
const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/
// CCCD = 12 số, CMND = 9 số
const ID_CARD_REGEX = /^\d{9}$|^\d{12}$/

// Field nào nằm trong group "Địa chỉ" — group hành chính dùng VnAddressSelect
const ADDRESS_FIELDS: ApprovalRequiredField[] = ['ward', 'province']

export function RequestChangeForm({ current }: { current: Current }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<ApprovalRequiredField>>(new Set())
  const [values, setValues] = useState<Current>(current)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  // Address dropdown state — code dùng cho cascading select
  const [provinceCode, setProvinceCode] = useState<number | null>(null)
  const [wardCode, setWardCode] = useState<number | null>(null)

  function toggleField(field: ApprovalRequiredField) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(field)) {
        next.delete(field)
        setValues(v => ({ ...v, [field]: current[field] }))
      } else {
        next.add(field)
      }
      return next
    })
  }

  function setAddressValues(data: { province: string; ward: string; provinceCode: number | null; wardCode: number | null }) {
    setProvinceCode(data.provinceCode)
    setWardCode(data.wardCode)
    setValues(v => ({ ...v, province: data.province, ward: data.ward }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (selected.size === 0) {
      setError('Vui lòng chọn ít nhất 1 trường để yêu cầu cập nhật')
      return
    }

    // Build fieldChanges + validate per-field
    const fieldChanges: Record<string, { old: string | null; new: string }> = {}
    for (const field of selected) {
      const newVal = (values[field] ?? '').trim()
      if (!newVal) {
        setError(`Vui lòng nhập giá trị mới cho "${FIELD_LABELS[field]}"`)
        return
      }
      if (newVal === current[field]) {
        setError(`Giá trị mới của "${FIELD_LABELS[field]}" giống giá trị hiện tại`)
        return
      }

      // Field-specific validation
      if (field === 'dob') {
        // DateInput emit '' if not yet 10 ký tự / không hợp lệ → values['dob'] = '' nếu user gõ dở
        if (!/^\d{4}-\d{2}-\d{2}$/.test(newVal)) {
          setError('Ngày sinh chưa hợp lệ — hãy nhập đủ dd/mm/yyyy')
          return
        }
        const dt = new Date(newVal)
        const age = (Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24 * 365)
        if (age < 5 || age > 100) {
          setError('Ngày sinh phải hợp lý (tuổi 5-100)')
          return
        }
      }

      if (field === 'phone' && !PHONE_REGEX.test(newVal)) {
        setError('Số điện thoại không hợp lệ — phải là số VN (vd 0912345678)')
        return
      }

      if (field === 'idCardNumber' && !ID_CARD_REGEX.test(newVal)) {
        setError('Số CCCD/CMND phải là 9 số (CMND) hoặc 12 số (CCCD)')
        return
      }

      fieldChanges[field] = { old: current[field] || null, new: newVal }
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/profile-change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldChanges, reason: reason.trim() }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/student/profile'), 800)
    } catch {
      setError('Không thể kết nối tới máy chủ')
      setSubmitting(false)
    }
  }

  const inputBase = 'w-full px-3 py-2 text-sm rounded-card bg-paper-tint/30 ring-1 ring-foreground/15 focus:ring-accent/40 focus:outline-none transition'

  // Render input cho từng field theo type — KHÔNG render input cho address fields
  // (xử lý riêng dưới qua VnAddressSelect)
  function renderFieldInput(field: ApprovalRequiredField) {
    if (field === 'dob') {
      return (
        <DateInput
          value={values[field]}
          onChange={iso => setValues(v => ({ ...v, dob: iso }))}
        />
      )
    }
    if (field === 'phone') {
      return (
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={values[field]}
          onChange={e => setValues(v => ({ ...v, phone: e.target.value.replace(/\s/g, '') }))}
          placeholder="0912 345 678"
          className={inputBase}
        />
      )
    }
    if (field === 'idCardNumber') {
      return (
        <input
          type="text"
          inputMode="numeric"
          maxLength={12}
          value={values[field]}
          onChange={e => setValues(v => ({ ...v, idCardNumber: e.target.value.replace(/\D/g, '') }))}
          placeholder="9 số (CMND) hoặc 12 số (CCCD)"
          className={inputBase}
        />
      )
    }
    // Default text input cho fullName, addressStreet, district (legacy)
    return (
      <input
        type="text"
        value={values[field]}
        onChange={e => setValues(v => ({ ...v, [field]: e.target.value }))}
        placeholder={`Giá trị mới của ${FIELD_LABELS[field].toLowerCase()}`}
        className={inputBase}
      />
    )
  }

  // Address fields có address VnAddressSelect, render riêng (province + ward chung)
  const isAnyAddressSelected = ADDRESS_FIELDS.some(f => selected.has(f))

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="glass-card glass-card-hover overflow-hidden">
        <div className="px-5 py-4 border-b border-foreground/8">
          <h2 className="font-semibold text-foreground text-sm">Chọn trường muốn cập nhật</h2>
          <p className="text-xs text-foreground/50 mt-0.5">
            Tick để mở input, nhập giá trị mới bên phải
          </p>
        </div>
        <div className="divide-y divide-foreground/5">
          {APPROVAL_REQUIRED_FIELDS.map(field => {
            const isSelected = selected.has(field)
            const isAddressField = ADDRESS_FIELDS.includes(field)
            return (
              <div key={field} className="px-5 py-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleField(field)}
                    className="mt-1 w-4 h-4 rounded border-foreground/30 accent-[var(--lqg-accent)]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{FIELD_LABELS[field]}</p>
                    <p className="text-xs text-foreground/50 mt-0.5 truncate">
                      Hiện tại: {current[field] || <em className="text-foreground/30">chưa có</em>}
                    </p>
                  </div>
                </label>

                {/* Input — KHÔNG render cho address fields ở đây (handle ở dưới chung 1 chỗ) */}
                {isSelected && !isAddressField && (
                  <div className="mt-2 pl-7">
                    {renderFieldInput(field)}
                  </div>
                )}
                {isSelected && isAddressField && (
                  <p className="mt-2 pl-7 text-xs text-foreground/55 italic">
                    Dùng bộ chọn địa chỉ ở dưới để cập nhật.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Address group — chỉ hiện khi user tick ít nhất 1 address field */}
      {isAnyAddressSelected && (
        <div className="glass-card glass-card-hover p-5 space-y-3">
          <div>
            <h2 className="font-semibold text-foreground text-sm">Bộ chọn địa chỉ (hành chính mới)</h2>
            <p className="text-xs text-foreground/55 mt-0.5">
              Chọn Tỉnh trước, sau đó Phường/Xã. Cả 2 phải có để cập nhật.
            </p>
          </div>
          <VnAddressSelect
            provinceCode={provinceCode}
            wardCode={wardCode}
            onChange={setAddressValues}
          />
        </div>
      )}

      <div className="glass-card glass-card-hover p-5">
        <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
          Lý do (không bắt buộc)
        </label>
        <textarea
          rows={2}
          maxLength={500}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="VD: Tôi vừa chuyển nhà..."
          className={inputBase}
        />
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-success bg-success/10 border border-success/30 rounded-lg px-3 py-2">
          Đã gửi yêu cầu. Đang chuyển về trang hồ sơ...
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || selected.size === 0}
          className="flex-1 bg-ink-soft text-paper rounded-lg py-2.5 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-50"
        >
          {submitting ? 'Đang gửi...' : `Gửi yêu cầu (${selected.size} trường)`}
        </button>
        <Link
          href="/student/profile"
          className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-foreground/15 text-foreground/70 hover:bg-foreground/5"
        >
          Huỷ
        </Link>
      </div>
    </form>
  )
}
