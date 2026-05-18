import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Chip } from '@/components/ui/Chip'
import { PageHeader } from '@/components/ui/PageHeader'
import { TransactionRowActions } from './TransactionRowActions'

type Params = { params: Promise<{ id: string }> }

function fmt(n: number) {
  const sign = n < 0 ? '-' : ''
  return sign + Math.abs(n).toLocaleString('vi-VN') + 'đ'
}

const TYPE_LABEL: Record<string, string> = {
  course_fee: 'Học phí',
  pool_ticket: 'Vé bơi',
  shop: 'Mua hàng',
  refund: 'Hoàn tiền',
  adjustment: 'Điều chỉnh',
}

const METHOD_LABEL: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  card: 'Thẻ',
  other: 'Khác',
}

export default async function StudentTransactionsPage({ params }: Params) {
  await requireRole(['admin']) // strict admin
  const { id: studentId } = await params

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { fullName: true, phone: true } } },
  })
  if (!student) notFound()

  const payments = await prisma.payment.findMany({
    where: { studentId },
    orderBy: { recordedAt: 'desc' },
    take: 100,
  })

  // Tổng doanh thu (loại trừ excludeFromRevenue) cho summary
  const includedTotal = payments
    .filter((p) => !p.excludeFromRevenue)
    .reduce((s, p) => s + p.amount, 0)
  const excludedTotal = payments
    .filter((p) => p.excludeFromRevenue)
    .reduce((s, p) => s + p.amount, 0)

  return (
    <div className="ambient-bg min-h-screen">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <Link
          href={`/admin/students/${studentId}`}
          className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Hồ sơ học viên
        </Link>
        <PageHeader
          eyebrow="Quản lý tài chính"
          title="Lịch sử giao dịch"
          description={`HV: ${student.user.fullName} · ${student.user.phone ?? ''}`}
          display
          className="mb-6"
        />

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/8 p-4">
            <p className="text-xs text-foreground/55 mb-1">Tổng tính doanh thu</p>
            <p className="lqg-numeric-sans lqg-numeric-sans-lg text-foreground">
              {fmt(includedTotal)}
            </p>
          </div>
          <div className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/8 p-4">
            <p className="text-xs text-foreground/55 mb-1">Tổng loại trừ doanh thu</p>
            <p className="lqg-numeric-sans lqg-numeric-sans-lg text-foreground/70">
              {fmt(excludedTotal)}
            </p>
          </div>
        </div>

        {/* New button */}
        <div className="mb-5">
          <Link
            href={`/admin/students/${studentId}/transactions/new`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-pill bg-accent text-ink font-semibold text-sm hover:scale-[1.01] transition shadow-cta"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} /> Thêm giao dịch
          </Link>
        </div>

        {/* List */}
        {payments.length === 0 ? (
          <div className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/8 p-8 text-center">
            <p className="text-foreground/55 text-sm">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => {
              const isNegative = p.amount < 0
              const canReverse = !p.isReversal
              return (
                <div
                  key={p.id}
                  className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/8 p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`lqg-numeric-sans lqg-numeric-sans-md ${isNegative ? 'text-danger' : 'text-foreground'}`}
                        >
                          {fmt(p.amount)}
                        </span>
                        <span className="text-xs text-foreground/55">
                          · {TYPE_LABEL[p.type] ?? p.type}
                        </span>
                        <span className="text-xs text-foreground/55">
                          · {METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}
                        </span>
                        {p.isReversal && (
                          <Chip variant="danger" active className="text-[10px]">
                            Đảo bút toán
                          </Chip>
                        )}
                        {p.excludeFromRevenue && (
                          <Chip variant="warn" active className="text-[10px]">
                            Loại trừ DT
                          </Chip>
                        )}
                      </div>
                      <p className="text-xs text-foreground/65">
                        {format(p.recordedAt, "HH:mm 'ngày' dd/MM/yyyy", { locale: vi })}
                      </p>
                      {p.notes && (
                        <p className="text-sm text-foreground/80 mt-2 leading-relaxed">
                          {p.notes}
                        </p>
                      )}
                      {p.referenceNumber && (
                        <p className="text-xs text-foreground/55 mt-1 font-mono">
                          Ref: {p.referenceNumber}
                        </p>
                      )}
                    </div>
                    {canReverse && (
                      <TransactionRowActions paymentId={p.id} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Help */}
        <div className="mt-6 rounded-card bg-mist/8 ring-1 ring-mist/20 p-4 text-xs text-foreground/70 leading-relaxed">
          <p className="font-semibold text-foreground/85 mb-1">Lưu ý</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>Mọi thao tác ghi vào audit log — không thể xoá Payment.</li>
            <li>Đảo bút toán: tạo Payment mới với số tiền âm, KHÔNG xoá bản gốc.</li>
            <li>Giao dịch &quot;Loại trừ DT&quot; KHÔNG tính vào doanh thu báo cáo (carryover, compensation, gift).</li>
            <li><RotateCcw className="inline h-3 w-3 align-middle" /> chỉ áp dụng cho bút toán gốc — không đảo được bút toán đảo.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
