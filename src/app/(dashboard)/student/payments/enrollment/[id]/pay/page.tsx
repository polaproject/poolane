import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
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
    include: { course: { select: { name: true, code: true, price: true } } }
  })

  if (!enrollment) notFound()
  if (enrollment.totalPaid >= enrollment.course.price) {
    redirect('/student/payments')
  }
  if (enrollment.status === 'cancelled' || enrollment.status === 'refunded') {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h1 className="font-heading text-xl text-[#1C2B4A] mb-2">Không thể thanh toán</h1>
        <p className="text-sm text-[#1C2B4A]/60">Khoá học ở trạng thái <strong>{enrollment.status}</strong>.</p>
      </div>
    )
  }

  const debt = enrollment.course.price - enrollment.totalPaid
  const memo = buildEnrollmentMemo(enrollment.id)
  const qrInfo = buildQRInfo(debt, memo)

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <Link href="/student/payments" className="inline-flex items-center gap-1 text-sm text-[#F6F1EA]/60 hover:text-[#F6F1EA] mb-3">
          <ArrowLeft className="w-4 h-4" /> Lịch sử thanh toán
        </Link>
        <h1 className="font-heading text-2xl text-[#F6F1EA]">Đóng học phí qua chuyển khoản</h1>
        <p className="text-[#F6F1EA]/50 text-xs mt-1">
          {enrollment.course.name} ({enrollment.course.code}) · còn nợ {fmt(debt)}
        </p>
      </div>

      <div className="px-4 -mt-4 max-w-md mx-auto space-y-4">
        {!qrInfo.configured && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
            ⚠️ Tài khoản ngân hàng hiển thị là <strong>tài khoản demo</strong>. Liên hệ lớp trước khi chuyển khoản.
          </div>
        )}

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-4 text-sm space-y-1.5">
          <div className="flex justify-between text-[#1C2B4A]/60">
            <span>Học phí khoá</span>
            <span>{fmt(enrollment.course.price)}</span>
          </div>
          <div className="flex justify-between text-[#1C2B4A]/60">
            <span>Đã đóng</span>
            <span>−{fmt(enrollment.totalPaid)}</span>
          </div>
          <div className="border-t border-[#1C2B4A]/10 pt-1.5 flex justify-between font-semibold text-[#1C2B4A]">
            <span>Còn nợ</span>
            <span>{fmt(debt)}</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-3">
            Quét QR bằng app banking
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrInfo.qrUrl}
            alt="Mã QR thanh toán học phí Poolane"
            className="mx-auto w-full max-w-xs rounded-xl border border-[#1C2B4A]/10"
          />
          <p className="text-xs text-[#1C2B4A]/40 mt-3">
            App sẽ tự điền sẵn STK + số tiền + nội dung
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

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">Hướng dẫn 3 bước:</p>
          <ol className="text-sm text-blue-900/80 space-y-1.5 list-decimal pl-5">
            <li>Mở app ngân hàng → chọn <strong>Quét QR</strong></li>
            <li>App tự điền sẵn — bạn chỉ cần xác nhận</li>
            <li><strong>Quan trọng:</strong> không sửa nội dung &ldquo;{qrInfo.memo}&rdquo;</li>
          </ol>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-4">
          <p className="text-sm text-[#1C2B4A]/70 mb-3">
            Sau khi chuyển, lớp sẽ đối chiếu sao kê và xác nhận trong vòng 24h. Bạn nhận thông báo + email biên lai.
          </p>
          <MarkAsTransferredButton orderId={enrollment.id} memo={memo} />
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
