import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { RefundActions } from './RefundActions'

type Params = { params: Promise<{ id: string }> }

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-amber-50 text-amber-700 border-amber-200',
  approved:    'bg-blue-50 text-blue-700 border-blue-200',
  transferred: 'bg-green-50 text-green-700 border-green-200',
  rejected:    'bg-red-50 text-red-700 border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  pending:     'Chờ duyệt',
  approved:    'Đã duyệt — chờ chuyển',
  transferred: 'Đã chuyển',
  rejected:    'Từ chối',
}

const REASON_LABELS: Record<string, string> = {
  work:   'Lý do công việc',
  health: 'Lý do sức khoẻ',
  other:  'Lý do khác',
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function RefundDetailPage({ params }: Params) {
  await requireRole(['admin'])
  const { id } = await params

  const refund = await prisma.refundRequest.findUnique({
    where: { id },
    include: {
      student: {
        include: { user: { select: { fullName: true, phone: true, email: true } } }
      },
      enrollment: { include: { course: { select: { name: true, code: true } } } },
      poolTicket: { select: { totalSessions: true, sessionsUsed: true, pricePaid: true, ticketType: true } },
    }
  })

  if (!refund) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/finance/refunds"
          className="inline-flex items-center gap-1 text-sm text-[#1C2B4A]/70 hover:text-[#1C2B4A]"
        >
          <ArrowLeft className="w-4 h-4" /> Danh sách hoàn tiền
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 shadow-sm mb-4">
        <div className="px-5 py-4 border-b border-[#1C2B4A]/8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl text-[#1C2B4A]">
              {refund.student.user.fullName}
            </h1>
            <p className="text-xs text-[#1C2B4A]/50 mt-0.5">
              {refund.student.studentCode} · {refund.student.user.phone}
            </p>
          </div>
          <span className={`px-3 py-1 text-xs rounded-full border ${STATUS_COLORS[refund.status]}`}>
            {STATUS_LABELS[refund.status]}
          </span>
        </div>

        {/* Breakdown */}
        <div className="p-5 space-y-3">
          {refund.includeCourseRefund && (
            <div className="border border-[#1C2B4A]/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#1C2B4A]">
                  📚 Hoàn học phí {refund.enrollment?.course.code ? `(${refund.enrollment.course.code})` : ''}
                </p>
                <p className="font-semibold text-[#1C2B4A]">{fmt(refund.courseRefundAmount)}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-[#1C2B4A]/60">
                <div>
                  <p className="text-[#1C2B4A]/40 uppercase tracking-wider">Đã học</p>
                  <p className="mt-0.5 text-[#1C2B4A]">{refund.courseSessionsAttended} buổi</p>
                </div>
                <div>
                  <p className="text-[#1C2B4A]/40 uppercase tracking-wider">Tỉ lệ hoàn</p>
                  <p className="mt-0.5 text-[#1C2B4A]">{Math.round(refund.courseRefundRate * 100)}%</p>
                </div>
                <div>
                  <p className="text-[#1C2B4A]/40 uppercase tracking-wider">Khoá</p>
                  <p className="mt-0.5 text-[#1C2B4A] truncate">{refund.enrollment?.course.name ?? '—'}</p>
                </div>
              </div>
            </div>
          )}

          {refund.includeTicketRefund && (
            <div className="border border-[#1C2B4A]/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#1C2B4A]">🎟️ Hoàn vé bơi</p>
                <p className="font-semibold text-[#1C2B4A]">{fmt(refund.ticketRefundAmount)}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-[#1C2B4A]/60">
                <div>
                  <p className="text-[#1C2B4A]/40 uppercase tracking-wider">Đã dùng</p>
                  <p className="mt-0.5 text-[#1C2B4A]">{refund.ticketSessionsUsed} buổi</p>
                </div>
                <div>
                  <p className="text-[#1C2B4A]/40 uppercase tracking-wider">Còn lại</p>
                  <p className="mt-0.5 text-[#1C2B4A]">
                    {Math.max(0, Math.min(refund.poolTicket?.totalSessions ?? 0, 10) - refund.ticketSessionsUsed)} buổi
                  </p>
                </div>
                <div>
                  <p className="text-[#1C2B4A]/40 uppercase tracking-wider">Tỉ lệ</p>
                  <p className="mt-0.5 text-[#1C2B4A]">80%</p>
                </div>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t border-[#1C2B4A]/10 pt-3 flex items-center justify-between">
            <p className="text-sm uppercase tracking-wider text-[#1C2B4A]/50 font-semibold">
              Tổng hoàn
            </p>
            <p className="font-heading text-2xl text-[#1C2B4A]">{fmt(refund.totalRefundAmount)}</p>
          </div>

          {/* Reason */}
          <div className="px-4 py-3 bg-[#F6F1EA]/40 rounded-xl">
            <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/40 mb-1">
              {REASON_LABELS[refund.reason] ?? refund.reason}
            </p>
            {refund.reasonText && (
              <p className="text-sm text-[#1C2B4A]/80">{refund.reasonText}</p>
            )}
          </div>

          <p className="text-xs text-[#1C2B4A]/40">
            Yêu cầu lúc {format(refund.requestedAt, 'HH:mm dd/MM/yyyy', { locale: vi })}
          </p>
        </div>
      </div>

      {/* Actions or processed info */}
      {refund.status === 'pending' && <RefundActions id={refund.id} mode="pending" />}
      {refund.status === 'approved' && <RefundActions id={refund.id} mode="approved" amount={refund.totalRefundAmount} />}

      {(refund.status === 'transferred' || refund.status === 'rejected') && (
        <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 shadow-sm p-5">
          <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/40 mb-1">
            Đã xử lý lúc {refund.processedAt ? format(refund.processedAt, 'HH:mm dd/MM/yyyy', { locale: vi }) : '—'}
          </p>
          {refund.transferReference && (
            <p className="text-sm text-[#1C2B4A] mt-2">
              <span className="text-[#1C2B4A]/50">Mã chuyển khoản:</span>{' '}
              <code className="bg-[#1C2B4A]/8 px-2 py-0.5 rounded">{refund.transferReference}</code>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
