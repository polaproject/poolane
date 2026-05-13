import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft, Phone, MapPin, Calendar, BookOpen, Ticket } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { COURSE_PRICES, POOL_TICKET } from '@/config/constants'

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

const PLAN_LABELS: Record<string, string> = {
  A_full: 'Phương án A — Đóng toàn bộ',
  B_course_first: 'Phương án B — Học phí trước',
  C_deposit: 'Phương án C — Cọc 30%',
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('vi-VN') + 'đ'
}

export default async function StudentDetailPage({ params }: Params) {
  await requireRole(['admin', 'staff'])
  const { id } = await params

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: true,
      enrollments: {
        include: { course: true },
        orderBy: { enrolledAt: 'desc' }
      },
      poolTickets: {
        orderBy: { purchasedAt: 'desc' }
      },
      payments: {
        orderBy: { recordedAt: 'desc' },
        take: 10
      },
      studentNotes: {
        orderBy: { createdAt: 'desc' },
        take: 5
      },
    }
  })

  if (!student) notFound()

  const activeTicket = student.poolTickets.find(t => t.isActive)
  const sessionsLeft = activeTicket ? activeTicket.maxSessions - activeTicket.sessionsUsed : null

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/students">
            <ArrowLeft className="w-4 h-4 mr-1" /> Danh sách
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/students/${id}/edit`}>Chỉnh sửa</Link>
        </Button>
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
        {/* Pool ticket */}
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
                  className="h-full bg-[#5B8E9F] rounded-full transition-all"
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

        {/* Enrollments count */}
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

        {/* Last attended */}
        <div className="bg-white rounded-2xl p-4 border border-[#1C2B4A]/8">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-[#1C2B4A]/40" />
            <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/40 font-semibold">Lần cuối</p>
          </div>
          {student.lastAttendedAt ? (
            <>
              <p className="font-heading text-xl text-[#1C2B4A] mb-1">
                {format(student.lastAttendedAt, 'dd/MM')}
              </p>
              <p className="text-xs text-[#1C2B4A]/40">
                {format(student.lastAttendedAt, 'yyyy', { locale: vi })}
              </p>
            </>
          ) : (
            <p className="text-sm text-[#1C2B4A]/40">Chưa đi học</p>
          )}
        </div>
      </div>

      {/* Enrollments */}
      {student.enrollments.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 mb-4 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1C2B4A]/8">
            <h2 className="font-semibold text-[#1C2B4A] text-sm">Khoá học đã đăng ký</h2>
          </div>
          <div className="divide-y divide-[#1C2B4A]/5">
            {student.enrollments.map(e => {
              const remaining = e.course.price - e.totalPaid
              return (
                <div key={e.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#1C2B4A]">{e.course.name}</span>
                      <Badge
                        variant={e.status === 'active' ? 'default' : e.status === 'completed' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {e.status === 'active' ? 'Đang học'
                          : e.status === 'extension' ? 'Ôn luyện'
                          : e.status === 'completed' ? 'Hoàn thành'
                          : e.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#1C2B4A]/50">
                      {PLAN_LABELS[e.paymentPlan]} ·{' '}
                      Đăng ký {format(e.enrolledAt, 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#1C2B4A]">{formatCurrency(e.totalPaid)}</p>
                    {remaining > 0 && (
                      <p className="text-xs text-red-500">Còn nợ {formatCurrency(remaining)}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* User info detail */}
      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 mb-4">
        <div className="px-5 py-4 border-b border-[#1C2B4A]/8">
          <h2 className="font-semibold text-[#1C2B4A] text-sm">Thông tin cá nhân</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Email', value: student.user.email },
            { label: 'Giới tính', value: student.user.gender === 'male' ? 'Nam' : student.user.gender === 'female' ? 'Nữ' : student.user.gender },
            { label: 'Ngày sinh', value: student.user.dob ? format(student.user.dob, 'dd/MM/yyyy') : null },
            { label: 'Nghề nghiệp', value: student.user.occupation },
            { label: 'Địa chỉ', value: student.user.ward ? `${student.user.ward}, ${student.user.district}, ${student.user.province}` : null },
            { label: 'Liên hệ khẩn', value: student.user.emergencyContactName ? `${student.user.emergencyContactName} — ${student.user.emergencyContactPhone}` : null },
            { label: 'Ghi chú sức khoẻ', value: student.user.healthNotes },
            { label: 'Kinh nghiệm bơi', value: student.swimmingExperience },
            { label: 'Mục tiêu', value: student.learningGoal },
            { label: 'Nguồn tiếp cận', value: student.marketingSource },
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

      {/* Quick actions */}
      <div className="flex gap-3">
        <Button asChild variant="outline" className="flex-1">
          <Link href={`/admin/students/${id}/enroll`}>+ Đăng ký khoá học</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href={`/admin/students/${id}/ticket`}>+ Tạo vé bơi</Link>
        </Button>
      </div>
    </div>
  )
}
