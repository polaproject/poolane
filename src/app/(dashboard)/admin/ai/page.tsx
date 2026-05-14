'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, Brain, RefreshCw, AlertTriangle, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

const RISK_COLORS = {
  high:   'border-red-200 bg-red-50/50',
  medium: 'border-amber-200 bg-amber-50/50',
  low:    'border-[#1C2B4A]/8 bg-white',
}

const SCORE_BG = (score: number) =>
  score >= 50 ? 'bg-red-500' : score >= 25 ? 'bg-amber-500' : 'bg-green-500'

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

  useEffect(() => { loadData() }, [])

  const filtered = students.filter(s =>
    filter === 'all' ? true : s.riskLevel === filter
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-[#5B8E9F]" />
            <h1 className="font-heading text-3xl text-[#1C2B4A]">AI Dự Báo</h1>
          </div>
          <p className="text-sm text-[#1C2B4A]/50">Phân tích nguy cơ bỏ học dựa trên hành vi học viên</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Cập nhật
        </Button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Tổng theo dõi', value: summary.total, color: 'text-[#1C2B4A]' },
            { label: '🔴 Nguy cơ cao', value: summary.high, color: 'text-red-600' },
            { label: '🟡 Trung bình', value: summary.medium, color: 'text-amber-600' },
            { label: '🟢 Ổn định', value: summary.low, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-[#1C2B4A]/8 text-center">
              <p className="text-xs text-[#1C2B4A]/40 mb-1">{s.label}</p>
              <p className={`font-heading text-3xl ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {[
          { value: 'high' as const, label: 'Nguy cơ cao' },
          { value: 'medium' as const, label: 'Trung bình' },
          { value: 'all' as const, label: 'Tất cả' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
              filter === f.value ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]' : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15 hover:border-[#1C2B4A]/40'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#1C2B4A]/40" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[#1C2B4A]/40">
          <TrendingDown className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Không có học viên trong nhóm này</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.studentId} className={`rounded-2xl border p-5 ${RISK_COLORS[s.riskLevel]}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <Link href={`/admin/students/${s.studentId}`} className="font-semibold text-[#1C2B4A] hover:underline">
                    {s.fullName}
                  </Link>
                  <p className="text-xs text-[#1C2B4A]/50">{s.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className={`text-white text-sm font-bold px-2.5 py-1 rounded-lg ${SCORE_BG(s.riskScore)}`}>
                      {s.riskScore}%
                    </div>
                    <p className="text-xs text-[#1C2B4A]/40 mt-0.5">nguy cơ</p>
                  </div>
                </div>
              </div>

              {/* Risk factors */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {s.factors.map((f, i) => (
                  <span key={i} title={f.detail}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      f.weight >= 30 ? 'bg-red-100 text-red-700' : f.weight >= 15 ? 'bg-amber-100 text-amber-700' : 'bg-[#1C2B4A]/8 text-[#1C2B4A]/60'
                    }`}>
                    {f.factor}
                  </span>
                ))}
              </div>

              {/* Suggested action */}
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 ${s.riskLevel === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                <span className={`${s.riskLevel === 'high' ? 'text-red-700' : 'text-amber-700'}`}>
                  {s.suggestedAction}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-[#1C2B4A]/30 text-center mt-6">
        Dự báo dựa trên: vắng học · học phí · vé bơi · tần suất · tiến độ ôn luyện
      </p>
    </div>
  )
}
