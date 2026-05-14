import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  Wallet, TrendingUp, TrendingDown, AlertCircle, QrCode,
  BookOpenText, Ticket, ShoppingBag, Undo2, Settings,
} from 'lucide-react'
import Link from 'next/link'
import { Chip } from '@/components/ui/Chip'
import { StatCard } from '@/components/ui/StatCard'

type IconType = typeof Ticket
const TYPE_CONFIG: Record<string, { label: string; Icon: IconType }> = {
  course_fee:  { label: 'Học phí',    Icon: BookOpenText },
  pool_ticket: { label: 'Vé bơi',     Icon: Ticket },
  shop:        { label: 'Shop',       Icon: ShoppingBag },
  refund:      { label: 'Hoàn tiền',  Icon: Undo2 },
  adjustment:  { label: 'Điều chỉnh', Icon: Settings },
}

const METHOD_LABEL: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  card: 'Thẻ',
  other: 'Khác',
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function StudentPaymentsPage() {
  const user = await requireRole(['student'])

  const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })
  if (!student) {
    return <div className="p-8 text-center text-foreground/55">Không tìm thấy hồ sơ</div>
  }

  const [payments, pendingEnrollments] = await Promise.all([
    prisma.payment.findMany({
      where: { studentId: student.id },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    }),
    prisma.enrollment.findMany({
      where: { studentId: student.id, status: { in: ['active', 'extension'] } },
      include: { course: { select: { name: true, code: true, price: true } } },
    }),
  ])

  const debtEnrollments = pendingEnrollments
    .map(e => ({
      id: e.id,
      courseName: e.course.name,
      courseCode: e.course.code,
      coursePrice: e.course.price,
      totalPaid: e.totalPaid,
      debt: e.course.price - e.totalPaid,
      deadline: e.paymentDeadline,
    }))
    .filter(e => e.debt > 0)

  const totalIn = payments.filter(p => p.amount > 0).reduce((s, p) => s + p.amount, 0)
  const totalOut = payments.filter(p => p.amount < 0).reduce((s, p) => s + Math.abs(p.amount), 0)
  const net = totalIn - totalOut

  return (
    <div className="min-h-screen bg-paper pb-12">
      {/* Hero */}
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-mist/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-3xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2">Tài chính · {payments.length} giao dịch</p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Lịch sử thanh toán</h1>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-3xl mx-auto space-y-5 relative z-10">
        {/* Debt warning — top priority */}
        {debtEnrollments.length > 0 && (
          <div className="rounded-card-lg bg-warn/10 ring-1 ring-warn/30 overflow-hidden backdrop-blur-sm">
            <div className="px-5 py-3 border-b border-warn/30 flex items-center gap-2 bg-warn/5">
              <AlertCircle className="h-4 w-4 text-warn" strokeWidth={2} />
              <h2 className="font-semibold text-sm text-foreground">Khoản cần đóng ({debtEnrollments.length})</h2>
            </div>
            <div className="divide-y divide-warn/20">
              {debtEnrollments.map(e => (
                <div key={e.id} className="px-5 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-heading italic text-xl text-foreground leading-tight">{e.courseName}</p>
                      <p className="text-xs text-foreground/65 mt-1">
                        Đã đóng {fmt(e.totalPaid)} / {fmt(e.coursePrice)}
                      </p>
                      {e.deadline && (
                        <p className="text-xs text-danger mt-1 inline-flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" strokeWidth={2} /> Hạn {format(e.deadline, 'dd/MM/yyyy', { locale: vi })}
                        </p>
                      )}
                    </div>
                    <p className="font-heading italic text-2xl text-warn shrink-0">{fmt(e.debt)}</p>
                  </div>
                  <Link
                    href={`/student/payments/enrollment/${e.id}/pay`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-ink text-paper rounded-pill text-sm font-semibold hover:bg-foreground/90 transition shadow-soft"
                  >
                    <QrCode className="h-4 w-4" strokeWidth={1.75} /> Thanh toán qua chuyển khoản
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Đã đóng" value={fmt(totalIn).replace('đ', '')} unit="đ" icon={TrendingUp} />
          <StatCard label="Đã hoàn" value={fmt(totalOut).replace('đ', '')} unit="đ" icon={TrendingDown} />
          <StatCard label="Tổng net" value={fmt(net).replace('đ', '')} unit="đ" icon={Wallet} tone="dark" />
        </div>

        {/* Transactions */}
        <div className="glass-card glass-card-hover overflow-hidden">
          <div className="px-5 py-4 border-b border-foreground/8 flex items-center justify-between">
            <p className="eyebrow text-foreground/55">Tất cả giao dịch</p>
            <span className="text-xs text-foreground/55">{payments.length} mục</span>
          </div>
          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
              <p className="font-heading italic text-xl text-foreground mb-1">Chưa có giao dịch</p>
              <p className="text-sm text-foreground/55">Khi có thanh toán, sẽ hiện ở đây.</p>
            </div>
          ) : (
            <div className="divide-y divide-foreground/5">
              {payments.map(p => {
                const cfg = TYPE_CONFIG[p.type] ?? { label: p.type, Icon: Wallet }
                const isNegative = p.amount < 0
                return (
                  <div key={p.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`grid place-items-center h-9 w-9 rounded-pill shrink-0 ${
                        isNegative ? 'bg-warn/15 text-warn' : 'bg-success/15 text-success'
                      }`}>
                        <cfg.Icon className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground inline-flex items-center gap-2 flex-wrap">
                          {cfg.label}
                          {p.isReversal && <Chip variant="warn" className="text-[10px]">Bút toán đảo</Chip>}
                        </p>
                        <p className="text-xs text-foreground/55 mt-0.5">
                          {format(p.recordedAt, 'HH:mm · dd/MM/yyyy', { locale: vi })} · {METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}
                        </p>
                        {p.referenceNumber && (
                          <p className="text-[10px] text-foreground/45 mt-0.5 font-mono">{p.referenceNumber}</p>
                        )}
                        {p.notes && (
                          <p className="text-xs text-foreground/65 mt-1 italic">{p.notes}</p>
                        )}
                      </div>
                    </div>
                    <p className={`font-heading text-base shrink-0 ${isNegative ? 'text-warn' : 'text-success'}`}>
                      {isNegative ? '−' : '+'}{fmt(Math.abs(p.amount))}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-foreground/55 text-center px-4">
          Liên hệ lớp qua Zalo nếu có khoản nào không khớp.
        </p>
      </div>
    </div>
  )
}
