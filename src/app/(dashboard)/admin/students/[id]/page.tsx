import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Phone, MapPin, Calendar, BookOpen, Ticket,
  Undo2, AlertCircle, Mail, Wallet,
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ConfirmEnrollmentTransferButton } from '@/components/features/ConfirmEnrollmentTransferButton'
import { Chip } from '@/components/ui/Chip'
import { getTicketAggregate, getTicketBreakdown } from '@/lib/ticket-aggregate'

type Params = { params: Promise<{ id: string }> }

type Variant = 'neutral' | 'accent' | 'mist' | 'success' | 'warn' | 'danger'
const STATUS_CONFIG: Record<string, { label: string; variant: Variant }> = {
  prospect:  { label: 'Tiềm năng',  variant: 'accent' },
  enrolled:  { label: 'Đã đăng ký', variant: 'mist' },
  active:    { label: 'Đang học',   variant: 'success' },
  extension: { label: 'Ôn luyện',   variant: 'warn' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  inactive:  { label: 'Vắng lâu',   variant: 'danger' },
  refunded:  { label: 'Đã hoàn',    variant: 'neutral' },
}

const ENROLLMENT_STATUS: Record<string, { label: string; variant: Variant }> = {
  active:    { label: 'Đang học',   variant: 'success' },
  extension: { label: 'Ôn luyện',   variant: 'warn' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  cancelled: { label: 'Đã huỷ',     variant: 'neutral' },
  refunded:  { label: 'Đã hoàn',    variant: 'neutral' },
}

const PLAN_LABELS: Record<string, string> = {
  A_full: 'Đóng toàn bộ',
  B_course_first: 'Học phí trước',
  C_deposit: 'Cọc 30%',
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function StudentDetailPage({ params }: Params) {
  await requireRole(['admin', 'staff'])
  const { id } = await params

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: true,
      enrollments: { include: { course: true }, orderBy: { enrolledAt: 'desc' } },
      poolTickets: { orderBy: { purchasedAt: 'desc' } },
      payments: { orderBy: { recordedAt: 'desc' }, take: 10 },
      studentNotes: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })

  if (!student) notFound()

  const ticketAgg = getTicketAggregate(student.poolTickets)
  const activeTicket = ticketAgg.primaryTicket
  const sessionsLeft = ticketAgg.isNoTicket ? null : ticketAgg.sessionsLeft
  const isLow = ticketAgg.isLow
  const ticketBreakdown = getTicketBreakdown(ticketAgg)
  const statusCfg = STATUS_CONFIG[student.status] ?? STATUS_CONFIG.prospect
  const initial = student.user.fullName?.charAt(0).toUpperCase() ?? '?'

  const activeEnrollments = student.enrollments.filter(e => ['active', 'extension'].includes(e.status))

  return (
    <div className="min-h-screen bg-paper pb-12">
      {/* Hero */}
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">

<div className="relative max-w-4xl mx-auto">
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-1.5 text-sm text-paper/65 hover:text-paper transition mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
            Danh sách học viên
          </Link>
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-pill overflow-hidden bg-accent shrink-0 shadow-cta grid place-items-center">
              {student.user.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={student.user.avatarUrl} alt={student.user.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-ink lqg-headline text-3xl sm:text-4xl">{initial}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-paper/55 mb-1 font-mono normal-case tracking-[0.2em]">{student.studentCode}</p>
              <h1 className="font-heading text-3xl sm:text-4xl italic leading-tight truncate">{student.user.fullName}</h1>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Chip variant={statusCfg.variant} active>{statusCfg.label}</Chip>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-paper/65">
                {student.user.phone && (
                  <span className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" strokeWidth={1.75} /> {student.user.phone}</span>
                )}
                {student.user.ward && (
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" strokeWidth={1.75} /> {student.user.ward}, {student.user.district}</span>
                )}
                {student.user.dob && (
                  <span className="inline-flex items-center gap-1.5"><Calendar className="h-3 w-3" strokeWidth={1.75} /> {format(student.user.dob, 'dd/MM/yyyy')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-8 -mt-6 max-w-4xl mx-auto space-y-4 relative z-10">
        {/* 3 stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Pool ticket */}
          <div className={`rounded-card-lg bg-[var(--surface)] p-5 shadow-soft ring-1 ${isLow ? 'ring-danger/30' : 'ring-foreground/8'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Ticket className="h-4 w-4 text-mist" strokeWidth={1.75} />
              <p className="eyebrow text-foreground/55">Vé bơi</p>
            </div>
            {activeTicket ? (
              <>
                <p className="lqg-headline text-2xl sm:text-4xl text-foreground leading-none">
                  {sessionsLeft}
                  <span className="text-sm font-body not-italic text-foreground/55 ml-1.5">buổi</span>
                </p>
                <div className="h-1.5 bg-ink/8 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isLow ? 'bg-danger' : 'bg-mist'}`}
                    style={{ width: ticketAgg.maxSessions > 0 ? `${(ticketAgg.sessionsUsed / ticketAgg.maxSessions) * 100}%` : '0%' }}
                  />
                </div>
                <p className="text-xs text-foreground/55 mt-2">Đã dùng {ticketAgg.sessionsUsed}/{ticketAgg.maxSessions}</p>
                {ticketBreakdown.length >= 2 && (
                  <p className="text-xs text-foreground/55 mt-1">
                    {ticketBreakdown.join(' · ')}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-foreground/45">Chưa có vé</p>
            )}
          </div>

          {/* Enrollments */}
          <div className="rounded-card-lg bg-[var(--surface)] p-5 shadow-soft ring-1 ring-foreground/8">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <p className="eyebrow text-foreground/55">Khoá học</p>
            </div>
            <p className="lqg-headline text-2xl sm:text-4xl text-foreground leading-none">
              {activeEnrollments.length}
              <span className="text-sm font-body not-italic text-foreground/55 ml-1.5">đang học</span>
            </p>
            <p className="text-xs text-foreground/55 mt-2">{student.enrollments.length} tổng khoá</p>
          </div>

          {/* Last attended */}
          <div className="rounded-card-lg bg-[var(--surface)] p-5 shadow-soft ring-1 ring-foreground/8">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-foreground/55" strokeWidth={1.75} />
              <p className="eyebrow text-foreground/55">Lần cuối</p>
            </div>
            {student.lastAttendedAt ? (
              <>
                <p className="lqg-headline text-2xl sm:text-4xl text-foreground leading-none">{format(student.lastAttendedAt, 'dd/MM')}</p>
                <p className="text-xs text-foreground/55 mt-2">{format(student.lastAttendedAt, 'yyyy', { locale: vi })}</p>
              </>
            ) : (
              <p className="text-sm text-foreground/45">Chưa đi học</p>
            )}
          </div>
        </div>

        {/* Enrollments */}
        {student.enrollments.length > 0 && (
          <div className="glass-card glass-card-hover overflow-hidden">
            <div className="px-5 py-4 border-b border-foreground/8 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <p className="eyebrow text-foreground/55">Khoá học đã đăng ký</p>
            </div>
            <div className="divide-y divide-foreground/5">
              {student.enrollments.map(e => {
                const remaining = e.course.price - e.totalPaid
                const memo = `POLAE${e.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
                const enrCfg = ENROLLMENT_STATUS[e.status] ?? ENROLLMENT_STATUS.active
                return (
                  <div key={e.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="lqg-headline text-lg text-foreground">{e.course.name}</span>
                          <Chip variant={enrCfg.variant} active className="text-[10px]">{enrCfg.label}</Chip>
                        </div>
                        <p className="text-xs text-foreground/55">
                          {PLAN_LABELS[e.paymentPlan]} · Đăng ký {format(e.enrolledAt, 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-foreground">{fmt(e.totalPaid)}</p>
                        {remaining > 0 && (
                          <p className="text-xs text-danger inline-flex items-center gap-1 mt-0.5">
                            <AlertCircle className="h-3 w-3" strokeWidth={2.25} /> Còn nợ {fmt(remaining)}
                          </p>
                        )}
                      </div>
                    </div>
                    {remaining > 0 && e.status !== 'cancelled' && e.status !== 'refunded' && (
                      <div className="mt-3 pt-3 border-t border-foreground/5">
                        <ConfirmEnrollmentTransferButton
                          enrollmentId={e.id}
                          memo={memo}
                          debt={remaining}
                          courseName={e.course.name}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* User info detail */}
        <div className="glass-card glass-card-hover overflow-hidden">
          <div className="px-5 py-4 border-b border-foreground/8 flex items-center gap-2">
            <Mail className="h-4 w-4 text-accent" strokeWidth={1.75} />
            <p className="eyebrow text-foreground/55">Thông tin cá nhân</p>
          </div>
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
                  <p className="text-xs text-foreground/45 mb-1">{item.label}</p>
                  <p className="text-foreground">{item.value}</p>
                </div>
              ) : null
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href={`/admin/students/${id}/enroll`}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-pill bg-ink text-paper font-semibold text-sm hover:bg-foreground/90 transition shadow-soft"
          >
            <BookOpen className="h-4 w-4 text-accent" strokeWidth={1.75} /> Đăng ký khoá học
          </Link>
          <Link
            href={`/admin/students/${id}/ticket`}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-pill ring-1 ring-foreground/15 text-sm font-medium text-foreground hover:bg-foreground/5 transition"
          >
            <Ticket className="h-4 w-4 text-mist" strokeWidth={1.75} /> Tạo vé bơi
          </Link>
          <Link
            href={`/admin/students/${id}/transactions`}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-pill ring-1 ring-foreground/15 text-sm font-medium text-foreground hover:bg-foreground/5 transition"
          >
            <Wallet className="h-4 w-4 text-accent" strokeWidth={1.75} /> Quản lý giao dịch
          </Link>
          <Link
            href={`/admin/finance/refunds/new?student=${id}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-pill ring-1 ring-danger/30 text-sm font-medium text-danger hover:bg-danger/5 transition"
          >
            <Undo2 className="h-4 w-4" strokeWidth={1.75} /> Yêu cầu hoàn tiền
          </Link>
        </div>
      </div>
    </div>
  )
}
