import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
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
    include: { orderItems: { include: { product: { select: { name: true } } } } }
  })

  if (!order) notFound()
  if (order.status === 'paid' || order.status === 'fulfilled') {
    redirect(`/student/shop/orders`)
  }
  if (order.status !== 'approved') {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h1 className="font-heading text-xl text-[#1C2B4A] mb-2">Đơn hàng chưa thể thanh toán</h1>
        <p className="text-sm text-[#1C2B4A]/60 mb-4">
          Trạng thái hiện tại: <strong>{order.status}</strong>. Đơn cần được lớp duyệt trước khi thanh toán.
        </p>
        <Link href="/student/shop/orders" className="inline-block px-4 py-2 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg text-sm font-semibold">
          Về danh sách đơn
        </Link>
      </div>
    )
  }

  const memo = buildMemo(order.id)
  const qrInfo = buildQRInfo(order.finalAmount, memo)
  const orderInfo = order.orderItems.length === 1
    ? order.orderItems[0].product.name
    : `${order.orderItems.length} sản phẩm`

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <Link href="/student/shop/orders" className="inline-flex items-center gap-1 text-sm text-[#F6F1EA]/60 hover:text-[#F6F1EA] mb-3">
          <ArrowLeft className="w-4 h-4" /> Đơn hàng của tôi
        </Link>
        <h1 className="font-heading text-2xl text-[#F6F1EA]">Thanh toán chuyển khoản</h1>
        <p className="text-[#F6F1EA]/50 text-xs mt-1">{orderInfo} · #{order.id.slice(0, 8).toUpperCase()}</p>
      </div>

      <div className="px-4 -mt-4 max-w-md mx-auto space-y-4">
        {!qrInfo.configured && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
            ⚠️ Tài khoản ngân hàng hiển thị là <strong>tài khoản demo</strong>. Liên hệ lớp trước khi chuyển khoản.
          </div>
        )}

        {/* QR Code */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-3">
            Quét QR bằng app banking
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrInfo.qrUrl}
            alt="VietQR thanh toán"
            className="mx-auto w-full max-w-xs rounded-xl border border-[#1C2B4A]/10"
          />
          <p className="text-xs text-[#1C2B4A]/40 mt-3">
            Hỗ trợ mọi app banking VN: Vietcombank, MB, Techcombank, ACB, VPBank, BIDV, ...
          </p>
        </div>

        {/* Transfer info */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1C2B4A]/8 bg-[#F6F1EA]/40">
            <h2 className="font-semibold text-[#1C2B4A] text-sm">Hoặc chuyển khoản thủ công</h2>
          </div>
          <div className="divide-y divide-[#1C2B4A]/5 text-sm">
            <InfoRow label="Ngân hàng" value={qrInfo.bankDisplayName} />
            <InfoRow label="Số tài khoản" value={qrInfo.accountNo} copyable mono />
            <InfoRow label="Chủ tài khoản" value={qrInfo.accountName} />
            <InfoRow label="Số tiền" value={fmt(qrInfo.amount)} highlight />
            <InfoRow label="Nội dung CK" value={qrInfo.memo} copyable mono highlight />
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">Hướng dẫn 3 bước:</p>
          <ol className="text-sm text-blue-900/80 space-y-1.5 list-decimal pl-5">
            <li>Mở app ngân hàng → chọn <strong>Quét QR</strong></li>
            <li>App tự điền sẵn STK, số tiền, nội dung — bạn chỉ cần xác nhận</li>
            <li>
              <strong>Quan trọng:</strong> không sửa nội dung &ldquo;{qrInfo.memo}&rdquo; — đây là mã đối chiếu của đơn
            </li>
          </ol>
        </div>

        {/* Confirmation */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-4">
          <p className="text-sm text-[#1C2B4A]/70 mb-3">
            Sau khi chuyển, lớp sẽ đối chiếu sao kê và xác nhận trong vòng 24h. Bạn sẽ nhận thông báo + email biên lai.
          </p>
          <MarkAsTransferredButton orderId={order.id} memo={memo} />
        </div>

        <p className="text-xs text-[#1C2B4A]/40 text-center px-4">
          Có khó khăn? Liên hệ lớp qua Zalo hoặc <a href="mailto:support@poolane.vn" className="text-[#5B8E9F] underline">support@poolane.vn</a>
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
      <p className="text-xs text-[#1C2B4A]/50">{label}</p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`${mono ? 'font-mono' : ''} ${highlight ? 'text-[#1C2B4A] font-semibold' : 'text-[#1C2B4A]/80'}`}>
          {value}
        </span>
        {copyable && <CopyButton text={value} />}
      </div>
    </div>
  )
}

