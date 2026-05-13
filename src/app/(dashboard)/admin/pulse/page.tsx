'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, Copy, Check, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

type PulseStudent = {
  id: string
  fullName: string
  phone: string | null
  daysSince?: number
  sessionsLeft?: number | null
  daysSinceSignup?: number
  enrollments?: Array<{ course: { name: string; code: string } }>
  suggestedMessage: string
}

type PulseData = {
  generatedAt: string
  red: PulseStudent[]
  yellow: PulseStudent[]
  lowTicket: PulseStudent[]
  staleProspects: PulseStudent[]
  summary: {
    redCount: number
    yellowCount: number
    lowTicketCount: number
    staleProspectsCount: number
  }
}

function StudentCard({ student, color }: { student: PulseStudent; color: string }) {
  const [copied, setCopied] = useState(false)

  function copyMessage() {
    navigator.clipboard.writeText(student.suggestedMessage)
    setCopied(true)
    toast.success('Đã copy tin nhắn!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`bg-white rounded-2xl border p-4 ${
      color === 'red' ? 'border-red-200' :
      color === 'yellow' ? 'border-amber-200' :
      color === 'teal' ? 'border-teal-200' : 'border-[#1C2B4A]/10'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <Link href={`/admin/students/${student.id}`} className="font-semibold text-[#1C2B4A] hover:underline">
            {student.fullName}
          </Link>
          <p className="text-xs text-[#1C2B4A]/50 mt-0.5">{student.phone}</p>
        </div>
        <div className="text-right">
          {student.daysSince !== undefined && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              color === 'red' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {student.daysSince} ngày vắng
            </span>
          )}
          {student.sessionsLeft !== null && student.sessionsLeft !== undefined && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600">
              Còn {student.sessionsLeft} buổi vé
            </span>
          )}
          {student.daysSinceSignup !== undefined && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
              {student.daysSinceSignup} ngày chưa follow
            </span>
          )}
        </div>
      </div>

      {student.enrollments && student.enrollments.length > 0 && (
        <div className="flex gap-1 mb-3">
          {student.enrollments.map(e => (
            <span key={e.course.code} className="text-xs bg-[#1C2B4A]/8 text-[#1C2B4A] px-2 py-0.5 rounded-full">
              {e.course.code}
            </span>
          ))}
        </div>
      )}

      {/* Suggested message */}
      <div className="bg-[#F6F1EA] rounded-xl p-3 text-sm text-[#1C2B4A]/80 italic mb-3">
        "{student.suggestedMessage}"
      </div>

      <button
        onClick={copyMessage}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-[#1C2B4A]/15 text-sm text-[#1C2B4A]/70 hover:bg-[#F6F1EA]/50 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Đã copy!' : 'Copy tin nhắn'}
      </button>
    </div>
  )
}

export default function PulsePage() {
  const [data, setData] = useState<PulseData | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadPulse() {
    setLoading(true)
    try {
      const res = await fetch('/api/pulse')
      const json = await res.json()
      if (json.data) setData(json.data)
    } catch {
      toast.error('Không thể tải Pulse Check')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPulse() }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#1C2B4A]/40" />
      </div>
    )
  }

  if (!data) return null

  const sections = [
    {
      key: 'red',
      title: '🔴 Cần follow-up ngay',
      subtitle: `Vắng > ${21} ngày`,
      students: data.red,
      color: 'red',
    },
    {
      key: 'yellow',
      title: '🟡 Nhắc nhở',
      subtitle: `Vắng 14–21 ngày`,
      students: data.yellow,
      color: 'yellow',
    },
    {
      key: 'lowTicket',
      title: '🟢 Sắp hết vé',
      subtitle: `Còn ≤ 2 buổi`,
      students: data.lowTicket,
      color: 'teal',
    },
    {
      key: 'staleProspects',
      title: '📋 Tiềm năng chờ tư vấn',
      subtitle: `> 3 ngày chưa follow-up`,
      students: data.staleProspects,
      color: 'blue',
    },
  ]

  const total = data.summary.redCount + data.summary.yellowCount +
    data.summary.lowTicketCount + data.summary.staleProspectsCount

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-heading text-3xl text-[#1C2B4A]">Pulse Check</h1>
          <p className="text-sm text-[#1C2B4A]/50 mt-1">
            {total} học viên cần chú ý tuần này
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPulse} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        <span className="px-3 py-1 bg-red-50 text-red-600 text-sm rounded-full font-medium">
          🔴 {data.summary.redCount} nguy cấp
        </span>
        <span className="px-3 py-1 bg-amber-50 text-amber-600 text-sm rounded-full font-medium">
          🟡 {data.summary.yellowCount} nhắc nhở
        </span>
        <span className="px-3 py-1 bg-teal-50 text-teal-600 text-sm rounded-full font-medium">
          🟢 {data.summary.lowTicketCount} sắp hết vé
        </span>
        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full font-medium">
          📋 {data.summary.staleProspectsCount} tiềm năng
        </span>
      </div>

      {/* Sections */}
      {sections.map(section => {
        if (section.students.length === 0) return null
        return (
          <div key={section.key} className="mb-8">
            <div className="flex items-baseline gap-2 mb-3">
              <h2 className="font-semibold text-[#1C2B4A]">{section.title}</h2>
              <span className="text-xs text-[#1C2B4A]/40">{section.subtitle}</span>
              <span className="ml-auto text-xs text-[#1C2B4A]/40">{section.students.length} người</span>
            </div>
            <div className="space-y-3">
              {section.students.map(student => (
                <StudentCard key={student.id} student={student} color={section.color} />
              ))}
            </div>
          </div>
        )
      })}

      {total === 0 && (
        <div className="text-center py-16 text-[#1C2B4A]/40">
          <p className="text-2xl mb-2">🎉</p>
          <p>Tuần này không có học viên nào cần follow-up đặc biệt!</p>
        </div>
      )}
    </div>
  )
}
