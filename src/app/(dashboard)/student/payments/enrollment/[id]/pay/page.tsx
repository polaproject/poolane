import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, QrCode, ListChecks } from 'lucide-react'
import { buildEnrollmentMemo, buildQRInfo } from '@/lib/payments/vietqr'
import { CopyButton } from '@/components/ui/CopyButton'
import { MarkAsTransferredButton } from '@/app/(dashboard)/student/shop/orders/[id]/pay/MarkAsTransferredButton'

type Params = { params: Promise<{ id: string }> }

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function PayEnrollmentPage({ params }: Params) {
  const user = await requireRole(['student'])
  const { id } = await params

  const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })
  if (!student) notFound()

  const enrollment = await prisma.enrollment.findFirst({
    where: { id, studentId: student.id },
    include: { course: { select: { name: true, code: true, price: true } } },
  })

  if (!enrollment) notFound()
  if (enrollment.totalPaid >= enrollment.course.price) {
    redirect('/student/payments')
  }
  if (enrollment.status === 'cancelled' || enrollment.status === 'refunded') {
    return (
      <div className="min-h-screen bg-paper grid place-items-center px-4">
        <div className="rounded-card-xl bg-[var(--surface)] shadow-glass ring-1 ring-warn/30 p-8 text-center max-w-md">
          <div className="grid place-items-center h-16 w-16 rounded-pill bg-warn/15 mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-warn" strokeWidth={1.75} />
          </div>
          <h1 className="font-heading italic text-2xl text-foreground mb-2">Không thể thanh toán</h1>
          <p className="text-sm text-foreground/65">
            Khoá học ở trạng thái <strong className="text-foreground">{enrollment.status}</strong>.
          </p>
        </div>
      </div>
    )
  }

  const debt = enrollment.course.price - enrollment.totalPaid
  const memo = buildEnrollmentMemo(enrollment.id)
  const qrInfo = buildQRInfo(debt, memo)

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-md mx-auto">
          <Link
            href="/student/payments"
            className="inline-flex items-center gap-1.5 text-sm text-paper/65 hover:text-paper transition mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
            Lịch sử thanh toán
          </Link>
          <p className="eyebrow text-paper/55 mb-2">
            {enrollment.course.name} ({enrollment.course.code}) · còn nợ
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl italic leading-tight">Đóng học phí</h1>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-md mx-auto space-y-4 relative z-10">
        {!qrInfo.configured && (
          <div className="rounded-card bg-warn/10 ring-1 ring-warn/30 p-3 text-xs text-foreground/75 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-warn shrink-0 mt-0.5" strokeWidth={1.75} />
            <span>Tài khoản ngân hàng hiển thị là <strong>demo</strong>. Liên hệ lớp trước khi chuyển khoản.</span>
          </div>
        )}

        {/* Debt summary */}
        <div className="glass-card glass-card-hover p-5 text-sm space-y-2">
          <div className="flex justify-between text-foreground/65">
            <span>Học phí khoá</span>
            <span>{fmt(enrollment.course.price)}</span>
          </div>
          <div className="flex justify-between text-foreground/65">
            <span>Đã đóng</span>
            <span>−{fmt(enrollment.totalPaid)}</span>
          </div>
          <div className="border-t border-foreground/10 pt-2 flex justify-between items-baseline">
            <span className="text-foreground font-medium">Còn nợ</span>
            <span className="font-heading italic text-2xl text-warn">{fmt(debt)}</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-6 text-center">
          <div className="inline-flex items-center gap-1.5 eyebrow text-accent mb-4">
            <QrCode className="h-3 w-3" strokeWidth={2.25} /> Quét QR bằng app banking
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrInfo.qrUrl}
            alt="Mã QR thanh toán học phí Poolane"
            className="mx-auto w-full max-w-xs rounded-card-lg ring-1 ring-foreground/10"
          />
          <p className="text-xs text-foreground/55 mt-4">App sẽ tự điền sẵn STK + số tiền + nội dung</p>
        </div>

        {/* Transfer info */}
        <div className="glass-card glass-card-hover overflow-hidden">
          <div className="px-5 py-3 bg-paper-tint/40 border-b border-foreground/8">
            <p className="eyebrow text-foreground/55">Hoặc chuyển khoản thủ công</p>
          </div>
          <div className="divide-y divide-foreground/5 text-sm">
            <InfoRow label="Ngân hàng" value={qrInfo.bankDisplayName} />
            <InfoRow label="Số tài khoản" value={qrInfo.accountNo} copyable mono />
            <InfoRow label="Chủ tài khoản" value={qrInfo.accountName} />
            <InfoRow label="Số tiền" value={fmt(qrInfo.amount)} highlight />
            <InfoRow label="Nội dung CK" value={qrInfo.memo} copyable mono highlight />
          </div>
        </div>

        <div className="rounded-card-lg bg-mist/10 ring-1 ring-mist/30 p-5">
          <p className="eyebrow text-mist mb-3 inline-flex items-center gap-1.5">
            <ListChecks className="h-3 w-3" strokeWidth={2.25} /> Hướng dẫn 3 bước
          </p>
          <ol className="text-sm text-foreground/80 space-y-2 list-decimal pl-5 marker:text-mist marker:font-bold leading-relaxed">
            <li>Mở app ngân hàng → chọn <strong className="text-foreground">Quét QR</strong></li>
            <li>App tự điền sẵn — bạn chỉ cần xác nhận</li>
            <li><strong className="text-foreground">Quan trọng:</strong> không sửa nội dung &ldquo;{qrInfo.memo}&rdquo;</li>
          </ol>
        </div>

        <div className="glass-card glass-card-hover p-5">
          <p className="text-sm text-foreground/70 mb-4 leading-relaxed">
            Sau khi chuyển, lớp đối chiếu sao kê + xác nhận trong 24h. Bạn nhận thông báo + email biên lai.
          </p>
          <MarkAsTransferredButton orderId={enrollment.id} memo={memo} />
        </div>

        <p className="text-xs text-foreground/55 text-center px-4">
          Có khó khăn? Liên hệ qua Zalo hoặc <a href="mailto:support@poolane.vn" className="text-accent hover:underline">support@poolane.vn</a>
        </p>
      </div>
    </div>
  )
}

function InfoRow({ label, value, copyable, mono, highlight }: {
  label: string; value: string; copyable?: boolean; mono?: boolean; highlight?: boolean
}) {
  return (
    <div className="px-5 py-3 flex items-center justify-between gap-3">
      <p className="text-xs text-foreground/55">{label}</p>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`${mono ? 'font-mono' : ''} ${highlight ? 'text-foreground font-semibold' : 'text-foreground/80'}`}>
          {value}
        </span>
        {copyable && <CopyButton text={value} />}
      </div>
    </div>
  )
}
