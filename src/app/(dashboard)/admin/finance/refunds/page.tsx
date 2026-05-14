import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

type SearchParams = Promise<{ status?: string }>

const STATUS_TABS = [
  { value: 'pending',     label: 'Chờ duyệt' },
  { value: 'approved',    label: 'Đã duyệt — chờ chuyển' },
  { value: 'transferred', label: 'Đã chuyển' },
  { value: 'rejected',    label: 'Từ chối' },
]

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-amber-50 text-amber-700 border-amber-200',
  approved:    'bg-blue-50 text-blue-700 border-blue-200',
  transferred: 'bg-green-50 text-green-700 border-green-200',
  rejected:    'bg-red-50 text-red-700 border-red-200',
}

const REASON_LABELS: Record<string, string> = {
  work:   'Công việc',
  health: 'Sức khoẻ',
  other:  'Khác',
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
      student: {
        select: {
          studentCode: true,
          user: { select: { fullName: true, phone: true } }
        }
      },
      enrollment: { include: { course: { select: { name: true, code: true } } } },
    }
  })

  const totals = await prisma.refundRequest.groupBy({
    by: ['status'],
    _count: { _all: true },
    _sum: { totalRefundAmount: true },
  })
  const totalByStatus = Object.fromEntries(totals.map(t => [t.status, t._count._all]))
  const sumPending = totals.find(t => t.status === 'pending')?._sum.totalRefundAmount ?? 0
  const sumApproved = totals.find(t => t.status === 'approved')?._sum.totalRefundAmount ?? 0

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl text-[#1C2B4A]">Hoàn tiền</h1>
          <p className="text-sm text-[#1C2B4A]/50 mt-1">{items.length} yêu cầu trong tab này</p>
        </div>
        <Link
          href="/admin/finance/refunds/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg text-sm font-semibold hover:bg-[#1C2B4A]/90"
        >
          <Plus className="w-4 h-4" /> Tạo yêu cầu
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <SummaryCard
          label="Tổng cần xử lý"
          count={totalByStatus.pending ?? 0}
          amount={sumPending}
          color="amber"
        />
        <SummaryCard
          label="Tổng cần chuyển"
          count={totalByStatus.approved ?? 0}
          amount={sumApproved}
          color="blue"
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_TABS.map(tab => (
          <Link
            key={tab.value}
            href={`/admin/finance/refunds?status=${tab.value}`}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              status === tab.value
                ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]'
                : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15 hover:border-[#1C2B4A]/40'
            }`}
          >
            {tab.label}
            {totalByStatus[tab.value] != null && totalByStatus[tab.value] > 0 && (
              <span className="ml-2 text-xs opacity-70">({totalByStatus[tab.value]})</span>
            )}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden shadow-sm">
        {items.length === 0 ? (
          <div className="p-12 text-center text-[#1C2B4A]/40 text-sm">
            Không có yêu cầu nào
          </div>
        ) : (
          <div className="overflow-x-auto">

          <table className="w-full min-w-[640px]">
            <thead className="bg-[#F6F1EA]/40">
              <tr className="text-left text-xs uppercase tracking-wider text-[#1C2B4A]/50">
                <th className="px-5 py-3">Học viên</th>
                <th className="px-5 py-3">Khoản hoàn</th>
                <th className="px-5 py-3">Lý do</th>
                <th className="px-5 py-3 text-right">Số tiền</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2B4A]/5">
              {items.map(r => (
                <tr key={r.id} className="hover:bg-[#F6F1EA]/20">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-sm text-[#1C2B4A]">{r.student.user.fullName}</p>
                    <p className="text-xs text-[#1C2B4A]/40 mt-0.5">
                      {r.student.studentCode} · {r.student.user.phone}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <div className="flex flex-col gap-0.5">
                      {r.includeCourseRefund && (
                        <span className="text-xs text-[#1C2B4A]/70">
                          📚 {r.enrollment?.course.code ?? 'Học phí'} · {fmt(r.courseRefundAmount)} ({Math.round(r.courseRefundRate * 100)}%)
                        </span>
                      )}
                      {r.includeTicketRefund && (
                        <span className="text-xs text-[#1C2B4A]/70">
                          🎟️ Vé bơi · {fmt(r.ticketRefundAmount)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-[#1C2B4A]/70">
                    {REASON_LABELS[r.reason] ?? r.reason}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <p className="font-semibold text-sm text-[#1C2B4A]">{fmt(r.totalRefundAmount)}</p>
                    <p className="text-xs text-[#1C2B4A]/40 mt-0.5">
                      {format(r.requestedAt, 'dd/MM HH:mm', { locale: vi })}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${STATUS_COLORS[r.status]}`}>
                      {STATUS_TABS.find(t => t.value === r.status)?.label ?? r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/finance/refunds/${r.id}`}
                      className="text-xs font-semibold text-[#1C2B4A] hover:underline"
                    >
                      Xem →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, count, amount, color }: {
  label: string
  count: number
  amount: number
  color: 'amber' | 'blue'
}) {
  const palette = color === 'amber'
    ? 'border-amber-200 bg-amber-50/40'
    : 'border-blue-200 bg-blue-50/40'
  const labelColor = color === 'amber' ? 'text-amber-700' : 'text-blue-700'

  return (
    <div className={`rounded-2xl border ${palette} p-5`}>
      <p className={`text-xs uppercase tracking-wider font-semibold ${labelColor}`}>{label}</p>
      <p className="font-heading text-3xl text-[#1C2B4A] mt-1">{count}</p>
      <p className="text-sm text-[#1C2B4A]/60 mt-0.5">{fmt(amount)}</p>
    </div>
  )
}
