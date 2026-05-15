import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, QrCode, ListChecks } from 'lucide-react'
import { buildMemo, buildQRInfo } from '@/lib/payments/vietqr'
import { MarkAsTransferredButton } from './MarkAsTransferredButton'
import { CopyButton } from '@/components/ui/CopyButton'

type Params = { params: Promise<{ id: string }> }

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function PayOrderPage({ params }: Params) {
  const user = await requireRole(['student'])
  const { id } = await params

  const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })
  if (!student) notFound()

  const order = await prisma.order.findFirst({
    where: { id, studentId: student.id },
    include: { orderItems: { include: { product: { select: { name: true } } } } },
  })

  if (!order) notFound()
  if (order.status === 'paid' || order.status === 'fulfilled') {
    redirect(`/student/shop/orders`)
  }
  if (order.status !== 'approved') {
    return (
      <div className="min-h-screen bg-paper grid place-items-center px-4">
        <div className="rounded-card-xl bg-[var(--surface)] shadow-glass ring-1 ring-warn/30 p-8 text-center max-w-md">
          <div className="grid place-items-center h-16 w-16 rounded-pill bg-warn/15 mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-warn" strokeWidth={1.75} />
          </div>
          <h1 className="lqg-headline text-2xl text-foreground mb-2">Chưa thể thanh toán</h1>
          <p className="text-sm text-foreground/65 mb-5">
            Trạng thái hiện tại: <strong className="text-foreground">{order.status}</strong>. Đơn cần được lớp duyệt trước.
          </p>
          <Link
            href="/student/shop/orders"
            className="inline-flex items-center gap-1.5 bg-ink text-paper font-semibold px-5 py-2.5 rounded-pill text-sm hover:bg-foreground/90 transition"
          >
            Về danh sách đơn
          </Link>
        </div>
      </div>
    )
  }

  const memo = buildMemo(order.id)
  const qrInfo = buildQRInfo(order.finalAmount, memo)
  const orderInfo = order.orderItems.length === 1
    ? order.orderItems[0].product.name
    : `${order.orderItems.length} sản phẩm`

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-md mx-auto">
          <Link
            href="/student/shop/orders"
            className="inline-flex items-center gap-1.5 text-sm text-paper/65 hover:text-paper transition mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
            Đơn của tôi
          </Link>
          <p className="eyebrow text-paper/55 mb-2">{orderInfo} · #{order.id.slice(0, 8).toUpperCase()}</p>
          <h1 className="font-heading text-3xl sm:text-4xl italic leading-tight">Thanh toán</h1>
          <p className="text-sm text-paper/65 mt-2">Quét QR hoặc chuyển khoản thủ công — lớp xác nhận trong 24h.</p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-md mx-auto space-y-4 relative z-10">
        {!qrInfo.configured && (
          <div className="rounded-card bg-warn/10 ring-1 ring-warn/30 p-3 text-xs text-foreground/75 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-warn shrink-0 mt-0.5" strokeWidth={1.75} />
            <span>Tài khoản ngân hàng hiển thị là <strong>demo</strong>. Liên hệ lớp trước khi chuyển khoản.</span>
          </div>
        )}

        {/* QR Code */}
        <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-6 text-center">
          <div className="inline-flex items-center gap-1.5 eyebrow text-accent mb-4">
            <QrCode className="h-3 w-3" strokeWidth={2.25} /> Quét QR bằng app banking
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrInfo.qrUrl}
            alt="Mã QR thanh toán đơn hàng Poolane"
            className="mx-auto w-full max-w-xs rounded-card-lg ring-1 ring-foreground/10"
          />
          <p className="text-xs text-foreground/55 mt-4">
            Hỗ trợ mọi app banking: Vietcombank, MB, Techcombank, ACB, VPBank, BIDV, …
          </p>
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

        {/* Instructions */}
        <div className="rounded-card-lg bg-mist/10 ring-1 ring-mist/30 p-5">
          <p className="eyebrow text-mist mb-3 inline-flex items-center gap-1.5">
            <ListChecks className="h-3 w-3" strokeWidth={2.25} /> Hướng dẫn 3 bước
          </p>
          <ol className="text-sm text-foreground/80 space-y-2 list-decimal pl-5 marker:text-mist marker:font-bold leading-relaxed">
            <li>Mở app ngân hàng → chọn <strong className="text-foreground">Quét QR</strong></li>
            <li>App tự điền sẵn STK, số tiền, nội dung — bạn chỉ cần xác nhận</li>
            <li><strong className="text-foreground">Quan trọng:</strong> không sửa nội dung &ldquo;{qrInfo.memo}&rdquo; — đây là mã đối chiếu</li>
          </ol>
        </div>

        {/* Confirmation */}
        <div className="glass-card glass-card-hover p-5">
          <p className="text-sm text-foreground/70 mb-4 leading-relaxed">
            Sau khi chuyển, lớp đối chiếu sao kê + xác nhận trong 24h. Bạn nhận thông báo + email biên lai.
          </p>
          <MarkAsTransferredButton orderId={order.id} memo={memo} />
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
