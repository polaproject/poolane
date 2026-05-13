'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Initial {
  occupation: string
  healthNotes: string
  emergencyContactName: string
  emergencyContactPhone: string
}

export function EditSoftForm({ initial }: { initial: Initial }) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
    <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-5 space-y-4">
      <FormRow label="Nghề nghiệp">
        <input
          type="text"
          maxLength={100}
          value={form.occupation}
          onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))}
          className="input-pola"
          placeholder="VD: Kỹ sư phần mềm"
        />
      </FormRow>

      <FormRow label="Ghi chú sức khoẻ">
        <textarea
          maxLength={500}
          rows={3}
          value={form.healthNotes}
          onChange={e => setForm(f => ({ ...f, healthNotes: e.target.value }))}
          className="input-pola"
          placeholder="Tình trạng sức khoẻ, dị ứng, hoặc lưu ý đặc biệt..."
        />
      </FormRow>

      <FormRow label="Liên hệ khẩn — Tên">
        <input
          type="text"
          maxLength={100}
          value={form.emergencyContactName}
          onChange={e => setForm(f => ({ ...f, emergencyContactName: e.target.value }))}
          className="input-pola"
          placeholder="Tên người liên hệ khẩn cấp"
        />
      </FormRow>

      <FormRow label="Liên hệ khẩn — SĐT">
        <input
          type="tel"
          maxLength={20}
          value={form.emergencyContactPhone}
          onChange={e => setForm(f => ({ ...f, emergencyContactPhone: e.target.value }))}
          className="input-pola"
          placeholder="VD: 0901234567"
        />
      </FormRow>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Đã cập nhật. Đang chuyển về trang hồ sơ...
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#1C2B4A]/90 disabled:opacity-50"
        >
          {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
        <Link
          href="/student/profile"
          className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-[#1C2B4A]/15 text-[#1C2B4A]/70 hover:bg-[#1C2B4A]/5"
        >
          Huỷ
        </Link>
      </div>

      <style jsx>{`
        .input-pola {
          width: 100%;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: #1C2B4A;
          background: #fff;
          border: 1px solid rgba(28, 43, 74, 0.15);
          border-radius: 0.5rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-pola:focus {
          border-color: rgba(28, 43, 74, 0.4);
          box-shadow: 0 0 0 3px rgba(28, 43, 74, 0.1);
        }
      `}</style>
    </form>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
