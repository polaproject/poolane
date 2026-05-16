import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Undo2, BookOpen, Ticket, ArrowRight, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Chip } from '@/components/ui/Chip'

type SearchParams = Promise<{ status?: string }>
type Variant = 'neutral' | 'accent' | 'mist' | 'success' | 'warn' | 'danger'

const STATUS_TABS: Array<{ value: string; label: string; variant: Variant }> = [
  { value: 'pending',     label: 'Chờ duyệt',          variant: 'warn' },
  { value: 'approved',    label: 'Chờ chuyển',         variant: 'mist' },
  { value: 'transferred', label: 'Đã chuyển',          variant: 'success' },
  { value: 'rejected',    label: 'Từ chối',            variant: 'danger' },
]

const REASON_LABELS: Record<string, string> = {
  work: 'Công việc',
  health: 'Sức khoẻ',
  other: 'Khác',
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function RefundsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['admin'])

  const params = await searchParams
  const status = params.status ?? 'pending'

  const items = await prisma.refundRequest.findMany({
    where: { status: status as 'pending' | 'approved' | 'transferred' | 'rejected' },
    orderBy: { requestedAt: 'desc' },
    include: {
      student: { select: { studentCode: true, user: { select: { fullName: true, phone: true } } } },
      enrollment: { include: { course: { select: { name: true, code: true } } } },
    },
  })

  const totals = await prisma.refundRequest.groupBy({
    by: ['status'],
    _count: { _all: true },
    _sum: { totalRefundAmount: true },
  })
  const totalByStatus = Object.fromEntries(totals.map(t => [t.status, t._count._all]))
  const sumPending = totals.find(t => t.status === 'pending')?._sum.totalRefundAmount ?? 0
  const sumApproved = totals.find(t => t.status === 'approved')?._sum.totalRefundAmount ?? 0

  const currentTab = STATUS_TABS.find(t => t.value === status) ?? STATUS_TABS[0]

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-6xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2">{items.length} yêu cầu · {currentTab.label.toLowerCase()}</p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Hoàn tiền</h1>
          </div>
          <Link
            href="/admin/finance/refunds/new"
            className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2.5 rounded-pill text-sm hover:bg-accent/90 transition shadow-cta"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Tạo yêu cầu
          </Link>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-6xl mx-auto space-y-4 relative z-10">
        {/* Summary */}
        <div className="grid sm:grid-cols-2 gap-3">
          <SummaryCard
            label="Cần xử lý"
            count={totalByStatus.pending ?? 0}
            amount={sumPending}
            tone="warn"
            icon={AlertCircle}
          />
          <SummaryCard
            label="Cần chuyển"
            count={totalByStatus.approved ?? 0}
            amount={sumApproved}
            tone="mist"
            icon={Undo2}
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(tab => (
            <Link key={tab.value} href={`/admin/finance/refunds?status=${tab.value}`}>
              <Chip active={status === tab.value}>
                {tab.label}
                {totalByStatus[tab.value] != null && totalByStatus[tab.value] > 0 && (
                  <span className="opacity-70">· {totalByStatus[tab.value]}</span>
                )}
              </Chip>
            </Link>
          ))}
        </div>

        {/* Table */}
        <div className="glass-card glass-card-hover overflow-hidden">
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <Undo2 className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
              <p className="lqg-headline text-2xl text-foreground mb-1">Không có yêu cầu</p>
              <p className="text-sm text-foreground/55">Trong tab này chưa có yêu cầu hoàn tiền nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-paper-tint/30 border-b border-foreground/8">
                  <tr>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Học viên</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Khoản hoàn</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Lý do</th>
                    <th className="text-right px-5 py-3 eyebrow text-foreground/55">Số tiền</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(r => {
                    const tabCfg = STATUS_TABS.find(t => t.value === r.status) ?? STATUS_TABS[0]
                    return (
                      <tr key={r.id} className="border-b border-foreground/5 last:border-b-0 hover:bg-paper-tint/20 transition group glass-table-row">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-foreground">{r.student.user.fullName}</p>
                          <p className="text-xs text-foreground/45 font-mono mt-0.5">{r.student.studentCode} · {r.student.user.phone}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-1">
                            {r.includeCourseRefund && (
                              <span className="text-xs text-foreground/70 inline-flex items-center gap-1.5">
                                <BookOpen className="h-3 w-3 text-accent" strokeWidth={1.75} />
                                {r.enrollment?.course.code ?? 'Học phí'} · {fmt(r.courseRefundAmount)} ({Math.round(r.courseRefundRate * 100)}%)
                              </span>
                            )}
                            {r.includeTicketRefund && (
                              <span className="text-xs text-foreground/70 inline-flex items-center gap-1.5">
                                <Ticket className="h-3 w-3 text-mist" strokeWidth={1.75} />
                                Vé bơi · {fmt(r.ticketRefundAmount)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-foreground/70">
                          {REASON_LABELS[r.reason] ?? r.reason}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <p className="lqg-headline text-lg text-foreground leading-none">{fmt(r.totalRefundAmount)}</p>
                          <p className="text-xs text-foreground/45 mt-1">{format(r.requestedAt, 'dd/MM HH:mm', { locale: vi })}</p>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/admin/finance/refunds/${r.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                          >
                            <Chip variant={tabCfg.variant} active className="text-[10px] mr-1">{tabCfg.label}</Chip>
                            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.25} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  label, count, amount, tone, icon: Icon,
}: {
  label: string
  count: number
  amount: number
  tone: 'warn' | 'mist'
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
}) {
  return (
    <div className={`rounded-card-lg p-5 ring-1 backdrop-blur-sm ${
      tone === 'warn' ? 'bg-warn/10 ring-warn/30' : 'bg-mist/10 ring-mist/30'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <p className={`eyebrow ${tone === 'warn' ? 'text-warn' : 'text-mist'}`}>{label}</p>
        <div className={`grid place-items-center h-9 w-9 rounded-pill ${tone === 'warn' ? 'bg-warn/15' : 'bg-mist/15'}`}>
          <Icon className={`h-4 w-4 ${tone === 'warn' ? 'text-warn' : 'text-mist'}`} strokeWidth={1.75} />
        </div>
      </div>
      <p className="lqg-headline text-4xl text-foreground leading-none">{count}</p>
      <p className="text-sm text-foreground/65 mt-2">{fmt(amount)}</p>
    </div>
  )
}
