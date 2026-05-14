import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format, startOfMonth, endOfMonth, startOfDay } from 'date-fns'
import { vi } from 'date-fns/locale'

function fmt(n: number) {
  return n.toLocaleString('vi-VN') + 'đ'
}

export default async function FinancePage() {
  await requireRole(['admin'])

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // Doanh thu tháng này
  const [monthRevenue, totalDebt, pendingRefunds, recentPayments] = await Promise.all([
    // Tổng thu tháng
    prisma.payment.aggregate({
      where: {
        recordedAt: { gte: monthStart, lte: monthEnd },
        isReversal: false,
        amount: { gt: 0 }
      },
      _sum: { amount: true }
    }),

    // Tổng nợ (enrollment chưa đóng đủ)
    prisma.enrollment.findMany({
      where: { status: { in: ['active', 'extension'] } },
      include: { course: true }
    }).then(enrollments => {
      return enrollments.reduce((sum, e) => {
        const remaining = e.course.price - e.totalPaid
        return sum + (remaining > 0 ? remaining : 0)
      }, 0)
    }),

    // Yêu cầu hoàn tiền chờ xử lý
    prisma.refundRequest.count({ where: { status: 'pending' } }),

    // Giao dịch gần đây
    prisma.payment.findMany({
      orderBy: { recordedAt: 'desc' },
      take: 10,
      include: {
        student: { include: { user: { select: { fullName: true } } } }
      }
    })
  ])

  // Breakdown by type
  const breakdown = await prisma.payment.groupBy({
    by: ['type'],
    where: {
      recordedAt: { gte: monthStart, lte: monthEnd },
      isReversal: false,
      amount: { gt: 0 }
    },
    _sum: { amount: true }
  })

  const TYPE_LABELS: Record<string, string> = {
    course_fee: 'Học phí',
    pool_ticket: 'Vé bơi',
    shop: 'Shop',
    adjustment: 'Điều chỉnh',
    refund: 'Hoàn tiền',
  }

  // Students with debt (top 10)
  const debtors = await prisma.enrollment.findMany({
    where: { status: { in: ['active', 'extension'] } },
    include: {
      course: { select: { name: true, code: true, price: true } },
      student: { include: { user: { select: { fullName: true, phone: true } } } }
    },
    orderBy: { enrolledAt: 'asc' }
  }).then(list =>
    list
      .map(e => ({ ...e, remaining: e.course.price - e.totalPaid }))
      .filter(e => e.remaining > 0)
      .slice(0, 10)
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-heading text-3xl text-[#1C2B4A]">Tài chính</h1>
          <p className="text-sm text-[#1C2B4A]/50 mt-1">Tháng {format(now, 'MM/yyyy')}</p>
        </div>
        {pendingRefunds > 0 && (
          <Button asChild variant="outline" className="border-amber-300 text-amber-700">
            <Link href="/admin/finance/refunds">
              ⚠️ {pendingRefunds} yêu cầu hoàn tiền chờ duyệt
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Thu tháng này', value: fmt(monthRevenue._sum.amount ?? 0), color: 'text-green-600' },
          { label: 'Tổng nợ hiện tại', value: fmt(totalDebt), color: totalDebt > 0 ? 'text-red-600' : 'text-[#1C2B4A]' },
          { label: 'Chờ hoàn tiền', value: `${pendingRefunds} yêu cầu`, color: pendingRefunds > 0 ? 'text-amber-600' : 'text-[#1C2B4A]' },
          {
            label: 'Giao dịch hôm nay',
            value: String(recentPayments.filter(p =>
              p.recordedAt >= startOfDay(now)
            ).length),
            color: 'text-[#5B8E9F]'
          },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#1C2B4A]/8 shadow-sm">
            <p className="text-xs text-[#1C2B4A]/40 uppercase tracking-wider mb-2">{s.label}</p>
            <p className={`font-heading text-2xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {/* Breakdown */}
        <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 shadow-sm p-5">
          <h2 className="font-semibold text-[#1C2B4A] text-sm mb-4">Thu theo loại (tháng này)</h2>
          <div className="space-y-3">
            {breakdown.map(b => (
              <div key={b.type} className="flex justify-between items-center">
                <span className="text-sm text-[#1C2B4A]/70">{TYPE_LABELS[b.type] ?? b.type}</span>
                <span className="font-medium text-[#1C2B4A] text-sm">{fmt(b._sum.amount ?? 0)}</span>
              </div>
            ))}
            {breakdown.length === 0 && (
              <p className="text-sm text-[#1C2B4A]/40">Chưa có giao dịch</p>
            )}
          </div>
        </div>

        {/* Recent payments */}
        <div className="col-span-2 bg-white rounded-2xl border border-[#1C2B4A]/8 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1C2B4A]/8">
            <h2 className="font-semibold text-[#1C2B4A] text-sm">Giao dịch gần đây</h2>
          </div>
          <div className="divide-y divide-[#1C2B4A]/5">
            {recentPayments.slice(0, 8).map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1C2B4A]">{p.student.user.fullName}</p>
                  <p className="text-xs text-[#1C2B4A]/50">
                    {TYPE_LABELS[p.type] ?? p.type} · {format(p.recordedAt, 'HH:mm dd/MM')}
                  </p>
                </div>
                <p className={`text-sm font-semibold ${p.isReversal || p.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {p.isReversal ? '-' : '+'}{fmt(Math.abs(p.amount))}
                </p>
              </div>
            ))}
            {recentPayments.length === 0 && (
              <p className="px-5 py-4 text-sm text-[#1C2B4A]/40">Chưa có giao dịch</p>
            )}
          </div>
        </div>
      </div>

      {/* Debt list */}
      {debtors.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-red-100 bg-red-50/50">
            <h2 className="font-semibold text-red-700 text-sm">Học viên còn nợ học phí ({debtors.length})</h2>
          </div>
          <div className="divide-y divide-[#1C2B4A]/5">
            {debtors.map(e => (
              <div key={e.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <Link href={`/admin/students/${e.studentId}`} className="text-sm font-medium text-[#1C2B4A] hover:underline">
                    {e.student.user.fullName}
                  </Link>
                  <p className="text-xs text-[#1C2B4A]/50">
                    {e.course.code} · Đã đóng {fmt(e.totalPaid)} / {fmt(e.course.price)}
                    {e.paymentDeadline && ` · Hạn: ${format(e.paymentDeadline, 'dd/MM')}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600">{fmt(e.remaining)}</p>
                  <p className="text-xs text-[#1C2B4A]/40">còn nợ</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-3">
        <Button asChild variant="outline" className="flex-1">
          <Link href="/admin/finance/refunds">Danh sách hoàn tiền</Link>
        </Button>
      </div>
    </div>
  )
}
