'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, ChevronRight, AlertCircle, Save, GraduationCap, Star } from 'lucide-react'
import { COURSE_SKILLS, KEY_SKILLS_FOR_GRADUATION, SCALE_DESCRIPTIONS } from '@/config/constants'
import { Chip } from '@/components/ui/Chip'

const SCORE_TONES = ['', 'bg-danger text-paper', 'bg-warn text-paper', 'bg-mist text-paper', 'bg-accent text-ink', 'bg-success text-paper']

export default function AssessPage() {
  const { studentId } = useParams<{ studentId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const courseId = searchParams.get('courseId') ?? ''
  const courseCode = (searchParams.get('code') ?? 'ECH') as 'ECH' | 'SAI' | 'BUOM'
  const sessionNum = parseInt(searchParams.get('session') ?? '1', 10)
  const mode = (searchParams.get('mode') ?? 'quick') as 'quick' | 'detailed' | 'graduation'
  const studentName = searchParams.get('name') ?? 'Học viên'

  const skills = COURSE_SKILLS[courseCode] ?? COURSE_SKILLS.ECH
  const keySkills = KEY_SKILLS_FOR_GRADUATION[courseCode] ?? []

  const [scores, setScores] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')
  const [metrics, setMetrics] = useState({ meters: '', time25m: '', strokeCount: '' })
  const [prevScores, setPrevScores] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [showMetrics, setShowMetrics] = useState(mode === 'detailed')

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!studentId || !courseId) return
    fetch(`/api/assessments?studentId=${studentId}&courseId=${courseId}&latest=true`)
      .then(r => r.json())
      .then(d => {
        if (d.data?.scores) {
          const prev: Record<string, number> = {}
          d.data.scores.forEach((s: { skillKey: string; score: number }) => { prev[s.skillKey] = s.score })
          setPrevScores(prev)
          setScores({ ...prev })
        }
      })
      .catch(() => {})
  }, [studentId, courseId])

  function setScore(skillKey: string, score: number) { setScores(prev => ({ ...prev, [skillKey]: score })) }

  async function handleSubmit() {
    const scoreEntries = Object.entries(scores).filter(([, v]) => v > 0)
    if (scoreEntries.length < skills.length && mode !== 'quick') {
      toast.error('Vui lòng đánh giá tất cả kỹ năng')
      return
    }
    if (scoreEntries.length === 0) {
      toast.error('Chưa đánh giá kỹ năng nào')
      return
    }
    setLoading(true)
    try {
      const metricsData = []
      if (metrics.meters) metricsData.push({ metricKey: 'continuous_meters', value: parseFloat(metrics.meters), unit: 'm' })
      if (metrics.time25m) metricsData.push({ metricKey: 'time_25m', value: parseFloat(metrics.time25m), unit: 'giây' })
      if (metrics.strokeCount) metricsData.push({ metricKey: 'stroke_count', value: parseFloat(metrics.strokeCount), unit: 'nhịp' })

      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId, courseId, sessionNumber: sessionNum, type: mode,
          notes: notes || undefined,
          scores: scoreEntries.map(([skillKey, score]) => ({ skillKey, score })),
          metrics: metricsData.length > 0 ? metricsData : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { toast.error(data.error?.message ?? 'Có lỗi'); return }
      if (data.data?.isGraduationPass) toast.success('Học viên ĐẠT tốt nghiệp!')
      else if (mode === 'graduation') toast.error('Chưa đạt tiêu chí tốt nghiệp')
      else toast.success('Đã lưu đánh giá')
      router.back()
    } catch { toast.error('Không thể kết nối') }
    finally { setLoading(false) }
  }

  const completedCount = Object.values(scores).filter(v => v > 0).length
  const modeChip = mode === 'quick' ? { variant: 'mist' as const, label: 'Quick' } :
    mode === 'graduation' ? { variant: 'accent' as const, label: 'Tốt nghiệp' } :
    { variant: 'neutral' as const, label: 'Chi tiết' }

  return (
    <div className="min-h-screen bg-paper pb-28">
      <div className="bg-ink text-paper px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-2xl mx-auto">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-paper/65 hover:text-paper transition mb-4 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
            Quay lại
          </button>
          <p className="eyebrow text-paper/55 mb-2">Đánh giá · Buổi {sessionNum} · Khoá {courseCode}</p>
          <h1 className="font-heading text-3xl sm:text-4xl italic leading-tight">{studentName}</h1>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Chip variant={modeChip.variant} active>{modeChip.label}</Chip>
            <Chip variant="neutral">{completedCount}/{skills.length} kỹ năng</Chip>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-2xl mx-auto space-y-3 relative z-10">
        {skills.map(skill => {
          const current = scores[skill.key] ?? 0
          const prev = prevScores[skill.key] ?? 0
          const isKey = keySkills.includes(skill.key as never)
          const isLow = current > 0 && current <= 2
          const changed = current !== prev && prev > 0

          return (
            <div key={skill.key} className={`rounded-card-lg bg-white p-5 shadow-soft ring-1 ${isLow ? 'ring-danger/30' : 'ring-ink/8'}`}>
              <div className="flex justify-between items-center mb-3 gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <p className="font-medium text-ink text-sm">{skill.label}</p>
                  {isKey && <Chip variant="accent" active className="text-[10px]"><Star className="h-2.5 w-2.5" strokeWidth={2.25} /> Quan trọng</Chip>}
                  {isLow && (
                    <span className="text-xs text-danger inline-flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" strokeWidth={2.25} /> Cần cải thiện
                    </span>
                  )}
                </div>
                {prev > 0 && changed && (
                  <span className={`text-xs font-medium shrink-0 ${current > prev ? 'text-success' : current < prev ? 'text-danger' : 'text-ink/40'}`}>
                    {prev} → {current}
                  </span>
                )}
                {prev > 0 && !changed && current > 0 && (
                  <span className="text-xs text-ink/30 shrink-0">={prev}</span>
                )}
              </div>

              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(score => (
                  <button
                    key={score}
                    onClick={() => setScore(skill.key, score)}
                    className={`flex-1 h-12 rounded-card text-lg font-bold transition ${
                      current === score
                        ? SCORE_TONES[score]
                        : 'bg-paper-tint text-ink/40 hover:bg-paper-tint/80'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>

              {current > 0 && (
                <p className="text-xs text-ink/55 mt-2">{SCALE_DESCRIPTIONS[current as keyof typeof SCALE_DESCRIPTIONS]}</p>
              )}
            </div>
          )
        })}

        {/* Metrics */}
        <div className="rounded-card-lg bg-white shadow-soft ring-1 ring-ink/8 overflow-hidden">
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="w-full px-5 py-4 flex justify-between items-center text-sm font-medium text-ink hover:bg-paper-tint/30 transition"
          >
            Chỉ số khách quan (tuỳ chọn)
            <ChevronRight className={`h-4 w-4 transition-transform ${showMetrics ? 'rotate-90' : ''}`} strokeWidth={2} />
          </button>
          {showMetrics && (
            <div className="px-5 pb-5 space-y-3 border-t border-ink/8 pt-4">
              {[
                { key: 'meters', label: 'Mét bơi liên tục', unit: 'm', placeholder: '25' },
                { key: 'time25m', label: 'Thời gian 25m', unit: 'giây', placeholder: '35.5' },
                { key: 'strokeCount', label: 'Nhịp/chiều hồ', unit: 'nhịp', placeholder: '22' },
              ].map(m => (
                <div key={m.key} className="flex items-center gap-3">
                  <label className="text-xs text-ink/55 w-32 shrink-0">{m.label}</label>
                  <input
                    type="number"
                    placeholder={m.placeholder}
                    value={metrics[m.key as keyof typeof metrics]}
                    onChange={e => setMetrics(prev => ({ ...prev, [m.key]: e.target.value }))}
                    className="flex-1 h-10 px-3 text-sm rounded-pill bg-paper-tint/40 ring-1 ring-ink/10 focus:ring-accent/40 focus:outline-none transition"
                  />
                  <span className="text-xs text-ink/45 w-10">{m.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {mode !== 'quick' && (
          <div className="rounded-card-lg bg-white shadow-soft ring-1 ring-ink/8 p-5">
            <p className="eyebrow text-ink/55 mb-2">Ghi chú</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Nhận xét buổi học, điểm cần chú ý..."
              className="w-full text-sm px-3 py-2 rounded-card bg-paper-tint/40 ring-1 ring-ink/10 focus:ring-accent/40 focus:outline-none resize-none transition"
            />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 z-30 p-4 max-w-2xl mx-auto">
        <button
          onClick={handleSubmit}
          disabled={loading || completedCount === 0}
          className={`w-full h-12 rounded-pill font-semibold text-base inline-flex items-center justify-center gap-2 transition shadow-soft disabled:opacity-60 ${
            mode === 'graduation' ? 'bg-accent text-ink hover:bg-accent/90' : 'bg-ink text-paper hover:bg-ink/90'
          }`}
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</>
            : mode === 'graduation'
              ? <><GraduationCap className="h-4 w-4" strokeWidth={2} /> Đánh giá tốt nghiệp ({completedCount}/{skills.length})</>
              : <><Save className="h-4 w-4 text-accent" strokeWidth={2} /> Lưu ({completedCount}/{skills.length})</>
          }
        </button>
      </div>
    </div>
  )
}
