import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Ticket, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { RefundActions } from './RefundActions'
import { Chip } from '@/components/ui/Chip'

type Params = { params: Promise<{ id: string }> }
type Variant = 'neutral' | 'accent' | 'mist' | 'success' | 'warn' | 'danger'

const STATUS: Record<string, { label: string; variant: Variant }> = {
  pending:     { label: 'Chờ duyệt',  variant: 'warn' },
  approved:    { label: 'Chờ chuyển', variant: 'mist' },
  transferred: { label: 'Đã chuyển',  variant: 'success' },
  rejected:    { label: 'Từ chối',    variant: 'danger' },
}

const REASON_LABELS: Record<string, string> = {
  work: 'Lý do công việc',
  health: 'Lý do sức khoẻ',
  other: 'Lý do khác',
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function RefundDetailPage({ params }: Params) {
  await requireRole(['admin'])
  const { id } = await params

  const refund = await prisma.refundRequest.findUnique({
    where: { id },
    include: {
      student: { include: { user: { select: { fullName: true, phone: true, email: true } } } },
      enrollment: { include: { course: { select: { name: true, code: true } } } },
      poolTicket: { select: { totalSessions: true, sessionsUsed: true, pricePaid: true, ticketType: true } },
    },
  })

  if (!refund) notFound()
  const cfg = STATUS[refund.status] ?? STATUS.pending

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-3xl mx-auto">
          <Link
            href="/admin/finance/refunds"
            className="inline-flex items-center gap-1.5 text-sm text-paper/65 hover:text-paper transition mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
            Danh sách hoàn tiền
          </Link>
          <p className="eyebrow text-paper/55 mb-2 font-mono normal-case tracking-[0.2em]">{refund.student.studentCode}</p>
          <h1 className="font-heading text-3xl sm:text-4xl italic leading-tight">{refund.student.user.fullName}</h1>
          <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-paper/65">
            <Chip variant={cfg.variant} active>{cfg.label}</Chip>
            <span>·</span>
            <span>{refund.student.user.phone}</span>
            {refund.student.user.email && (
              <><span>·</span><span>{refund.student.user.email}</span></>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-3xl mx-auto space-y-4 relative z-10">
        {/* Breakdown */}
        <div className="glass-card glass-card-hover p-5 space-y-4">
          {refund.includeCourseRefund && (
            <div className="rounded-card ring-1 ring-foreground/10 bg-paper-tint/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-foreground inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-accent" strokeWidth={1.75} />
                  Hoàn học phí {refund.enrollment?.course.code && `(${refund.enrollment.course.code})`}
                </p>
                <p className="lqg-headline text-xl text-foreground">{fmt(refund.courseRefundAmount)}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="eyebrow text-foreground/45">Đã học</p>
                  <p className="text-foreground mt-1 text-sm">{refund.courseSessionsAttended} buổi</p>
                </div>
                <div>
                  <p className="eyebrow text-foreground/45">Tỉ lệ</p>
                  <p className="text-foreground mt-1 text-sm">{Math.round(refund.courseRefundRate * 100)}%</p>
                </div>
                <div>
                  <p className="eyebrow text-foreground/45">Khoá</p>
                  <p className="text-foreground mt-1 text-sm truncate">{refund.enrollment?.course.name ?? '—'}</p>
                </div>
              </div>
            </div>
          )}

          {refund.includeTicketRefund && (
            <div className="rounded-card ring-1 ring-foreground/10 bg-paper-tint/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-foreground inline-flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-mist" strokeWidth={1.75} />
                  Hoàn vé bơi
                </p>
                <p className="lqg-headline text-xl text-foreground">{fmt(refund.ticketRefundAmount)}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="eyebrow text-foreground/45">Đã dùng</p>
                  <p className="text-foreground mt-1 text-sm">{refund.ticketSessionsUsed} buổi</p>
                </div>
                <div>
                  <p className="eyebrow text-foreground/45">Còn lại</p>
                  <p className="text-foreground mt-1 text-sm">
                    {Math.max(0, Math.min(refund.poolTicket?.totalSessions ?? 0, 10) - refund.ticketSessionsUsed)} buổi
                  </p>
                </div>
                <div>
                  <p className="eyebrow text-foreground/45">Tỉ lệ</p>
                  <p className="text-foreground mt-1 text-sm">80%</p>
                </div>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t border-foreground/8 pt-4 flex items-center justify-between">
            <p className="eyebrow text-foreground/55">Tổng hoàn</p>
            <p className="lqg-headline text-3xl text-warn leading-none">{fmt(refund.totalRefundAmount)}</p>
          </div>

          {/* Reason */}
          <div className="rounded-card bg-mist/8 ring-1 ring-mist/20 px-4 py-3">
            <p className="eyebrow text-mist mb-1">{REASON_LABELS[refund.reason] ?? refund.reason}</p>
            {refund.reasonText && <p className="text-sm text-foreground/80">{refund.reasonText}</p>}
          </div>

          <p className="text-xs text-foreground/45">
            Yêu cầu lúc {format(refund.requestedAt, 'HH:mm · dd/MM/yyyy', { locale: vi })}
          </p>
        </div>

        {/* Actions */}
        {refund.status === 'pending' && (
          <div className="rounded-card-lg bg-[var(--surface)] shadow-soft ring-1 ring-accent/30 p-5">
            <p className="eyebrow text-accent mb-3">Cần xử lý</p>
            <RefundActions id={refund.id} mode="pending" />
          </div>
        )}
        {refund.status === 'approved' && (
          <div className="rounded-card-lg bg-[var(--surface)] shadow-soft ring-1 ring-mist/30 p-5">
            <p className="eyebrow text-mist mb-3">Đã duyệt — chuyển tiền + đánh dấu</p>
            <RefundActions id={refund.id} mode="approved" amount={refund.totalRefundAmount} />
          </div>
        )}

        {(refund.status === 'transferred' || refund.status === 'rejected') && (
          <div className={`rounded-card-lg bg-[var(--surface)] shadow-soft ring-1 p-5 ${
            refund.status === 'transferred' ? 'ring-success/30' : 'ring-danger/30'
          }`}>
            <p className={`eyebrow mb-2 inline-flex items-center gap-1.5 ${
              refund.status === 'transferred' ? 'text-success' : 'text-danger'
            }`}>
              {refund.status === 'transferred' && <CheckCircle2 className="h-3 w-3" strokeWidth={2.25} />}
              Đã xử lý
            </p>
            <p className="text-sm text-foreground/75">
              Lúc {refund.processedAt ? format(refund.processedAt, 'HH:mm · dd/MM/yyyy', { locale: vi }) : '—'}
            </p>
            {refund.transferReference && (
              <p className="text-sm mt-2 inline-flex items-center gap-2">
                <span className="text-foreground/55">Mã chuyển:</span>
                <code className="bg-paper-tint/60 px-2 py-0.5 rounded font-mono text-foreground">{refund.transferReference}</code>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
