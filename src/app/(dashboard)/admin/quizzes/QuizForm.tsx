'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react'

interface Course { id: string; code: string; name: string }

interface Question {
  questionText: string
  type: 'multiple_choice' | 'true_false' | 'short_answer'
  options: string[]
  correctAnswer: string
  explanation: string
}

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Trắc nghiệm' },
  { value: 'true_false', label: 'Đúng / Sai' },
  { value: 'short_answer', label: 'Trả lời ngắn' },
] as const

export function QuizForm({ courses }: { courses: Course[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [courseId, setCourseId] = useState('')
  const [linkedSkill, setLinkedSkill] = useState('')
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([
    { questionText: '', type: 'multiple_choice', options: ['', ''], correctAnswer: '', explanation: '' }
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addQuestion() {
    setQuestions(q => [...q, { questionText: '', type: 'multiple_choice', options: ['', ''], correctAnswer: '', explanation: '' }])
  }
  function removeQuestion(i: number) {
    if (questions.length <= 1) return
    setQuestions(q => q.filter((_, idx) => idx !== i))
  }
  function moveQuestion(i: number, dir: -1 | 1) {
    setQuestions(q => {
      const next = [...q]
      const target = i + dir
      if (target < 0 || target >= next.length) return q
      ;[next[i], next[target]] = [next[target], next[i]]
      return next
    })
  }
  function updateQuestion(i: number, patch: Partial<Question>) {
    setQuestions(q => q.map((qq, idx) => idx === i ? { ...qq, ...patch } : qq))
  }
  function updateOption(qi: number, oi: number, value: string) {
    setQuestions(q => q.map((qq, idx) =>
      idx === qi ? { ...qq, options: qq.options.map((o, oidx) => oidx === oi ? value : o) } : qq
    ))
  }
  function addOption(qi: number) {
    setQuestions(q => q.map((qq, idx) =>
      idx === qi ? { ...qq, options: [...qq.options, ''] } : qq
    ))
  }
  function removeOption(qi: number, oi: number) {
    setQuestions(q => q.map((qq, idx) =>
      idx === qi && qq.options.length > 2
        ? { ...qq, options: qq.options.filter((_, oidx) => oidx !== oi) }
        : qq
    ))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.questionText.trim()) { setError(`Câu ${i + 1}: chưa có nội dung`); return }
      if (!q.correctAnswer.trim()) { setError(`Câu ${i + 1}: chưa có đáp án đúng`); return }
      if (q.type === 'multiple_choice') {
        const valid = q.options.filter(o => o.trim()).length
        if (valid < 2) { setError(`Câu ${i + 1}: cần ít nhất 2 lựa chọn`); return }
        if (!q.options.some(o => o.trim() === q.correctAnswer.trim())) {
          setError(`Câu ${i + 1}: đáp án đúng phải nằm trong các lựa chọn`); return
        }
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          courseId: courseId || null,
          linkedSkill: linkedSkill || null,
          timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
          isPublished,
          questions: questions.map(q => ({
            questionText: q.questionText,
            type: q.type,
            options: q.type === 'multiple_choice' ? q.options.filter(o => o.trim())
              : q.type === 'true_false' ? ['Đúng', 'Sai']
              : [],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || undefined,
          })),
        })
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }
      router.push('/admin/quizzes')
      router.refresh()
    } catch {
      setError('Không thể kết nối')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Metadata */}
      <div className="glass-card border border-foreground/8 p-5 space-y-4">
        <Field label="Tiêu đề" required>
          <input type="text" required maxLength={200} value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
        </Field>
        <Field label="Mô tả">
          <textarea rows={2} maxLength={1000} value={description} onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Khoá học liên kết">
            <select value={courseId} onChange={e => setCourseId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]">
              <option value="">— Không liên kết —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
            </select>
          </Field>
          <Field label="Kỹ năng gắn">
            <input type="text" maxLength={100} value={linkedSkill} onChange={e => setLinkedSkill(e.target.value)}
              placeholder="VD: breathing"
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
          </Field>
          <Field label="Thời gian (phút)">
            <input type="number" min={1} max={120} value={timeLimitMinutes}
              onChange={e => setTimeLimitMinutes(e.target.value)}
              placeholder="VD: 10"
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
          </Field>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm text-foreground">Đăng ngay (HV có thể làm bài)</span>
        </label>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {questions.map((q, qi) => (
          <div key={qi} className="glass-card border border-foreground/8 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-foreground">Câu {qi + 1}</p>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveQuestion(qi, -1)} disabled={qi === 0}
                  className="p-1 hover:bg-foreground/5 rounded disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => moveQuestion(qi, 1)} disabled={qi === questions.length - 1}
                  className="p-1 hover:bg-foreground/5 rounded disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => removeQuestion(qi)} disabled={questions.length <= 1}
                  className="p-1 hover:bg-danger/10 text-danger rounded disabled:opacity-30"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <Field label="Nội dung câu hỏi" required>
              <textarea rows={2} required value={q.questionText}
                onChange={e => updateQuestion(qi, { questionText: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
            </Field>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Loại câu hỏi">
                <select value={q.type}
                  onChange={e => updateQuestion(qi, {
                    type: e.target.value as Question['type'],
                    options: e.target.value === 'true_false' ? ['Đúng', 'Sai']
                      : e.target.value === 'multiple_choice' ? ['', '']
                      : [],
                    correctAnswer: '',
                  })}
                  className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]">
                  {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
            </div>

            {q.type === 'multiple_choice' && (
              <div className="mt-3">
                <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
                  Các lựa chọn
                </label>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${qi}`}
                        checked={q.correctAnswer === opt && opt !== ''}
                        onChange={() => updateQuestion(qi, { correctAnswer: opt })}
                        className="w-4 h-4" />
                      <input type="text" value={opt}
                        onChange={e => {
                          const newVal = e.target.value
                          updateOption(qi, oi, newVal)
                          if (q.correctAnswer === opt) updateQuestion(qi, { correctAnswer: newVal })
                        }}
                        placeholder={`Lựa chọn ${oi + 1}`}
                        className="flex-1 px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
                      <button type="button" onClick={() => removeOption(qi, oi)} disabled={q.options.length <= 2}
                        className="p-2 hover:bg-danger/10 text-danger rounded disabled:opacity-30">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => addOption(qi)}
                  className="mt-2 text-xs font-semibold text-[#5B8E9F] hover:underline inline-flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Thêm lựa chọn
                </button>
              </div>
            )}

            {q.type === 'true_false' && (
              <Field label="Đáp án đúng">
                <select value={q.correctAnswer}
                  onChange={e => updateQuestion(qi, { correctAnswer: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]">
                  <option value="">— Chọn —</option>
                  <option value="Đúng">Đúng</option>
                  <option value="Sai">Sai</option>
                </select>
              </Field>
            )}

            {q.type === 'short_answer' && (
              <Field label="Đáp án đúng (so sánh không phân biệt hoa thường)">
                <input type="text" required value={q.correctAnswer}
                  onChange={e => updateQuestion(qi, { correctAnswer: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
              </Field>
            )}

            <Field label="Giải thích (hiển thị khi HV trả lời sai)">
              <textarea rows={2} value={q.explanation}
                onChange={e => updateQuestion(qi, { explanation: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
            </Field>
          </div>
        ))}

        <button type="button" onClick={addQuestion}
          className="w-full py-3 border-2 border-dashed border-foreground/20 rounded-card-lg text-sm font-semibold text-foreground/60 hover:border-foreground/40 hover:bg-paper/30 inline-flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Thêm câu hỏi
        </button>
      </div>

      {error && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={submitting}
          className="flex-1 bg-ink-soft text-paper rounded-lg py-3 text-sm font-semibold disabled:opacity-50">
          {submitting ? 'Đang tạo...' : 'Tạo quiz'}
        </button>
        <Link href="/admin/quizzes" className="px-4 py-3 text-sm font-semibold rounded-lg border border-foreground/15 text-foreground/70">
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
