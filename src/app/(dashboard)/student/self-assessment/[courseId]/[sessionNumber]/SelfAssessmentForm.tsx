'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SCALE_DESCRIPTIONS } from '@/config/constants'

interface Skill { key: string; label: string }

interface Props {
  courseId: string
  sessionNumber: number
  skills: Skill[]
  initial: { scores: Record<string, number>; notes: string } | null
}

export function SelfAssessmentForm({ courseId, sessionNumber, skills, initial }: Props) {
  const router = useRouter()
  const [scores, setScores] = useState<Record<string, number>>(initial?.scores ?? {})
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allRated = skills.every(s => scores[s.key] != null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!allRated) {
      setError('Vui lòng cho điểm tất cả kỹ năng')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/self-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, sessionNumber, scores, notes: notes.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }
      router.push('/student/self-assessment')
      router.refresh()
    } catch {
      setError('Không thể kết nối tới máy chủ')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
        Cho điểm 1–5 cho mỗi kỹ năng. Hệ thống sẽ so sánh điểm bạn tự cho với điểm giáo viên đánh giá.
      </div>

      {skills.map(skill => (
        <div key={skill.key} className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-4">
          <p className="text-sm font-semibold text-[#1C2B4A] mb-3">{skill.label}</p>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(v => {
              const selected = scores[skill.key] === v
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setScores(s => ({ ...s, [skill.key]: v }))}
                  className={`py-3 rounded-lg text-lg font-bold transition-colors ${
                    selected
                      ? 'bg-[#1C2B4A] text-[#F6F1EA]'
                      : 'bg-white text-[#1C2B4A]/60 border border-[#1C2B4A]/15 hover:border-[#1C2B4A]/40'
                  }`}
                >
                  {v}
                </button>
              )
            })}
          </div>
          {scores[skill.key] != null && (
            <p className="text-xs text-[#1C2B4A]/50 mt-2 italic">
              {scores[skill.key]} — {SCALE_DESCRIPTIONS[scores[skill.key] as 1 | 2 | 3 | 4 | 5]}
            </p>
          )}
        </div>
      ))}

      <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-4">
        <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
          Ghi chú (tuỳ chọn)
        </label>
        <textarea rows={3} maxLength={500} value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Bạn cảm thấy điểm nào tự tin nhất? Điểm nào còn lo?"
          className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 bg-white" />
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={submitting || !allRated}
          className="flex-1 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg py-3 text-sm font-semibold hover:bg-[#1C2B4A]/90 disabled:opacity-50">
          {submitting ? 'Đang lưu...' : 'Gửi đánh giá'}
        </button>
        <Link href="/student/self-assessment" className="px-4 py-3 text-sm font-semibold rounded-lg border border-[#1C2B4A]/15 text-[#1C2B4A]/70 hover:bg-[#1C2B4A]/5">
          Huỷ
        </Link>
      </div>
    </form>
  )
}
