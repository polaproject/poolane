'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const COURSE_SKILLS: Record<string, Array<{ key: string; label: string }>> = {
  ECH: [
    { key: 'body_position', label: 'Tư thế thân người' },
    { key: 'leg_kick', label: 'Đạp chân ếch' },
    { key: 'arm_pull', label: 'Kéo tay' },
    { key: 'breathing', label: 'Thở' },
    { key: 'glide', label: 'Lướt nước' },
    { key: 'coordination', label: 'Phối hợp' },
    { key: 'turn', label: 'Quay đầu hồ' },
    { key: 'endurance', label: 'Sức bền' },
  ],
  SAI: [
    { key: 'body_rotation', label: 'Xoay hông' },
    { key: 'flutter_kick', label: 'Đập chân' },
    { key: 'high_elbow_catch', label: 'High elbow catch' },
    { key: 'side_breathing', label: 'Thở nghiêng' },
    { key: 'bilateral_breathing', label: 'Thở 2 bên' },
    { key: 'endurance_speed', label: 'Sức bền & tốc độ' },
  ],
  BUOM: [
    { key: 'undulation', label: 'Sóng người' },
    { key: 'dolphin_kick', label: 'Đạp cá heo' },
    { key: 'rhythm', label: 'Nhịp điệu' },
    { key: 'breathing', label: 'Thở' },
  ],
}

interface FormData {
  focusSkills: string[]
  warmupNotes: string
  mainNotes: string
  cooldownNotes: string
  equipment: string
  courseId: string
}

interface Course { id: string; code: string; name: string; count: number }

export function LessonPlanForm({
  sessionId,
  defaultCourseId,
  courses,
  initial,
  previousPlanExists,
}: {
  sessionId: string
  defaultCourseId: string | null
  courses: Course[]
  initial: FormData | null
  previousPlanExists?: boolean
}) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({
    focusSkills: initial?.focusSkills ?? [],
    warmupNotes: initial?.warmupNotes ?? '',
    mainNotes: initial?.mainNotes ?? '',
    cooldownNotes: initial?.cooldownNotes ?? '',
    equipment: initial?.equipment ?? '',
    courseId: initial?.courseId || defaultCourseId || '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleSkill(key: string) {
    setForm(f => ({
      ...f,
      focusSkills: f.focusSkills.includes(key)
        ? f.focusSkills.filter(k => k !== key)
        : f.focusSkills.length >= 5 ? f.focusSkills : [...f.focusSkills, key]
    }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch(`/api/lesson-plans/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focusSkills: form.focusSkills,
          warmupNotes: form.warmupNotes || undefined,
          mainNotes: form.mainNotes || undefined,
          cooldownNotes: form.cooldownNotes || undefined,
          equipment: form.equipment || undefined,
          courseId: form.courseId || undefined,
        })
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }
      router.push(`/admin/schedule/sessions/${sessionId}`)
      router.refresh()
    } catch {
      setError('Không thể kết nối')
      setSubmitting(false)
    }
  }

  // Course code từ courseId
  const selectedCourse = courses.find(c => c.id === form.courseId)
  const skillsForCourse = selectedCourse ? COURSE_SKILLS[selectedCourse.code] ?? [] : []

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {previousPlanExists && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
          💡 Đã tự điền từ kế hoạch buổi trước cùng ca. Bạn có thể chỉnh sửa.
        </div>
      )}

      {courses.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-4">
          <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
            Khoá chính của buổi
          </label>
          <select value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value, focusSkills: [] }))}
            className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg bg-white">
            <option value="">— Chọn khoá —</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code} · {c.name} ({c.count} HV)</option>
            ))}
          </select>
        </div>
      )}

      {skillsForCourse.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-4">
          <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-2">
            Kỹ năng tập trung (tối đa 5)
          </label>
          <div className="flex gap-2 flex-wrap">
            {skillsForCourse.map(s => {
              const active = form.focusSkills.includes(s.key)
              return (
                <button key={s.key} type="button" onClick={() => toggleSkill(s.key)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    active ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]' : 'bg-white text-[#1C2B4A]/70 border-[#1C2B4A]/15 hover:border-[#1C2B4A]/40'
                  }`}>
                  {s.label}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-[#1C2B4A]/40 mt-2">Đã chọn {form.focusSkills.length}/5</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-4 space-y-4">
        <Field label="Khởi động (warmup)">
          <textarea rows={2} maxLength={2000} value={form.warmupNotes}
            onChange={e => setForm(f => ({ ...f, warmupNotes: e.target.value }))}
            placeholder="VD: 5 phút bơi nhẹ + giãn cơ vai"
            className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg bg-white" />
        </Field>

        <Field label="Nội dung chính">
          <textarea rows={4} maxLength={2000} value={form.mainNotes}
            onChange={e => setForm(f => ({ ...f, mainNotes: e.target.value }))}
            placeholder="VD: Tập đạp chân ếch với phao mềm 3 set × 25m, sau đó kết hợp tay-chân-thở"
            className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg bg-white" />
        </Field>

        <Field label="Hồi phục (cooldown)">
          <textarea rows={2} maxLength={2000} value={form.cooldownNotes}
            onChange={e => setForm(f => ({ ...f, cooldownNotes: e.target.value }))}
            placeholder="VD: 3 phút bơi nhẹ + thở sâu"
            className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg bg-white" />
        </Field>

        <Field label="Đạo cụ cần chuẩn bị">
          <input type="text" maxLength={500} value={form.equipment}
            onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))}
            placeholder="VD: 5 phao mềm + 3 phao dài + dây cản"
            className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg bg-white" />
        </Field>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={submitting}
          className="flex-1 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50">
          {submitting ? 'Đang lưu...' : 'Lưu kế hoạch'}
        </button>
        <Link href={`/admin/schedule/sessions/${sessionId}`}
          className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-[#1C2B4A]/15 text-[#1C2B4A]/70">
          Huỷ
        </Link>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
