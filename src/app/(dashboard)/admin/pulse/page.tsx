'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Copy, Check, RefreshCw, Zap, AlertCircle, Bell, Ticket, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Chip } from '@/components/ui/Chip'

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
  summary: { redCount: number; yellowCount: number; lowTicketCount: number; staleProspectsCount: number }
}

type Variant = 'danger' | 'warn' | 'mist' | 'accent'

function StudentCard({ student, variant }: { student: PulseStudent; variant: Variant }) {
  const [copied, setCopied] = useState(false)

  function copyMessage() {
    navigator.clipboard.writeText(student.suggestedMessage)
    setCopied(true)
    toast.success('Đã copy tin nhắn')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`rounded-card-lg bg-white shadow-soft ring-1 p-5 ${
      variant === 'danger' ? 'ring-danger/30' :
      variant === 'warn' ? 'ring-warn/30' :
      variant === 'mist' ? 'ring-mist/30' : 'ring-accent/30'
    }`}>
      <div className="flex justify-between items-start mb-3 gap-3">
        <div>
          <Link href={`/admin/students/${student.id}`} className="text-sm font-medium text-ink hover:text-accent transition">
            {student.fullName}
          </Link>
          <p className="text-xs text-ink/55 mt-0.5">{student.phone}</p>
        </div>
        <div className="text-right space-y-1">
          {student.daysSince !== undefined && (
            <Chip variant={variant === 'danger' ? 'danger' : 'warn'} active className="text-[10px]">
              {student.daysSince}d vắng
            </Chip>
          )}
          {student.sessionsLeft !== null && student.sessionsLeft !== undefined && (
            <Chip variant="mist" active className="text-[10px]">
              Còn {student.sessionsLeft} vé
            </Chip>
          )}
          {student.daysSinceSignup !== undefined && (
            <Chip variant="accent" active className="text-[10px]">
              {student.daysSinceSignup}d chưa follow
            </Chip>
          )}
        </div>
      </div>

      {student.enrollments && student.enrollments.length > 0 && (
        <div className="flex gap-1 mb-3 flex-wrap">
          {student.enrollments.map(e => <Chip key={e.course.code} variant="mist">{e.course.code}</Chip>)}
        </div>
      )}

      <div className="rounded-card bg-paper-tint/40 p-3 text-sm text-ink/80 italic mb-3">
        &ldquo;{student.suggestedMessage}&rdquo;
      </div>

      <button
        onClick={copyMessage}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-pill ring-1 ring-ink/15 text-sm font-medium text-ink hover:bg-ink/5 transition"
      >
        {copied
          ? <><Check className="h-3.5 w-3.5 text-success" strokeWidth={2.25} /> Đã copy</>
          : <><Copy className="h-3.5 w-3.5" strokeWidth={1.75} /> Copy tin nhắn</>}
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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadPulse() }, [])

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={1.75} />
      </div>
    )
  }

  if (!data) return null

  const sections: Array<{ key: keyof PulseData['summary'] | 'red' | 'yellow' | 'lowTicket' | 'staleProspects'; title: string; subtitle: string; students: PulseStudent[]; variant: Variant; Icon: typeof AlertCircle }> = [
    { key: 'red',            title: 'Cần follow-up ngay', subtitle: 'Vắng > 21 ngày',          students: data.red,            variant: 'danger', Icon: AlertCircle },
    { key: 'yellow',         title: 'Nhắc nhở',           subtitle: 'Vắng 14–21 ngày',         students: data.yellow,         variant: 'warn',   Icon: Bell },
    { key: 'lowTicket',      title: 'Sắp hết vé',         subtitle: 'Còn ≤ 2 buổi',            students: data.lowTicket,      variant: 'mist',   Icon: Ticket },
    { key: 'staleProspects', title: 'Tiềm năng chờ tư vấn', subtitle: '> 3 ngày chưa follow-up', students: data.staleProspects, variant: 'accent', Icon: UserPlus },
  ]

  const total = data.summary.redCount + data.summary.yellowCount + data.summary.lowTicketCount + data.summary.staleProspectsCount

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="bg-ink text-paper px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-warn/15 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-3xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-accent" strokeWidth={1.75} /> Pulse Check · tuần này
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">{total} HV cần chú ý</h1>
          </div>
          <button
            onClick={loadPulse}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-pill ring-1 ring-paper/20 hover:bg-paper/5 transition text-sm disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} /> Làm mới
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-3xl mx-auto space-y-6 relative z-10">
        {/* Summary chips */}
        <div className="flex gap-2 flex-wrap">
          <Chip variant="danger" active>{data.summary.redCount} nguy cấp</Chip>
          <Chip variant="warn"   active>{data.summary.yellowCount} nhắc nhở</Chip>
          <Chip variant="mist"   active>{data.summary.lowTicketCount} sắp hết vé</Chip>
          <Chip variant="accent" active>{data.summary.staleProspectsCount} tiềm năng</Chip>
        </div>

        {sections.map(section => {
          if (section.students.length === 0) return null
          const Icon = section.Icon
          return (
            <section key={section.key as string}>
              <header className="flex items-center gap-2 mb-3">
                <Icon className={`h-4 w-4 ${
                  section.variant === 'danger' ? 'text-danger' :
                  section.variant === 'warn' ? 'text-warn' :
                  section.variant === 'mist' ? 'text-mist' : 'text-accent'
                }`} strokeWidth={1.75} />
                <div>
                  <p className={`eyebrow ${
                    section.variant === 'danger' ? 'text-danger' :
                    section.variant === 'warn' ? 'text-warn' :
                    section.variant === 'mist' ? 'text-mist' : 'text-accent'
                  }`}>{section.title}</p>
                  <p className="text-sm font-medium text-ink mt-0.5">{section.subtitle} · {section.students.length} người</p>
                </div>
              </header>
              <div className="space-y-3">
                {section.students.map(student => (
                  <StudentCard key={student.id} student={student} variant={section.variant} />
                ))}
              </div>
            </section>
          )
        })}

        {total === 0 && (
          <div className="rounded-card-xl bg-success/8 ring-1 ring-success/30 p-12 text-center">
            <Check className="h-12 w-12 mx-auto mb-3 text-success" strokeWidth={1.5} />
            <p className="font-heading italic text-2xl text-ink mb-1">Tuần này yên bình</p>
            <p className="text-sm text-ink/65">Không có học viên nào cần follow-up đặc biệt.</p>
          </div>
        )}
      </div>
    </div>
  )
}
