import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, startOfDay } from 'date-fns'
import {
  AlertCircle, DollarSign, TrendingUp, Undo2, Receipt,
  BookOpen, Ticket, ShoppingBag, Settings, ArrowRight, BarChart2,
} from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import { StatCard } from '@/components/ui/StatCard'

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

const TYPE_META: Record<string, { label: string; Icon: typeof BookOpen }> = {
  course_fee: { label: 'Học phí', Icon: BookOpen },
  pool_ticket: { label: 'Vé bơi', Icon: Ticket },
  shop: { label: 'Shop', Icon: ShoppingBag },
  adjustment: { label: 'Điều chỉnh', Icon: Settings },
  refund: { label: 'Hoàn tiền', Icon: Undo2 },
}

export default async function FinancePage() {
  await requireRole(['admin'])

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [monthRevenue, totalDebt, pendingRefunds, recentPayments] = await Promise.all([
    prisma.payment.aggregate({
      where: { recordedAt: { gte: monthStart, lte: monthEnd }, isReversal: false, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    prisma.enrollment.findMany({
      where: { status: { in: ['active', 'extension'] } },
      include: { course: true },
    }).then(enrollments =>
      enrollments.reduce((sum, e) => {
        const remaining = e.course.price - e.totalPaid
        return sum + (remaining > 0 ? remaining : 0)
      }, 0)
    ),
    prisma.refundRequest.count({ where: { status: 'pending' } }),
    prisma.payment.findMany({
      orderBy: { recordedAt: 'desc' },
      take: 10,
      include: { student: { include: { user: { select: { fullName: true } } } } },
    }),
  ])

  const breakdown = await prisma.payment.groupBy({
    by: ['type'],
    where: { recordedAt: { gte: monthStart, lte: monthEnd }, isReversal: false, amount: { gt: 0 } },
    _sum: { amount: true },
  })
  const totalThisMonth = monthRevenue._sum.amount ?? 0
  const todayCount = recentPayments.filter(p => p.recordedAt >= startOfDay(now)).length

  const debtors = await prisma.enrollment.findMany({
    where: { status: { in: ['active', 'extension'] } },
    include: {
      course: { select: { name: true, code: true, price: true } },
      student: { include: { user: { select: { fullName: true, phone: true } } } },
    },
    orderBy: { enrolledAt: 'asc' },
  }).then(list =>
    list
      .map(e => ({ ...e, remaining: e.course.price - e.totalPaid }))
      .filter(e => e.remaining > 0)
      .slice(0, 10)
  )

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-mist/10 translate-y-1/2 blur-3xl" />
        <div className="relative max-w-6xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2">Tháng {format(now, 'MM/yyyy')}</p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Tài chính</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            {pendingRefunds > 0 && (
              <Link
                href="/admin/finance/refunds"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-pill bg-warn/15 text-warn ring-1 ring-warn/30 text-sm font-medium hover:bg-warn/25 transition"
              >
                <AlertCircle className="h-4 w-4" strokeWidth={1.75} /> {pendingRefunds} chờ duyệt
              </Link>
            )}
            <Link
              href="/admin/reports"
              className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2.5 rounded-pill text-sm hover:bg-accent/90 transition shadow-cta"
            >
              <BarChart2 className="h-4 w-4" strokeWidth={2.25} /> Báo cáo
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-6xl mx-auto space-y-5 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Thu tháng này" value={`${(totalThisMonth / 1_000_000).toFixed(1)}M`} unit="đ" icon={TrendingUp} tone="accent" />
          <StatCard label="Tổng nợ" value={`${(totalDebt / 1_000_000).toFixed(1)}M`} unit="đ" icon={DollarSign} tone={totalDebt > 0 ? 'dark' : 'surface'} />
          <StatCard label="Chờ hoàn" value={pendingRefunds} unit="yêu cầu" icon={Undo2} />
          <StatCard label="GD hôm nay" value={todayCount} icon={Receipt} />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Breakdown */}
          <div className="glass-card glass-card-hover p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <p className="eyebrow text-foreground/55">Thu theo loại · tháng này</p>
            </div>
            <div className="space-y-3">
              {breakdown.length === 0 ? (
                <p className="text-sm text-foreground/45">Chưa có giao dịch</p>
              ) : breakdown.map(b => {
                const meta = TYPE_META[b.type] ?? { label: b.type, Icon: DollarSign }
                const amt = b._sum.amount ?? 0
                const pct = totalThisMonth > 0 ? (amt / totalThisMonth) * 100 : 0
                const Icon = meta.Icon
                return (
                  <div key={b.type}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-foreground/75 inline-flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} /> {meta.label}
                      </span>
                      <span className="font-medium text-foreground">{fmt(amt)}</span>
                    </div>
                    <div className="h-1 bg-ink/8 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent payments */}
          <div className="md:col-span-2 glass-card glass-card-hover overflow-hidden">
            <div className="px-5 py-4 border-b border-foreground/8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-accent" strokeWidth={1.75} />
                <p className="eyebrow text-foreground/55">Giao dịch gần đây</p>
              </div>
            </div>
            {recentPayments.length === 0 ? (
              <p className="px-5 py-8 text-sm text-foreground/45 text-center">Chưa có giao dịch</p>
            ) : (
              <div className="divide-y divide-foreground/5">
                {recentPayments.slice(0, 8).map(p => {
                  const meta = TYPE_META[p.type] ?? { label: p.type, Icon: DollarSign }
                  const Icon = meta.Icon
                  const isNeg = p.isReversal || p.amount < 0
                  return (
                    <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`grid place-items-center h-8 w-8 rounded-pill shrink-0 ${isNeg ? 'bg-warn/15 text-warn' : 'bg-success/15 text-success'}`}>
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.student.user.fullName}</p>
                          <p className="text-xs text-foreground/55">
                            {meta.label} · {format(p.recordedAt, 'HH:mm · dd/MM')}
                          </p>
                        </div>
                      </div>
                      <p className={`text-sm font-heading shrink-0 ${isNeg ? 'text-warn' : 'text-success'}`}>
                        {isNeg ? '−' : '+'}{fmt(Math.abs(p.amount))}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Debt list */}
        {debtors.length > 0 && (
          <div className="rounded-card-lg bg-[var(--surface)] shadow-soft ring-1 ring-danger/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-danger/15 bg-danger/5 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-danger" strokeWidth={1.75} />
              <div>
                <p className="eyebrow text-danger">Còn nợ học phí</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{debtors.length} học viên</p>
              </div>
            </div>
            <div className="divide-y divide-foreground/5">
              {debtors.map(e => (
                <div key={e.id} className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-paper-tint/30 transition group">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/students/${e.studentId}`} className="text-sm font-medium text-foreground hover:text-accent transition">
                      {e.student.user.fullName}
                    </Link>
                    <p className="text-xs text-foreground/55 mt-0.5">
                      <Chip variant="mist" className="text-[10px] mr-1">{e.course.code}</Chip>
                      Đã đóng {fmt(e.totalPaid)} / {fmt(e.course.price)}
                      {e.paymentDeadline && (
                        <span className="ml-1 text-danger">· Hạn {format(e.paymentDeadline, 'dd/MM')}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="lqg-headline text-lg text-danger leading-none">{fmt(e.remaining)}</p>
                    <p className="text-xs text-foreground/45 mt-0.5">còn nợ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-3">
          <Link
            href="/admin/finance/refunds"
            className="inline-flex items-center justify-between px-4 py-3 rounded-pill ring-1 ring-foreground/15 text-sm font-medium hover:bg-foreground/5 transition group"
          >
            <span className="inline-flex items-center gap-2"><Undo2 className="h-4 w-4 text-accent" strokeWidth={1.75} /> Hoàn tiền</span>
            <ArrowRight className="h-3.5 w-3.5 text-foreground/30 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.25} />
          </Link>
          <Link
            href="/admin/finance/unmatched"
            className="inline-flex items-center justify-between px-4 py-3 rounded-pill ring-1 ring-foreground/15 text-sm font-medium hover:bg-foreground/5 transition group"
          >
            <span className="inline-flex items-center gap-2"><Receipt className="h-4 w-4 text-accent" strokeWidth={1.75} /> GD chưa khớp</span>
            <ArrowRight className="h-3.5 w-3.5 text-foreground/30 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.25} />
          </Link>
          <Link
            href="/admin/reports"
            className="inline-flex items-center justify-between px-4 py-3 rounded-pill ring-1 ring-foreground/15 text-sm font-medium hover:bg-foreground/5 transition group"
          >
            <span className="inline-flex items-center gap-2"><BarChart2 className="h-4 w-4 text-accent" strokeWidth={1.75} /> Báo cáo</span>
            <ArrowRight className="h-3.5 w-3.5 text-foreground/30 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.25} />
          </Link>
        </div>
      </div>
    </div>
  )
}
