import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { Pencil, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function StudentProfilePage() {
  const user = await requireRole(['student'])

  const student = await prisma.student.findFirst({
    where: { userId: user.id },
    include: {
      user: true,
      enrollments: {
        where: { status: { in: ['active', 'extension'] } },
        include: { course: { select: { code: true, name: true } } }
      },
      poolTickets: {
        where: { isActive: true },
        select: { sessionsUsed: true, maxSessions: true },
        orderBy: { purchasedAt: 'desc' },
        take: 1,
      },
    }
  })

  if (!student) notFound()

  const pendingRequest = await prisma.profileChangeRequest.findFirst({
    where: { studentId: student.id, status: 'pending' },
    orderBy: { requestedAt: 'desc' }
  })

  const u = student.user
  const ticket = student.poolTickets[0]

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      {/* Hero header */}
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/4 translate-x-1/4" />
        <div className="relative z-10">
          <p className="text-[#F6F1EA]/50 text-xs mb-1">{student.studentCode}</p>
          <h1 className="font-heading text-3xl text-[#F6F1EA]">{u.fullName}</h1>
          <div className="flex gap-4 mt-3 text-sm text-[#F6F1EA]/60">
            <span>{u.phone}</span>
            {ticket && <span>· Vé còn {ticket.maxSessions - ticket.sessionsUsed} buổi</span>}
            {student.enrollments.length > 0 && (
              <span>· {student.enrollments.length} khoá đang học</span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 max-w-2xl mx-auto">
        {/* Pending banner */}
        {pendingRequest && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-900">Bạn có 1 yêu cầu cập nhật đang chờ duyệt</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                Gửi lúc {format(pendingRequest.requestedAt, 'dd/MM/yyyy HH:mm')} — chờ staff/admin xử lý
              </p>
            </div>
          </div>
        )}

        {/* Identity fields (read-only, requires approval) */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 mb-4">
          <div className="px-5 py-4 border-b border-[#1C2B4A]/8 flex items-center justify-between">
            <h2 className="font-semibold text-[#1C2B4A] text-sm">Thông tin định danh</h2>
            {!pendingRequest && (
              <Link
                href="/student/profile/request-change"
                className="text-xs font-semibold text-[#1C2B4A] flex items-center gap-1 hover:underline"
              >
                <Send className="w-3.5 h-3.5" /> Yêu cầu cập nhật
              </Link>
            )}
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
            <Field label="Họ và tên" value={u.fullName} />
            <Field label="Ngày sinh" value={u.dob ? format(u.dob, 'dd/MM/yyyy') : null} />
            <Field label="Số điện thoại" value={u.phone} />
            <Field label="Email" value={u.email} />
            <Field label="Phường/Xã" value={u.ward} />
            <Field label="Quận/Huyện" value={u.district} />
            <Field label="Tỉnh/Thành" value={u.province} />
            <Field label="Địa chỉ chi tiết" value={u.addressStreet} />
            <Field label="Số CCCD/CMND" value={u.idCardNumber} />
          </div>
          <p className="px-5 pb-4 text-xs text-[#1C2B4A]/40">
            Các trường định danh cần staff/admin duyệt khi cập nhật để đảm bảo chính xác.
          </p>
        </div>

        {/* Soft fields (self-editable) */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 mb-4">
          <div className="px-5 py-4 border-b border-[#1C2B4A]/8 flex items-center justify-between">
            <h2 className="font-semibold text-[#1C2B4A] text-sm">Thông tin cá nhân</h2>
            <Link
              href="/student/profile/edit-soft"
              className="text-xs font-semibold text-[#1C2B4A] flex items-center gap-1 hover:underline"
            >
              <Pencil className="w-3.5 h-3.5" /> Tự sửa
            </Link>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
            <Field label="Nghề nghiệp" value={u.occupation} />
            <Field label="Ghi chú sức khoẻ" value={u.healthNotes} />
            <Field label="Liên hệ khẩn — Tên" value={u.emergencyContactName} />
            <Field label="Liên hệ khẩn — SĐT" value={u.emergencyContactPhone} />
          </div>
        </div>

        {/* Consents */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 mb-4">
          <div className="px-5 py-4 border-b border-[#1C2B4A]/8">
            <h2 className="font-semibold text-[#1C2B4A] text-sm">Đồng ý & Bảo mật</h2>
          </div>
          <div className="px-5 py-4 space-y-2.5 text-sm">
            <ConsentRow label="Đồng ý hình ảnh học tập nội bộ" at={u.photoConsentAt} />
            <ConsentRow label="Đồng ý hình ảnh dùng cho marketing" at={u.imageConsentMarketingAt} />
            <ConsentRow label="Đã đọc chính sách hoàn tiền" at={u.refundPolicyAcknowledgedAt} />
            <ConsentRow label="Đã đọc điều khoản sử dụng" at={u.termsAcknowledgedAt} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-[#1C2B4A]/40 mb-0.5">{label}</p>
      <p className="text-[#1C2B4A]">{value || <span className="text-[#1C2B4A]/30">—</span>}</p>
    </div>
  )
}

function ConsentRow({ label, at }: { label: string; at: Date | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#1C2B4A]/70">{label}</span>
      {at ? (
        <span className="flex items-center gap-1 text-xs text-green-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {format(at, 'dd/MM/yyyy')}
        </span>
      ) : (
        <span className="text-xs text-[#1C2B4A]/30">Chưa xác nhận</span>
      )}
    </div>
  )
}
