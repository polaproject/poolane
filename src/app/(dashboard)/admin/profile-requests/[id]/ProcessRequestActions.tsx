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
      <div className="mt-5 border-t border-[#1C2B4A]/8 pt-5">
        <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
          Lý do từ chối <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          maxLength={500}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Giải thích lý do để học viên hiểu..."
          className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-white"
        />
        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
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
            className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-[#1C2B4A]/15 text-[#1C2B4A]/70 hover:bg-[#1C2B4A]/5"
          >
            Huỷ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-5 border-t border-[#1C2B4A]/8 pt-5">
      <div className="flex gap-3">
        <button
          disabled={submitting}
          onClick={() => submit('approve')}
          className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? 'Đang duyệt...' : '✓ Duyệt & áp dụng thay đổi'}
        </button>
        <button
          onClick={() => setMode('rejecting')}
          disabled={submitting}
          className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
        >
          Từ chối
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  )
}
