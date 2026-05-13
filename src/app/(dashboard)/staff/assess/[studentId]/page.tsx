'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Mic, MicOff, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { COURSE_SKILLS, KEY_SKILLS_FOR_GRADUATION, SCALE_DESCRIPTIONS } from '@/config/constants'

type SkillKey = keyof typeof SCALE_DESCRIPTIONS

const SCORE_COLORS = ['', 'bg-red-100 text-red-700', 'bg-orange-100 text-orange-700', 'bg-yellow-100 text-yellow-700', 'bg-teal-100 text-teal-700', 'bg-green-100 text-green-700']

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

  // Scores state: skill_key → score (0 = unset)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')
  const [metrics, setMetrics] = useState({ meters: '', time25m: '', strokeCount: '' })
  const [prevScores, setPrevScores] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showMetrics, setShowMetrics] = useState(mode === 'detailed')

  // Load previous assessment for pre-fill
  useEffect(() => {
    if (!studentId || !courseId) return
    fetch(`/api/assessments?studentId=${studentId}&courseId=${courseId}&latest=true`)
      .then(r => r.json())
      .then(d => {
        if (d.data?.scores) {
          const prev: Record<string, number> = {}
          d.data.scores.forEach((s: { skillKey: string; score: number }) => {
            prev[s.skillKey] = s.score
          })
          setPrevScores(prev)
          // Pre-fill scores
          setScores({ ...prev })
        }
      })
      .catch(() => {})
  }, [studentId, courseId])

  function setScore(skillKey: string, score: number) {
    setScores(prev => ({ ...prev, [skillKey]: score }))
  }

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
          studentId,
          courseId,
          sessionNumber: sessionNum,
          type: mode,
          notes: notes || undefined,
          scores: scoreEntries.map(([skillKey, score]) => ({ skillKey, score })),
          metrics: metricsData.length > 0 ? metricsData : undefined,
        })
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error(data.error?.message ?? 'Có lỗi xảy ra')
        return
      }

      if (data.data?.isGraduationPass) {
        toast.success('🎉 Học viên ĐẠT tốt nghiệp!')
      } else if (mode === 'graduation') {
        toast.error('Học viên chưa đạt tiêu chí tốt nghiệp')
      } else {
        toast.success('Đã lưu đánh giá!')
      }

      router.back()

    } catch { toast.error('Không thể kết nối') }
    finally { setLoading(false) }
  }

  const completedCount = Object.values(scores).filter(v => v > 0).length

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-24">
      {/* Header */}
      <div className="bg-[#1C2B4A] px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="text-[#F6F1EA]/70 hover:text-[#F6F1EA]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[#F6F1EA]/60 text-xs">Đánh giá — Buổi {sessionNum}</p>
            <h1 className="font-heading text-xl text-[#F6F1EA]">{studentName}</h1>
          </div>
          <div className="ml-auto flex gap-2">
            <Badge className={mode === 'quick' ? 'bg-[#5B8E9F]/30 text-[#5B8E9F]' : mode === 'graduation' ? 'bg-[#C8A84B]/30 text-[#C8A84B]' : 'bg-white/20 text-white'}>
              {mode === 'quick' ? 'Quick' : mode === 'graduation' ? 'Tốt nghiệp' : 'Chi tiết'}
            </Badge>
          </div>
        </div>
        <div className="text-xs text-[#F6F1EA]/40">
          {completedCount}/{skills.length} kỹ năng · Khoá {courseCode}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Skills */}
        {skills.map((skill) => {
          const current = scores[skill.key] ?? 0
          const prev = prevScores[skill.key] ?? 0
          const isKey = keySkills.includes(skill.key as never)
          const isLow = current > 0 && current <= 2
          const changed = current !== prev && prev > 0

          return (
            <div key={skill.key} className={`bg-white rounded-2xl p-4 border ${isLow ? 'border-red-200' : 'border-[#1C2B4A]/8'}`}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[#1C2B4A] text-sm">{skill.label}</p>
                  {isKey && <span className="text-xs bg-[#C8A84B]/15 text-[#C8A84B] px-1.5 py-0.5 rounded font-medium">Quan trọng</span>}
                  {isLow && <span className="text-xs text-red-500">⚠️ Cần cải thiện</span>}
                </div>
                {prev > 0 && changed && (
                  <span className={`text-xs ${current > prev ? 'text-green-500' : current < prev ? 'text-red-500' : 'text-[#1C2B4A]/40'}`}>
                    {prev} → {current}
                  </span>
                )}
                {prev > 0 && !changed && current > 0 && (
                  <span className="text-xs text-[#1C2B4A]/30">={prev}</span>
                )}
              </div>

              {/* Score buttons — large for touch */}
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(score => (
                  <button
                    key={score}
                    onClick={() => setScore(skill.key, score)}
                    className={`flex-1 h-12 rounded-xl text-lg font-bold transition-all ${
                      current === score
                        ? SCORE_COLORS[score]
                        : 'bg-[#F6F1EA] text-[#1C2B4A]/40 hover:bg-[#1C2B4A]/10'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>

              {current > 0 && (
                <p className="text-xs text-[#1C2B4A]/50 mt-1.5">{SCALE_DESCRIPTIONS[current as keyof typeof SCALE_DESCRIPTIONS]}</p>
              )}
            </div>
          )
        })}

        {/* Chỉ số khách quan */}
        <div className="bg-white rounded-2xl border border-[#1C2B4A]/8">
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="w-full px-4 py-3.5 flex justify-between items-center text-sm font-medium text-[#1C2B4A]"
          >
            Chỉ số khách quan (tuỳ chọn)
            <ChevronRight className={`w-4 h-4 transition-transform ${showMetrics ? 'rotate-90' : ''}`} />
          </button>

          {showMetrics && (
            <div className="px-4 pb-4 space-y-3">
              {[
                { key: 'meters', label: 'Mét bơi liên tục', unit: 'm', placeholder: 'Ví dụ: 25' },
                { key: 'time25m', label: 'Thời gian 25m', unit: 'giây', placeholder: 'Ví dụ: 35.5' },
                { key: 'strokeCount', label: 'Nhịp/chiều hồ', unit: 'nhịp', placeholder: 'Ví dụ: 22' },
              ].map(m => (
                <div key={m.key} className="flex items-center gap-3">
                  <label className="text-sm text-[#1C2B4A]/70 w-32 flex-shrink-0">{m.label}</label>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="number"
                      placeholder={m.placeholder}
                      value={metrics[m.key as keyof typeof metrics]}
                      onChange={e => setMetrics(prev => ({ ...prev, [m.key]: e.target.value }))}
                      className="flex-1 h-9 px-3 text-sm rounded-lg border border-[#1C2B4A]/15 focus:outline-none"
                    />
                    <span className="text-xs text-[#1C2B4A]/40 w-10">{m.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {mode !== 'quick' && (
          <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[#1C2B4A]">Ghi chú</p>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Nhận xét buổi học, điểm cần chú ý..."
              className="w-full text-sm px-3 py-2 rounded-lg border border-[#1C2B4A]/15 resize-none focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Fixed bottom submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#1C2B4A]/10 p-4 max-w-lg mx-auto">
        <Button
          className={`w-full h-12 text-base font-semibold ${
            mode === 'graduation'
              ? 'bg-[#C8A84B] hover:bg-[#C8A84B]/90 text-white'
              : 'bg-[#1C2B4A] hover:bg-[#1C2B4A]/90 text-[#F6F1EA]'
          }`}
          disabled={loading || completedCount === 0}
          onClick={handleSubmit}
        >
          {loading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</>
            : mode === 'graduation'
              ? `🎓 Đánh giá tốt nghiệp (${completedCount}/${skills.length})`
              : `Lưu đánh giá (${completedCount}/${skills.length})`
          }
        </Button>
      </div>
    </div>
  )
}
