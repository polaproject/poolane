import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, MapPin, Calendar, BookOpen, Ticket } from 'lucide-react'
import { format } from 'date-fns'

type Params = { params: Promise<{ id: string }> }

const STATUS_COLORS: Record<string, string> = {
  prospect:  'bg-gray-100 text-gray-700',
  enrolled:  'bg-blue-50 text-blue-700',
  active:    'bg-green-50 text-green-700',
  extension: 'bg-yellow-50 text-yellow-700',
  completed: 'bg-emerald-50 text-emerald-700',
  inactive:  'bg-red-50 text-red-700',
  refunded:  'bg-gray-50 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  prospect:  'Tiềm năng',
  enrolled:  'Đã đăng ký',
  active:    'Đang học',
  extension: 'Ôn luyện',
  completed: 'Hoàn thành',
  inactive:  'Vắng lâu',
  refunded:  'Đã hoàn tiền',
}

export default async function StaffStudentDetailPage({ params }: Params) {
  await requireRole(['staff', 'admin'])
  const { id } = await params

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: true,
      enrollments: {
        include: { course: { select: { code: true, name: true } } },
        orderBy: { enrolledAt: 'desc' }
      },
      poolTickets: {
        where: { isActive: true },
        orderBy: { purchasedAt: 'desc' },
        take: 1,
      },
      // Chỉ lấy notes công khai — ẩn private notes của admin
      studentNotes: {
        where: { isPrivate: false },
        orderBy: { createdAt: 'desc' },
        take: 5
      },
    }
  })

  if (!student) notFound()

  const activeTicket = student.poolTickets[0]
  const sessionsLeft = activeTicket ? activeTicket.maxSessions - activeTicket.sessionsUsed : null

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/staff/students"
          className="inline-flex items-center gap-1 text-sm text-[#1C2B4A]/70 hover:text-[#1C2B4A]"
        >
          <ArrowLeft className="w-4 h-4" /> Danh sách
        </Link>
      </div>

      {/* Profile header */}
      <div className="bg-[#1C2B4A] rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/4 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[#F6F1EA]/50 text-xs mb-1">{student.studentCode}</p>
              <h1 className="font-heading text-3xl text-[#F6F1EA]">{student.user.fullName}</h1>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[student.status] ?? 'bg-gray-100'}`}>
              {STATUS_LABELS[student.status] ?? student.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[#F6F1EA]/60">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              {student.user.phone ?? '—'}
            </div>
            {student.user.ward && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {student.user.ward}, {student.user.district}
              </div>
            )}
            {student.user.dob && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {format(student.user.dob, 'dd/MM/yyyy')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`bg-white rounded-2xl p-4 border ${sessionsLeft !== null && sessionsLeft <= 2 ? 'border-red-200' : 'border-[#1C2B4A]/8'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Ticket className="w-4 h-4 text-[#5B8E9F]" />
            <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/40 font-semibold">Vé bơi</p>
          </div>
          {activeTicket ? (
            <>
              <p className="font-heading text-3xl text-[#1C2B4A] mb-1">
                {sessionsLeft} <span className="text-sm font-body text-[#1C2B4A]/50">buổi</span>
              </p>
              <div className="h-1 bg-[#1C2B4A]/10 rounded-full">
                <div
                  className="h-full bg-[#5B8E9F] rounded-full"
                  style={{ width: `${((activeTicket.sessionsUsed / activeTicket.maxSessions) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-[#1C2B4A]/40 mt-1.5">
                Đã dùng {activeTicket.sessionsUsed}/{activeTicket.maxSessions}
              </p>
            </>
          ) : (
            <p className="text-sm text-[#1C2B4A]/40">Chưa có vé</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#1C2B4A]/8">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-[#C8A84B]" />
            <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/40 font-semibold">Khoá học</p>
          </div>
          <p className="font-heading text-3xl text-[#1C2B4A] mb-1">
            {student.enrollments.filter(e => ['active', 'extension'].includes(e.status)).length}
            <span className="text-sm font-body text-[#1C2B4A]/50"> đang học</span>
          </p>
          <p className="text-xs text-[#1C2B4A]/40">{student.enrollments.length} tổng khoá</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#1C2B4A]/8">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-[#1C2B4A]/40" />
            <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/40 font-semibold">Lần cuối</p>
          </div>
          {student.lastAttendedAt ? (
            <p className="font-heading text-xl text-[#1C2B4A]">
              {format(student.lastAttendedAt, 'dd/MM/yyyy')}
            </p>
          ) : (
            <p className="text-sm text-[#1C2B4A]/40">Chưa đi học</p>
          )}
        </div>
      </div>

      {/* Enrollments — KHÔNG hiển thị thông tin tài chính */}
      {student.enrollments.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 mb-4 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1C2B4A]/8">
            <h2 className="font-semibold text-[#1C2B4A] text-sm">Khoá học đã đăng ký</h2>
          </div>
          <div className="divide-y divide-[#1C2B4A]/5">
            {student.enrollments.map(e => (
              <div key={e.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1C2B4A]">{e.course.name}</p>
                  <p className="text-xs text-[#1C2B4A]/50 mt-0.5">
                    Đăng ký {format(e.enrolledAt, 'dd/MM/yyyy')}
                  </p>
                </div>
                <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-[#1C2B4A]/8 text-[#1C2B4A]/70 font-semibold">
                  {e.status === 'active' ? 'Đang học'
                    : e.status === 'extension' ? 'Ôn luyện'
                    : e.status === 'completed' ? 'Hoàn thành'
                    : e.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal info (no health notes — staff không cần thấy chi tiết sức khoẻ) */}
      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 mb-4">
        <div className="px-5 py-4 border-b border-[#1C2B4A]/8">
          <h2 className="font-semibold text-[#1C2B4A] text-sm">Thông tin cá nhân</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Giới tính', value: student.user.gender === 'male' ? 'Nam' : student.user.gender === 'female' ? 'Nữ' : student.user.gender },
            { label: 'Ngày sinh', value: student.user.dob ? format(student.user.dob, 'dd/MM/yyyy') : null },
            { label: 'Nghề nghiệp', value: student.user.occupation },
            { label: 'Địa chỉ', value: student.user.ward ? `${student.user.ward}, ${student.user.district}, ${student.user.province}` : null },
            { label: 'Liên hệ khẩn', value: student.user.emergencyContactName ? `${student.user.emergencyContactName} — ${student.user.emergencyContactPhone}` : null },
            { label: 'Ghi chú sức khoẻ', value: student.user.healthNotes },
            { label: 'Kinh nghiệm bơi', value: student.swimmingExperience },
            { label: 'Mục tiêu', value: student.learningGoal },
          ].map(item => (
            item.value ? (
              <div key={item.label}>
                <p className="text-xs text-[#1C2B4A]/40 mb-0.5">{item.label}</p>
                <p className="text-[#1C2B4A]">{item.value}</p>
              </div>
            ) : null
          ))}
        </div>
      </div>

      {/* Public notes only */}
      {student.studentNotes.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#1C2B4A]/8">
          <div className="px-5 py-4 border-b border-[#1C2B4A]/8">
            <h2 className="font-semibold text-[#1C2B4A] text-sm">Ghi chú</h2>
          </div>
          <div className="divide-y divide-[#1C2B4A]/5">
            {student.studentNotes.map(n => (
              <div key={n.id} className="px-5 py-3 text-sm">
                <p className="text-[#1C2B4A]">{n.note}</p>
                <p className="text-xs text-[#1C2B4A]/40 mt-1">
                  {format(n.createdAt, 'dd/MM/yyyy')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
