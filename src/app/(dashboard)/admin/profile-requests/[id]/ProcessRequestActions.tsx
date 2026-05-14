'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ProcessRequestActions({ id }: { id: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'rejecting'>('idle')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(action: 'approve' | 'reject') {
    setError(null)
    if (action === 'reject' && notes.trim().length === 0) {
      setError('Vui lòng nhập lý do từ chối')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/profile-change-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: notes.trim() || undefined }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }

      router.push('/admin/profile-requests')
      router.refresh()
    } catch {
      setError('Không thể kết nối tới máy chủ')
      setSubmitting(false)
    }
  }

  if (mode === 'rejecting') {
    return (
      <div className="mt-5 border-t border-foreground/8 pt-5">
        <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
          Lý do từ chối <span className="text-danger">*</span>
        </label>
        <textarea
          rows={3}
          maxLength={500}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Giải thích lý do để học viên hiểu..."
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-[var(--surface)]"
        />
        {error && (
          <p className="text-sm text-danger mt-2">{error}</p>
        )}
        <div className="flex gap-3 mt-3">
          <button
            disabled={submitting}
            onClick={() => submit('reject')}
            className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </button>
          <button
            onClick={() => { setMode('idle'); setError(null) }}
            disabled={submitting}
            className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-foreground/15 text-foreground/70 hover:bg-foreground/5"
          >
            Huỷ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-5 border-t border-foreground/8 pt-5">
      <div className="flex gap-3">
        <button
          disabled={submitting}
          onClick={() => submit('approve')}
          className="flex-1 bg-success text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-success disabled:opacity-50"
        >
          {submitting ? 'Đang duyệt...' : '✓ Duyệt & áp dụng thay đổi'}
        </button>
        <button
          onClick={() => setMode('rejecting')}
          disabled={submitting}
          className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-danger/30 text-danger hover:bg-danger/10"
        >
          Từ chối
        </button>
      </div>
      {error && (
        <p className="text-sm text-danger mt-2">{error}</p>
      )}
    </div>
  )
}
