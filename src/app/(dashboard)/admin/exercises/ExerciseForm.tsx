'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { DIFFICULTY_LEVELS, DIFFICULTY_LABELS } from '@/lib/validations/exercise'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const COURSE_SKILLS = {
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
  ],
  BUOM: [
    { key: 'undulation', label: 'Sóng người' },
    { key: 'dolphin_kick', label: 'Đạp cá heo' },
    { key: 'rhythm', label: 'Nhịp điệu' },
  ],
}

interface FormData {
  title: string
  description: string
  skillTarget: string
  difficulty: string
  videoUrl: string
  steps: string[]
  isPublished: boolean
}

export function ExerciseForm({ mode, initial }: { mode: 'create' | 'edit'; initial?: Partial<FormData> & { id?: string } }) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    skillTarget: initial?.skillTarget ?? 'body_position',
    difficulty: initial?.difficulty ?? 'beginner',
    videoUrl: initial?.videoUrl ?? '',
    steps: initial?.steps ?? [''],
    isPublished: initial?.isPublished ?? true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateStep(i: number, value: string) {
    setForm(f => ({ ...f, steps: f.steps.map((s, idx) => idx === i ? value : s) }))
  }
  function addStep() {
    setForm(f => ({ ...f, steps: [...f.steps, ''] }))
  }
  function removeStep(i: number) {
    if (form.steps.length <= 1) return
    setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const cleanSteps = form.steps.map(s => s.trim()).filter(s => s.length >= 3)
    if (cleanSteps.length === 0) { setError('Cần ít nhất 1 bước (≥3 ký tự)'); return }

    setSubmitting(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        skillTarget: form.skillTarget,
        difficulty: form.difficulty,
        videoUrl: form.videoUrl || undefined,
        steps: cleanSteps,
        isPublished: form.isPublished,
      }
      const url = mode === 'create' ? '/api/exercises' : `/api/exercises/${initial?.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }
      router.push('/admin/exercises')
      router.refresh()
    } catch {
      setError('Không thể kết nối')
      setSubmitting(false)
    }
  }

  async function onDelete() {
    if (!initial?.id) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/exercises/${initial.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }
      router.push('/admin/exercises')
      router.refresh()
    } catch {
      setError('Không thể kết nối máy chủ')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass-card glass-card-hover p-5 space-y-4">
      <Field label="Tên bài tập" required>
        <input type="text" required maxLength={200} value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="VD: Đạp chân ếch với phao mềm"
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
      </Field>

      <Field label="Mô tả ngắn" required>
        <textarea required rows={3} minLength={10} maxLength={2000} value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Mục đích của bài tập, ai nên tập..."
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Kỹ năng mục tiêu" required>
          <select value={form.skillTarget} onChange={e => setForm(f => ({ ...f, skillTarget: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]">
            <optgroup label="Bơi Ếch">
              {COURSE_SKILLS.ECH.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </optgroup>
            <optgroup label="Bơi Sải">
              {COURSE_SKILLS.SAI.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </optgroup>
            <optgroup label="Bơi Bướm">
              {COURSE_SKILLS.BUOM.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </optgroup>
          </select>
        </Field>
        <Field label="Độ khó" required>
          <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]">
            {DIFFICULTY_LEVELS.map(d => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Video minh hoạ (URL — tuỳ chọn)">
        <input type="url" value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
          placeholder="https://youtube.com/... hoặc Google Drive"
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
      </Field>

      <div>
        <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
          Các bước thực hiện <span className="text-danger">*</span>
        </label>
        <div className="space-y-2">
          {form.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-ink/10 text-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <input type="text" value={step} onChange={e => updateStep(i, e.target.value)}
                placeholder={`Bước ${i + 1}...`}
                className="flex-1 px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
              <button type="button" onClick={() => removeStep(i)} disabled={form.steps.length <= 1}
                className="p-2 hover:bg-danger/10 text-danger rounded disabled:opacity-30">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addStep}
          className="mt-2 text-xs font-semibold text-[#5B8E9F] hover:underline inline-flex items-center gap-1">
          <Plus className="w-3 h-3" /> Thêm bước
        </button>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} className="w-4 h-4" />
        <span className="text-sm text-foreground">Đăng (học viên xem được trong thư viện)</span>
      </label>

      {error && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={submitting}
          className="flex-1 bg-ink-soft text-paper rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50">
          {submitting ? 'Đang lưu...' : (mode === 'create' ? 'Tạo bài tập' : 'Lưu thay đổi')}
        </button>
        {mode === 'edit' && (
          <ConfirmDialog
            trigger={
              <button type="button" disabled={submitting}
                className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-danger/30 text-danger hover:bg-danger/10 disabled:opacity-50">
                Xoá
              </button>
            }
            title="Xoá bài tập này?"
            description="Tất cả assignment liên quan sẽ bị xoá theo. Hành động này không khôi phục được."
            confirmLabel="Xoá bài tập"
            variant="danger"
            onConfirm={onDelete}
          />
        )}
        <Link href="/admin/exercises" className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-foreground/15 text-foreground/70">
          Huỷ
        </Link>
      </div>
    </form>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
    </div>
  )
}
