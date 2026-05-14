import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Wallet, TrendingUp, TrendingDown, AlertCircle, QrCode } from 'lucide-react'
import Link from 'next/link'

const TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  course_fee:  { label: 'Học phí',     icon: '📚' },
  pool_ticket: { label: 'Vé bơi',      icon: '🎟️' },
  shop:        { label: 'Shop',        icon: '🛒' },
  refund:      { label: 'Hoàn tiền',   icon: '↩️' },
  adjustment:  { label: 'Điều chỉnh',  icon: '⚙️' },
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
    return <div className="p-6 text-center text-[#1C2B4A]/40">Không tìm thấy hồ sơ</div>
  }

  const [payments, pendingEnrollments] = await Promise.all([
    prisma.payment.findMany({
      where: { studentId: student.id },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    }),
    prisma.enrollment.findMany({
      where: {
        studentId: student.id,
        status: { in: ['active', 'extension'] },
      },
      include: { course: { select: { name: true, code: true, price: true } } },
    }),
  ])

  // Lọc các enrollment còn nợ
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

  // Tính tổng
  const totalIn = payments.filter(p => p.amount > 0).reduce((s, p) => s + p.amount, 0)
  const totalOut = payments.filter(p => p.amount < 0).reduce((s, p) => s + Math.abs(p.amount), 0)
  const net = totalIn - totalOut

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <h1 className="font-heading text-2xl text-[#F6F1EA]">Lịch sử thanh toán</h1>
        <p className="text-[#F6F1EA]/50 text-xs mt-1">{payments.length} giao dịch gần nhất</p>
      </div>

      <div className="px-4 -mt-4 max-w-2xl mx-auto space-y-4">
        {/* Pending debts — top priority */}
        {debtEnrollments.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <h2 className="font-semibold text-amber-900 text-sm">Khoản cần đóng ({debtEnrollments.length})</h2>
            </div>
            <div className="divide-y divide-amber-200">
              {debtEnrollments.map(e => (
                <div key={e.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm text-[#1C2B4A]">📚 {e.courseName}</p>
                      <p className="text-xs text-[#1C2B4A]/60 mt-0.5">
                        Đã đóng {fmt(e.totalPaid)} / {fmt(e.coursePrice)}
                        {e.deadline && (
                          <span className="ml-2 text-red-600">
                            · Hạn {format(e.deadline, 'dd/MM/yyyy', { locale: vi })}
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="font-heading text-xl text-amber-700">{fmt(e.debt)}</p>
                  </div>
                  <Link
                    href={`/student/payments/enrollment/${e.id}/pay`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg text-sm font-semibold hover:bg-[#1C2B4A]/90"
                  >
                    <QrCode className="w-4 h-4" /> Thanh toán qua chuyển khoản
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <SummaryCard label="Đã đóng" value={totalIn} color="text-green-700" icon={<TrendingUp className="w-4 h-4" />} />
          <SummaryCard label="Đã hoàn" value={totalOut} color="text-orange-700" icon={<TrendingDown className="w-4 h-4" />} />
          <SummaryCard label="Tổng net" value={net} color="text-[#1C2B4A]" icon={<Wallet className="w-4 h-4" />} />
        </div>

        {/* Transactions list */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 overflow-hidden">
          {payments.length === 0 ? (
            <div className="p-8 text-center text-[#1C2B4A]/40 text-sm">
              Chưa có giao dịch nào
            </div>
          ) : (
            <div className="divide-y divide-[#1C2B4A]/5">
              {payments.map(p => {
                const cfg = TYPE_CONFIG[p.type] ?? { label: p.type, icon: '💳' }
                const isNegative = p.amount < 0
                return (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1C2B4A]">
                        {cfg.icon} {cfg.label}
                        {p.isReversal && <span className="ml-2 text-xs text-orange-600">(bút toán đảo)</span>}
                      </p>
                      <p className="text-xs text-[#1C2B4A]/50 mt-0.5">
                        {format(p.recordedAt, 'HH:mm dd/MM/yyyy', { locale: vi })} · {METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}
                        {p.referenceNumber && <> · <code className="bg-[#1C2B4A]/8 px-1 rounded">{p.referenceNumber}</code></>}
                      </p>
                      {p.notes && (
                        <p className="text-xs text-[#1C2B4A]/60 mt-1 italic">{p.notes}</p>
                      )}
                    </div>
                    <p className={`font-semibold text-sm ${isNegative ? 'text-orange-700' : 'text-green-700'}`}>
                      {isNegative ? '−' : '+'}{fmt(Math.abs(p.amount))}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-[#1C2B4A]/40 text-center px-4">
          Liên hệ lớp qua Zalo nếu có bất kỳ khoản nào không khớp với thực tế.
        </p>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 p-3">
      <div className={`flex items-center gap-1.5 ${color}`}>
        {icon}
        <p className="text-xs uppercase tracking-wider font-semibold">{label}</p>
      </div>
      <p className={`font-heading text-lg mt-1 ${color}`}>{fmt(value)}</p>
    </div>
  )
}
