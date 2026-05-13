'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function NewEventForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, date, description: description || undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Lỗi')
        setSubmitting(false)
        return
      }
      router.push('/admin/events')
      router.refresh()
    } catch {
      setError('Không thể kết nối')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-5 space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
          Tên sự kiện <span className="text-red-500">*</span>
        </label>
        <input type="text" required maxLength={200} value={name} onChange={e => setName(e.target.value)}
          placeholder="VD: Tiệc cuối năm Poolane 2026"
          className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg bg-white" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
          Ngày <span className="text-red-500">*</span>
        </label>
        <input type="datetime-local" required value={date} onChange={e => setDate(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg bg-white" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
          Mô tả
        </label>
        <textarea rows={3} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg bg-white" />
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <div className="flex gap-3">
        <button type="submit" disabled={submitting}
          className="flex-1 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50">
          {submitting ? 'Đang tạo...' : 'Tạo sự kiện'}
        </button>
        <Link href="/admin/events" className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-[#1C2B4A]/15 text-[#1C2B4A]/70">
          Huỷ
        </Link>
      </div>
    </form>
  )
}
