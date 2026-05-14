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
    <form onSubmit={onSubmit} className="glass-card glass-card-hover p-5 space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
          Tên sự kiện <span className="text-danger">*</span>
        </label>
        <input type="text" required maxLength={200} value={name} onChange={e => setName(e.target.value)}
          placeholder="VD: Tiệc cuối năm Poolane 2026"
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
          Ngày <span className="text-danger">*</span>
        </label>
        <input type="datetime-local" required value={date} onChange={e => setDate(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
          Mô tả
        </label>
        <textarea rows={3} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
      </div>
      {error && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</div>}
      <div className="flex gap-3">
        <button type="submit" disabled={submitting}
          className="flex-1 bg-ink-soft text-paper rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50">
          {submitting ? 'Đang tạo...' : 'Tạo sự kiện'}
        </button>
        <Link href="/admin/events" className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-foreground/15 text-foreground/70">
          Huỷ
        </Link>
      </div>
    </form>
  )
}
