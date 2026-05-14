'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { APPROVAL_REQUIRED_FIELDS, FIELD_LABELS, type ApprovalRequiredField } from '@/config/profile-fields'

type Current = Record<ApprovalRequiredField, string>

const INPUT_TYPES: Partial<Record<ApprovalRequiredField, string>> = {
  dob: 'date',
  phone: 'tel',
  idCardNumber: 'text',
}

export function RequestChangeForm({ current }: { current: Current }) {
  const router = useRouter()
  // Map field → new value (empty string means unchanged)
  const [selected, setSelected] = useState<Set<ApprovalRequiredField>>(new Set())
  const [values, setValues] = useState<Current>(current)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (selected.size === 0) {
      setError('Vui lòng chọn ít nhất 1 trường để yêu cầu cập nhật')
      return
    }

    // Build fieldChanges
    const fieldChanges: Record<string, { old: string | null; new: string }> = {}
    for (const field of selected) {
      const newVal = values[field]?.trim() ?? ''
      if (newVal === current[field]) {
        setError(`Giá trị mới của "${FIELD_LABELS[field]}" giống giá trị hiện tại`)
        return
      }
      if (!newVal) {
        setError(`Vui lòng nhập giá trị mới cho "${FIELD_LABELS[field]}"`)
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
            return (
              <div key={field} className="px-5 py-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleField(field)}
                    className="mt-1 w-4 h-4 rounded border-foreground/30"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{FIELD_LABELS[field]}</p>
                    <p className="text-xs text-foreground/50 mt-0.5 truncate">
                      Hiện tại: {current[field] || <em className="text-foreground/30">chưa có</em>}
                    </p>
                  </div>
                </label>

                {isSelected && (
                  <div className="mt-2 pl-7">
                    <input
                      type={INPUT_TYPES[field] ?? 'text'}
                      value={values[field]}
                      onChange={e => setValues(v => ({ ...v, [field]: e.target.value }))}
                      placeholder={`Giá trị mới của ${FIELD_LABELS[field].toLowerCase()}`}
                      className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 bg-[var(--surface)]"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

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
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 bg-[var(--surface)]"
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
