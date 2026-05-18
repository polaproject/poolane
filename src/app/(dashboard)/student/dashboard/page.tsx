import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Calendar, TrendingUp, Bell, ShoppingBag, ArrowRight, Ticket,
  BookOpen, Sparkles, Sunrise, Sunset, AlertCircle,
} from 'lucide-react'
import { format, isToday } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Chip } from '@/components/ui/Chip'
import { StarField } from '@/components/brand/StarField'
import { Stagger } from '@/components/motion/Stagger'
import { getStudentDebt } from '@/lib/student-finance'
import { getTicketAggregate, getTicketBreakdown } from '@/lib/ticket-aggregate'

export default async function StudentDashboard() {
  const user = await requireRole(['student'])

  const student = await prisma.student.findFirst({
    where: { userId: user.id },
    include: {
      user: true,
      enrollments: {
        where: { status: { in: ['active', 'extension'] } },
        include: { course: { select: { code: true, name: true } } },
        take: 3,
      },
      poolTickets: {
        where: { isActive: true },
        orderBy: { purchasedAt: 'asc' },
      },
    },
  })

  const nextSession = student ? await prisma.sessionRegistration.findFirst({
    where: {
      studentId: student.id,
      status: 'approved',
      session: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    },
    orderBy: { session: { date: 'asc' } },
    include: { session: { select: { date: true, timeSlot: true, status: true } } },
  }) : null

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  })

  const latestAssessment = student ? await prisma.assessment.findFirst({
    where: { studentId: student.id },
    orderBy: { assessmentDate: 'desc' },
    include: { scores: true },
  }) : null

  const avgScore = latestAssessment && latestAssessment.scores.length > 0
    ? (latestAssessment.scores.reduce((s, x) => s + x.score, 0) / latestAssessment.scores.length).toFixed(1)
    : null

  const ticketAgg = getTicketAggregate(student?.poolTickets ?? [])
  const sessionsLeft = ticketAgg.isNoTicket ? null : ticketAgg.sessionsLeft
  const ticketProgress = ticketAgg.maxSessions > 0
    ? Math.min(100, (ticketAgg.sessionsUsed / ticketAgg.maxSessions) * 100)
    : 0
  const ticketLow = ticketAgg.isLow
  const ticketBreakdown = getTicketBreakdown(ticketAgg)

  const debts = student ? await getStudentDebt(student.id) : []
  const totalDebt = debts.reduce((s, d) => s + d.debt, 0)

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 6) return 'Bơi sáng sớm cùng Poolane,'
    if (hour < 12) return 'Buổi sáng tốt lành,'
    if (hour < 17) return 'Buổi trưa vui vẻ,'
    if (hour < 21) return 'Buổi tối bình yên,'
    return 'Đêm muộn rồi,'
  })()

  return (
    <div className="min-h-screen pb-12">
      {/* ── HERO ─────────────────────────────────────────── */}
      <div className="hero-block px-5 sm:px-8 pt-8 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full -translate-y-1/3 translate-x-1/4 blur-2xl motion-sway" style={{ background: 'var(--hero-overlay-1)' }} />
        <div className="absolute bottom-0 left-1/4 w-60 h-60 rounded-full translate-y-1/2 blur-3xl motion-sway" style={{ background: 'var(--hero-overlay-2)', animationDelay: '-7s' }} />
        <div className="absolute top-1/2 right-1/3 w-40 h-40 rounded-full blur-3xl motion-sway" style={{ background: 'var(--hero-overlay-1)', animationDelay: '-12s' }} />
        <StarField density={22} maxSize={2} className="text-accent/55" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="eyebrow opacity-65 mb-3">{greeting}</p>
          <h1 className="lqg-headline">
            {user.fullName}
          </h1>
          {avgScore && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-accent/15 ring-1 ring-accent/30 text-sm">
              <Sparkles className="h-3.5 w-3.5 text-accent" strokeWidth={2.25} />
              <span className="opacity-80">Điểm trung bình kỹ năng:</span>
              <strong className="text-accent">{avgScore}/5</strong>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-10 max-w-3xl mx-auto space-y-4 relative z-10">
        {/* ── DEBT WARNING (nếu có) ──────────────────────── */}
        {debts.length > 0 && (
          <Link
            href="/student/payments"
            className="block rounded-card-lg bg-warn/10 ring-1 ring-warn/30 p-4 hover:ring-warn/50 transition group"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warn shrink-0 mt-0.5" strokeWidth={1.75} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Khoản cần đóng ({debts.length})
                </p>
                <p className="lqg-headline text-2xl text-warn mt-0.5">
                  {totalDebt.toLocaleString('vi-VN')}đ
                </p>
                <p className="inline-flex items-center gap-1 text-xs text-accent mt-1 group-hover:underline">
                  Xem chi tiết và thanh toán
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.25} />
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* ── TICKET + NEXT SESSION (2 col) ──────────────── */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Pool ticket */}
          <div
            className={`rounded-card-lg bg-[var(--surface)] p-5 shadow-soft ring-1 transition ${
              ticketLow ? 'ring-danger/30' : 'ring-foreground/8'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-mist" strokeWidth={1.75} />
                <p className="eyebrow text-foreground/55">Vé bơi</p>
              </div>
              {ticketLow && <Chip variant="danger" active>Sắp hết</Chip>}
            </div>

            {!ticketAgg.isNoTicket ? (
              <>
                <p className="lqg-headline text-3xl sm:text-5xl text-foreground leading-none">
                  {sessionsLeft}
                  <span className="text-sm font-body not-italic text-foreground/55 ml-2">buổi còn</span>
                </p>
                <div className="h-1.5 bg-ink/8 rounded-full mt-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      ticketProgress > 80 ? 'bg-danger' : ticketProgress > 60 ? 'bg-warn' : 'bg-mist'
                    }`}
                    style={{ width: `${ticketProgress}%` }}
                  />
                </div>
                <p className="text-xs text-foreground/55 mt-2">
                  Đã dùng {ticketAgg.sessionsUsed}/{ticketAgg.maxSessions} buổi
                </p>
                {ticketBreakdown.length >= 2 && (
                  <p className="text-xs text-foreground/55 mt-1">
                    {ticketBreakdown.join(' · ')}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="lqg-headline text-3xl text-foreground/40">Chưa có vé</p>
                <p className="text-sm text-foreground/55 mt-1">Liên hệ lớp để mua vé bơi</p>
              </>
            )}
          </div>

          {/* Next session */}
          <Link href="/student/my-schedule" className="group block">
            <div className="rounded-card-lg bg-ink text-paper p-5 shadow-soft hover:shadow-glass transition-all duration-300 hover:-translate-y-0.5 h-full flex flex-col relative overflow-hidden">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
              <div className="relative flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent" strokeWidth={1.75} />
                  <p className="eyebrow text-paper/55">Buổi tiếp theo</p>
                </div>
                <ArrowRight className="h-4 w-4 text-paper/40 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.25} />
              </div>

              {nextSession ? (
                <div className="relative flex-1">
                  <p className="lqg-headline text-3xl leading-tight text-paper">
                    {format(nextSession.session.date, 'EEEE', { locale: vi })}
                  </p>
                  <p className="font-heading text-2xl text-accent mt-1">
                    {format(nextSession.session.date, 'dd/MM', { locale: vi })}
                    {isToday(nextSession.session.date) && (
                      <Chip variant="accent" active className="ml-2 align-middle text-[10px]">Hôm nay</Chip>
                    )}
                  </p>
                  <p className="text-sm text-paper/70 mt-3 inline-flex items-center gap-1.5">
                    {nextSession.session.timeSlot === 'morning' ? (
                      <><Sunrise className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} /> 5:30 – 7:30 sáng</>
                    ) : (
                      <><Sunset className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} /> 18:00 – 20:00 chiều</>
                    )}
                  </p>
                </div>
              ) : (
                <div className="relative flex-1">
                  <p className="lqg-headline text-2xl text-paper">Chưa đăng ký</p>
                  <p className="text-sm text-paper/65 mt-2">Đăng ký buổi học mới ở tab kế bên</p>
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* ── QUICK LINKS ────────────────────────────────── */}
        <Stagger step={0.07} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickLink href="/student/schedule" icon={Calendar} label="Đăng ký buổi" />
          <QuickLink href="/student/progress" icon={TrendingUp} label="Tiến độ" />
          <QuickLink href="/shared/notifications" icon={Bell} label="Thông báo" badge={unreadCount > 0 ? unreadCount : undefined} />
          <QuickLink href="/student/shop" icon={ShoppingBag} label="Cửa hàng" />
        </Stagger>

        {/* ── ACTIVE COURSES ─────────────────────────────── */}
        {student && student.enrollments.length > 0 && (
          <div className="rounded-card-lg bg-[var(--surface)] p-5 shadow-soft ring-1 ring-foreground/8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-accent" strokeWidth={1.75} />
                <p className="eyebrow text-foreground/55">Khoá đang học</p>
              </div>
              <Link href="/student/progress" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
                Xem tiến độ <ArrowRight className="h-3 w-3" strokeWidth={2.25} />
              </Link>
            </div>
            <div className="space-y-2">
              {student.enrollments.map(e => (
                <Link
                  key={e.id}
                  href="/student/progress"
                  className="flex items-center justify-between py-2.5 px-3 rounded-card bg-paper-tint/50 hover:bg-paper-tint transition group"
                >
                  <div className="flex items-center gap-3">
                    <span className="lqg-headline text-lg text-foreground">{e.course.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip variant="mist">{e.course.code}</Chip>
                    <ArrowRight className="h-3.5 w-3.5 text-foreground/40 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.25} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function QuickLink({
  href, icon: Icon, label, badge,
}: {
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  badge?: number
}) {
  return (
    <Link
      href={href}
      className="group glass-card p-4 shadow-soft ring-1 ring-foreground/8 hover:ring-accent/40 hover:-translate-y-1 hover:shadow-[var(--shadow-glow-accent)] transition-[transform,box-shadow,ring] duration-300 [transition-timing-function:var(--ease-spring-soft)] flex flex-col gap-3 relative"
    >
      <div className="grid place-items-center h-10 w-10 rounded-pill bg-accent/12 group-hover:bg-accent/20 group-hover:scale-110 transition-transform duration-300 [transition-timing-function:var(--ease-spring)]">
        <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {badge !== undefined && (
        <span className="absolute top-3 right-3 bg-danger text-paper text-[10px] font-bold rounded-pill min-w-[20px] h-[20px] px-1.5 grid place-items-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}
