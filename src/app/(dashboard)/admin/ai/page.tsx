'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, Brain, RefreshCw, AlertTriangle, TrendingDown } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'

type RiskStudent = {
  studentId: string
  fullName: string
  phone: string | null
  status: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  factors: Array<{ factor: string; weight: number; detail: string }>
  suggestedAction: string
}

type Summary = { total: number; high: number; medium: number; low: number }

export default function AIPage() {
  const [students, setStudents] = useState<RiskStudent[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('high')

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/dropout-risk')
      const data = await res.json()
      if (data.data) {
        setStudents(data.data.students)
        setSummary(data.data.summary)
      }
    } catch { toast.error('Không thể tải dữ liệu') }
    finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData() }, [])

  const filtered = students.filter(s => filter === 'all' ? true : s.riskLevel === filter)

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="bg-ink text-paper px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-mist/15 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-4xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
              <Brain className="h-3 w-3 text-accent" strokeWidth={1.75} /> Dự báo nguy cơ dropout
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">AI Dự báo</h1>
            <p className="text-sm text-paper/65 mt-2">Phân tích dựa trên: vắng học · học phí · vé bơi · tần suất · tiến độ.</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-pill ring-1 ring-paper/20 hover:bg-paper/5 transition text-sm disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} /> Cập nhật
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-4xl mx-auto space-y-4 relative z-10">
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Tổng theo dõi', value: summary.total, tone: 'ink' },
              { label: 'Nguy cơ cao',  value: summary.high,  tone: 'danger' },
              { label: 'Trung bình',    value: summary.medium, tone: 'warn' },
              { label: 'Ổn định',       value: summary.low,    tone: 'success' },
            ].map(s => (
              <div key={s.label} className="rounded-card-lg bg-white shadow-soft ring-1 ring-ink/8 p-4 text-center">
                <p className="eyebrow text-ink/55 mb-2">{s.label}</p>
                <p className={`font-heading italic text-3xl leading-none ${
                  s.tone === 'danger' ? 'text-danger' :
                  s.tone === 'warn' ? 'text-warn' :
                  s.tone === 'success' ? 'text-success' : 'text-ink'
                }`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'high' as const, label: 'Nguy cơ cao' },
            { value: 'medium' as const, label: 'Trung bình' },
            { value: 'all' as const, label: 'Tất cả' },
          ].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}>
              <Chip asButton active={filter === f.value}>{f.label}</Chip>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={1.75} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-card-xl bg-white shadow-soft ring-1 ring-ink/8 p-12 text-center">
            <TrendingDown className="h-10 w-10 mx-auto mb-3 text-ink/30" strokeWidth={1.5} />
            <p className="font-heading italic text-2xl text-ink mb-1">Trống nhóm này</p>
            <p className="text-sm text-ink/55">Không có học viên nào ở mức rủi ro này.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(s => {
              const ringClass = s.riskLevel === 'high' ? 'ring-danger/30' :
                s.riskLevel === 'medium' ? 'ring-warn/30' : 'ring-ink/8'
              const scoreClass = s.riskScore >= 50 ? 'bg-danger' :
                s.riskScore >= 25 ? 'bg-warn' : 'bg-success'
              return (
                <div key={s.studentId} className={`rounded-card-lg bg-white shadow-soft ring-1 p-5 ${ringClass}`}>
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div>
                      <Link href={`/admin/students/${s.studentId}`} className="text-sm font-medium text-ink hover:text-accent transition">
                        {s.fullName}
                      </Link>
                      <p className="text-xs text-ink/55">{s.phone}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-paper text-sm font-bold px-3 py-1.5 rounded-pill ${scoreClass}`}>
                        {s.riskScore}%
                      </div>
                      <p className="text-xs text-ink/45 mt-1">nguy cơ</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {s.factors.map((f, i) => (
                      <Chip
                        key={i}
                        variant={f.weight >= 30 ? 'danger' : f.weight >= 15 ? 'warn' : 'neutral'}
                        active={f.weight >= 15}
                        title={f.detail}
                      >
                        {f.factor}
                      </Chip>
                    ))}
                  </div>

                  <div className={`flex items-start gap-2 text-sm rounded-card px-3 py-2 ${
                    s.riskLevel === 'high' ? 'bg-danger/8' : 'bg-warn/8'
                  }`}>
                    <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${s.riskLevel === 'high' ? 'text-danger' : 'text-warn'}`} strokeWidth={1.75} />
                    <span className="text-ink/85">{s.suggestedAction}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
