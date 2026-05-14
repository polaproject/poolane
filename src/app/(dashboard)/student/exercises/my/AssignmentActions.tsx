'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function AssignmentActions({ id }: { id: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState('')
  const [showNoteField, setShowNoteField] = useState(false)

  async function markComplete() {
    setSubmitting(true)
    try {
      await fetch(`/api/exercise-assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', studentNote: note.trim() || undefined }),
      })
      router.refresh()
    } catch {
      setSubmitting(false)
    }
  }

  async function markSkipped() {
    if (!confirm('Bỏ qua bài tập này?')) return
    setSubmitting(true)
    try {
      await fetch(`/api/exercise-assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'skipped' }),
      })
      router.refresh()
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-[#1C2B4A]/5">
      {showNoteField && (
        <textarea
          rows={2}
          maxLength={500}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Ghi chú cho lớp (tuỳ chọn)"
          className="w-full px-3 py-2 text-xs border border-[#1C2B4A]/20 rounded-lg bg-white mb-2"
        />
      )}
      <div className="flex gap-2">
        <button
          onClick={markComplete}
          disabled={submitting}
          className="flex-1 bg-green-600 text-white rounded-lg py-2 text-xs font-semibold hover:bg-green-700 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '✓'} Đã làm
        </button>
        {!showNoteField && (
          <button
            onClick={() => setShowNoteField(true)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#1C2B4A]/15 text-[#1C2B4A]/70 hover:bg-[#1C2B4A]/5"
          >
            + Ghi chú
          </button>
        )}
        <button
          onClick={markSkipped}
          disabled={submitting}
          className="px-3 py-2 text-xs font-semibold rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Bỏ qua
        </button>
      </div>
    </div>
  )
}
