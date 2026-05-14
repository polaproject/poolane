'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { DIFFICULTY_LABELS } from '@/lib/validations/exercise'

interface ExerciseSummary {
  id: string
  title: string
  skillTarget: string
  difficulty: string
}

export function AssignForm({ studentId, exercises }: { studentId: string; exercises: ExerciseSummary[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [filterDiff, setFilterDiff] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return exercises.filter(e => {
      if (filterDiff && e.difficulty !== filterDiff) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!e.title.toLowerCase().includes(q) && !e.skillTarget.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [exercises, search, filterDiff])

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (selected.size === 0) { setError('Chọn ít nhất 1 bài tập'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/exercise-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          exerciseIds: [...selected],
          dueDate: dueDate || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }
      router.push(`/staff/students/${studentId}`)
      router.refresh()
    } catch {
      setError('Không thể kết nối')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 p-4">
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C2B4A]/40" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên/kỹ năng..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg bg-white" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setFilterDiff('')}
            className={`px-3 py-1.5 text-xs rounded-full border ${!filterDiff ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]' : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15'}`}>
            Tất cả
          </button>
          {Object.entries(DIFFICULTY_LABELS).map(([d, label]) => (
            <button key={d} type="button" onClick={() => setFilterDiff(d)}
              className={`px-3 py-1.5 text-xs rounded-full border ${filterDiff === d ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]' : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden max-h-[400px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#1C2B4A]/40">Không có bài tập phù hợp</p>
        ) : (
          <div className="divide-y divide-[#1C2B4A]/5">
            {filtered.map(ex => (
              <label key={ex.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F6F1EA]/30 cursor-pointer">
                <input type="checkbox" checked={selected.has(ex.id)} onChange={() => toggle(ex.id)} className="w-4 h-4" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#1C2B4A]">{ex.title}</p>
                  <p className="text-xs text-[#5B8E9F]">
                    #{ex.skillTarget} · {DIFFICULTY_LABELS[ex.difficulty as keyof typeof DIFFICULTY_LABELS] ?? ex.difficulty}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Due date */}
      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 p-4">
        <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
          Hạn hoàn thành (tuỳ chọn)
        </label>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg bg-white" />
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={submitting || selected.size === 0}
          className="flex-1 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50">
          {submitting ? 'Đang gán...' : `Gán ${selected.size} bài tập`}
        </button>
        <Link href={`/staff/students/${studentId}`}
          className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-[#1C2B4A]/15 text-[#1C2B4A]/70">
          Huỷ
        </Link>
      </div>
    </form>
  )
}
