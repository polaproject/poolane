import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Phone, MapPin, Calendar, BookOpen, Ticket, Dumbbell, MessageCircle, FileText,
} from 'lucide-react'
import { format } from 'date-fns'
import { Chip } from '@/components/ui/Chip'
import { getTicketAggregate, getTicketBreakdown } from '@/lib/ticket-aggregate'

type Params = { params: Promise<{ id: string }> }
type Variant = 'neutral' | 'accent' | 'mist' | 'success' | 'warn' | 'danger'

const STATUS: Record<string, { label: string; variant: Variant }> = {
  prospect:  { label: 'Tiềm năng',  variant: 'accent' },
  enrolled:  { label: 'Đã đăng ký', variant: 'mist' },
  active:    { label: 'Đang học',   variant: 'success' },
  extension: { label: 'Ôn luyện',   variant: 'warn' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  inactive:  { label: 'Vắng lâu',   variant: 'danger' },
  refunded:  { label: 'Đã hoàn',    variant: 'neutral' },
}

const ENR_STATUS: Record<string, { label: string; variant: Variant }> = {
  active:    { label: 'Đang học',   variant: 'success' },
  extension: { label: 'Ôn luyện',   variant: 'warn' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  cancelled: { label: 'Đã huỷ',     variant: 'neutral' },
  refunded:  { label: 'Đã hoàn',    variant: 'neutral' },
}

export default async function StaffStudentDetailPage({ params }: Params) {
  await requireRole(['staff', 'admin'])
  const { id } = await params

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: true,
      enrollments: { include: { course: { select: { code: true, name: true } } }, orderBy: { enrolledAt: 'desc' } },
      poolTickets: { where: { isActive: true }, orderBy: { purchasedAt: 'asc' } },
      studentNotes: { where: { isPrivate: false }, orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })

  if (!student) notFound()

  const ticketAgg = getTicketAggregate(student.poolTickets)
  const activeTicket = ticketAgg.primaryTicket
  const sessionsLeft = ticketAgg.isNoTicket ? null : ticketAgg.sessionsLeft
  const isLow = ticketAgg.isLow
  const ticketBreakdown = getTicketBreakdown(ticketAgg)
  const cfg = STATUS[student.status] ?? STATUS.prospect
  const initial = student.user.fullName?.charAt(0).toUpperCase() ?? '?'
  const activeEnr = student.enrollments.filter(e => ['active', 'extension'].includes(e.status))

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <Link
              href="/staff/students"
              className="inline-flex items-center gap-1.5 text-sm text-paper/65 hover:text-paper transition group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
              Danh sách
            </Link>
            <Link
              href={`/staff/assign-practice/${student.id}`}
              className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2 rounded-pill text-sm hover:bg-accent/90 transition shadow-cta"
            >
              <Dumbbell className="h-4 w-4" strokeWidth={2.25} /> Gán bài tập
            </Link>
          </div>

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
                <Chip variant={cfg.variant} active>{cfg.label}</Chip>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-paper/65">
                {student.user.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" strokeWidth={1.75} /> {student.user.phone}</span>}
                {student.user.ward && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" strokeWidth={1.75} /> {student.user.ward}, {student.user.district}</span>}
                {student.user.dob && <span className="inline-flex items-center gap-1.5"><Calendar className="h-3 w-3" strokeWidth={1.75} /> {format(student.user.dob, 'dd/MM/yyyy')}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-4xl mx-auto space-y-4 relative z-10">
        {/* 3 stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`rounded-card-lg bg-[var(--surface)] p-5 shadow-soft ring-1 ${isLow ? 'ring-danger/30' : 'ring-foreground/8'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Ticket className="h-4 w-4 text-mist" strokeWidth={1.75} />
              <p className="eyebrow text-foreground/55">Vé bơi</p>
            </div>
            {activeTicket ? (
              <>
                <p className="lqg-headline text-2xl sm:text-4xl text-foreground leading-none">
                  {sessionsLeft}<span className="text-sm font-body not-italic text-foreground/55 ml-1.5">buổi</span>
                </p>
                <div className="h-1.5 bg-ink/8 rounded-full mt-3 overflow-hidden">
                  <div className={`h-full rounded-full ${isLow ? 'bg-danger' : 'bg-mist'}`} style={{ width: ticketAgg.maxSessions > 0 ? `${(ticketAgg.sessionsUsed / ticketAgg.maxSessions) * 100}%` : '0%' }} />
                </div>
                <p className="text-xs text-foreground/55 mt-2">Đã dùng {ticketAgg.sessionsUsed}/{ticketAgg.maxSessions}</p>
                {ticketBreakdown.length >= 2 && (
                  <p className="text-xs text-foreground/55 mt-1">{ticketBreakdown.join(' · ')}</p>
                )}
              </>
            ) : <p className="text-sm text-foreground/45">Chưa có vé</p>}
          </div>

          <div className="rounded-card-lg bg-[var(--surface)] p-5 shadow-soft ring-1 ring-foreground/8">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <p className="eyebrow text-foreground/55">Khoá học</p>
            </div>
            <p className="lqg-headline text-2xl sm:text-4xl text-foreground leading-none">
              {activeEnr.length}<span className="text-sm font-body not-italic text-foreground/55 ml-1.5">đang học</span>
            </p>
            <p className="text-xs text-foreground/55 mt-2">{student.enrollments.length} tổng khoá</p>
          </div>

          <div className="rounded-card-lg bg-[var(--surface)] p-5 shadow-soft ring-1 ring-foreground/8">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-foreground/55" strokeWidth={1.75} />
              <p className="eyebrow text-foreground/55">Lần cuối</p>
            </div>
            {student.lastAttendedAt
              ? <p className="lqg-headline text-2xl sm:text-4xl text-foreground leading-none">{format(student.lastAttendedAt, 'dd/MM')}</p>
              : <p className="text-sm text-foreground/45">Chưa đi học</p>}
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
                const ecfg = ENR_STATUS[e.status] ?? ENR_STATUS.active
                return (
                  <div key={e.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.course.name}</p>
                      <p className="text-xs text-foreground/55 mt-0.5">Đăng ký {format(e.enrolledAt, 'dd/MM/yyyy')}</p>
                    </div>
                    <Chip variant={ecfg.variant} active>{ecfg.label}</Chip>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Personal */}
        <div className="glass-card glass-card-hover overflow-hidden">
          <div className="px-5 py-4 border-b border-foreground/8 flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" strokeWidth={1.75} />
            <p className="eyebrow text-foreground/55">Thông tin cá nhân</p>
          </div>
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
                  <p className="text-xs text-foreground/45 mb-1">{item.label}</p>
                  <p className="text-foreground">{item.value}</p>
                </div>
              ) : null
            ))}
          </div>
        </div>

        {/* Public notes */}
        {student.studentNotes.length > 0 && (
          <div className="glass-card glass-card-hover overflow-hidden">
            <div className="px-5 py-4 border-b border-foreground/8 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <p className="eyebrow text-foreground/55">Ghi chú</p>
            </div>
            <div className="divide-y divide-foreground/5">
              {student.studentNotes.map(n => (
                <div key={n.id} className="px-5 py-3 text-sm">
                  <p className="text-foreground">{n.note}</p>
                  <p className="text-xs text-foreground/45 mt-1">{format(n.createdAt, 'dd/MM/yyyy')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
