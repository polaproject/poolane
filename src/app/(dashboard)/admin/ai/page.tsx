'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Loader2,
  Brain,
  RefreshCw,
  TrendingDown,
  Copy,
  Phone,
  MessageCircle,
  Package,
  Target,
  Eye,
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'
import { Chip } from '@/components/ui/Chip'

type Priority = 'critical' | 'high' | 'medium'
type ActionType = 'call' | 'message' | 'offer_pack' | 'assess_skill' | 'follow_up'

interface Recommendation {
  priority: Priority
  action: ActionType
  reason: string
  suggestion: string
  templateMessage: string
}

type RiskStudent = {
  studentId: string
  fullName: string
  phone: string | null
  status: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  factors: Array<{ factor: string; weight: number; detail: string }>
  recommendation: Recommendation
}

type Grouped = Record<Priority, RiskStudent[]>
type Summary = {
  total: number
  critical: number
  high: number
  medium: number
}

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; ringColor: string; bgColor: string; textColor: string; Icon: typeof AlertOctagon }
> = {
  critical: {
    label: 'Cần liên hệ ngay',
    ringColor: 'ring-danger/30',
    bgColor: 'bg-danger/8',
    textColor: 'text-danger',
    Icon: AlertOctagon,
  },
  high: {
    label: 'Action trong tuần',
    ringColor: 'ring-warn/30',
    bgColor: 'bg-warn/8',
    textColor: 'text-warn',
    Icon: AlertTriangle,
  },
  medium: {
    label: 'Theo dõi',
    ringColor: 'ring-foreground/8',
    bgColor: 'bg-foreground/5',
    textColor: 'text-foreground/70',
    Icon: AlertCircle,
  },
}

const ACTION_CONFIG: Record<ActionType, { label: string; Icon: typeof Phone }> = {
  call: { label: 'Gọi điện', Icon: Phone },
  message: { label: 'Nhắn tin', Icon: MessageCircle },
  offer_pack: { label: 'Đề xuất pack', Icon: Package },
  assess_skill: { label: 'Đánh giá lại', Icon: Target },
  follow_up: { label: 'Theo dõi', Icon: Eye },
}

export default function AIPage() {
  const [grouped, setGrouped] = useState<Grouped>({ critical: [], high: [], medium: [] })
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/dropout-risk')
      const data = await res.json()
      if (data.data) {
        setGrouped(data.data.grouped)
        setSummary(data.data.summary)
      }
    } catch {
      toast.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadData()
  }, [])

  async function copyTemplate(message: string, fullName: string) {
    if (!message) {
      toast.error('Không có template cho HV này')
      return
    }
    try {
      await navigator.clipboard.writeText(message)
      toast.success(`Đã copy template cho ${fullName} — paste vào Zalo`)
    } catch {
      toast.error('Trình duyệt không hỗ trợ clipboard')
    }
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Hero */}
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-mist/15 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-4xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
              <Brain className="h-3 w-3 text-accent" strokeWidth={1.75} /> Phân tích nguy cơ dropout
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Hành động cần làm</h1>
            <p className="text-sm text-paper/65 mt-2">
              Mỗi HV có khuyến nghị hành động riêng dựa trên: vắng học · học phí · vé · kỹ năng · ôn luyện.
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-pill ring-1 ring-paper/20 hover:bg-paper/5 transition text-sm disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            Cập nhật
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Tổng theo dõi', value: summary.total, tone: 'ink' },
              { label: 'Cần ngay', value: summary.critical, tone: 'danger' },
              { label: 'Trong tuần', value: summary.high, tone: 'warn' },
              { label: 'Theo dõi', value: summary.medium, tone: 'foreground' },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-card-lg bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-4 text-center"
              >
                <p className="eyebrow text-foreground/55 mb-2">{s.label}</p>
                <p
                  className={`lqg-headline text-3xl leading-none ${
                    s.tone === 'danger'
                      ? 'text-danger'
                      : s.tone === 'warn'
                        ? 'text-warn'
                        : 'text-foreground'
                  }`}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={1.75} />
          </div>
        ) : summary?.total === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <TrendingDown className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">Không có HV nào cần action</p>
            <p className="text-sm text-foreground/55">Tất cả HV đang ổn định.</p>
          </div>
        ) : (
          (['critical', 'high', 'medium'] as Priority[]).map(priority => {
            const students = grouped[priority] ?? []
            if (students.length === 0) return null
            const cfg = PRIORITY_CONFIG[priority]
            const Icon = cfg.Icon

            return (
              <section key={priority}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Icon className={`h-4 w-4 ${cfg.textColor}`} strokeWidth={2} />
                  <h2 className={`lqg-headline text-base ${cfg.textColor}`}>
                    {cfg.label}
                  </h2>
                  <span className="text-xs text-foreground/55 tabular-nums">({students.length})</span>
                </div>

                <div className="space-y-3">
                  {students.map(s => {
                    const actionCfg = ACTION_CONFIG[s.recommendation.action]
                    const ActionIcon = actionCfg.Icon

                    return (
                      <div
                        key={s.studentId}
                        className={`rounded-card-lg bg-[var(--surface)] shadow-soft ring-1 ${cfg.ringColor} p-5`}
                      >
                        {/* Header */}
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div className="min-w-0">
                            <Link
                              href={`/admin/students/${s.studentId}`}
                              className="lqg-headline text-base text-foreground hover:text-accent transition"
                            >
                              {s.fullName}
                            </Link>
                            <p className="text-xs text-foreground/55 tabular-nums">{s.phone ?? '—'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div
                              className={`text-paper text-sm font-bold px-3 py-1.5 rounded-pill ${
                                s.riskScore >= 50 ? 'bg-danger' : s.riskScore >= 25 ? 'bg-warn' : 'bg-success'
                              }`}
                            >
                              {s.riskScore}%
                            </div>
                            <p className="text-[10px] text-foreground/45 mt-1 uppercase tracking-wider">nguy cơ</p>
                          </div>
                        </div>

                        {/* Reason */}
                        <p className="text-sm text-foreground/85 mb-3">
                          <span className="font-semibold">Vì sao:</span> {s.recommendation.reason}
                        </p>

                        {/* Factors chip list */}
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

                        {/* Suggestion */}
                        <div className={`rounded-card px-3 py-2.5 mb-3 ${cfg.bgColor}`}>
                          <div className="flex items-start gap-2">
                            <ActionIcon
                              className={`h-4 w-4 shrink-0 mt-0.5 ${cfg.textColor}`}
                              strokeWidth={1.75}
                            />
                            <div className="flex-1">
                              <p className={`text-xs font-semibold uppercase tracking-wider ${cfg.textColor} mb-0.5`}>
                                {actionCfg.label}
                              </p>
                              <p className="text-sm text-foreground/85 leading-snug">
                                {s.recommendation.suggestion}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 flex-wrap">
                          {s.recommendation.templateMessage && (
                            <button
                              onClick={() => copyTemplate(s.recommendation.templateMessage, s.fullName)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-accent text-ink hover:scale-[1.02] transition"
                            >
                              <Copy className="h-3.5 w-3.5" strokeWidth={2.25} />
                              Copy template
                            </button>
                          )}
                          <Link
                            href={`/admin/students/${s.studentId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full ring-1 ring-foreground/15 text-foreground/75 hover:bg-foreground/5 transition"
                          >
                            Mở hồ sơ
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}
