'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

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
    <div className="mt-3 pt-3 border-t border-foreground/5">
      {showNoteField && (
        <textarea
          rows={2}
          maxLength={500}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Ghi chú cho lớp (tuỳ chọn)"
          className="w-full px-3 py-2 text-xs border border-foreground/20 rounded-lg bg-[var(--surface)] mb-2"
        />
      )}
      <div className="flex gap-2">
        <button
          onClick={markComplete}
          disabled={submitting}
          className="flex-1 bg-success text-white rounded-lg py-2 text-xs font-semibold hover:bg-success disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '✓'} Đã làm
        </button>
        {!showNoteField && (
          <button
            onClick={() => setShowNoteField(true)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-foreground/15 text-foreground/70 hover:bg-foreground/5"
          >
            + Ghi chú
          </button>
        )}
        <ConfirmDialog
          trigger={
            <button
              disabled={submitting}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-danger/30 text-danger hover:bg-danger/10 disabled:opacity-50"
            >
              Bỏ qua
            </button>
          }
          title="Bỏ qua bài tập này?"
          description="Bài tập sẽ được đánh dấu là đã bỏ qua. Bạn có thể xem lại sau trong lịch sử."
          confirmLabel="Bỏ qua"
          variant="danger"
          onConfirm={markSkipped}
        />
      </div>
    </div>
  )
}
