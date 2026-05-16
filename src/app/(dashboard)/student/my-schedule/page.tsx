import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Calendar, CheckCircle2, Clock, XCircle, AlertCircle, Sunrise, Sunset, ArrowRight,
} from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Chip } from '@/components/ui/Chip'

type StatusVariant = 'neutral' | 'accent' | 'mist' | 'success' | 'warn' | 'danger'

const STATUS_CONFIG: Record<string, { label: string; variant: StatusVariant; Icon: typeof Clock }> = {
  pending:   { label: 'Chờ duyệt', variant: 'warn',    Icon: Clock },
  approved:  { label: 'Đã duyệt',  variant: 'success', Icon: CheckCircle2 },
  rejected:  { label: 'Từ chối',   variant: 'danger',  Icon: XCircle },
  waitlist:  { label: 'Chờ list',  variant: 'mist',    Icon: Clock },
  withdrawn: { label: 'Đã rút',    variant: 'neutral', Icon: XCircle },
}

export default async function MySchedulePage() {
  const user = await requireRole(['student'])

  const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })
  if (!student) {
    return (
      <div className="p-8 text-center text-foreground/55">Không tìm thấy hồ sơ học viên</div>
    )
  }

   
  const since = new Date(Date.now() - 30 * 86400000)
  const registrations = await prisma.sessionRegistration.findMany({
    where: { studentId: student.id, registeredAt: { gte: since } },
    orderBy: { registeredAt: 'desc' },
    include: { session: { select: { id: true, date: true, timeSlot: true, status: true } } },
    take: 100,
  })

  const upcoming = registrations.filter(r => !isPast(r.session.date) || isToday(r.session.date))
  const past = registrations.filter(r => isPast(r.session.date) && !isToday(r.session.date))

  const attendance = await prisma.attendance.findMany({
    where: { studentId: student.id, markedAt: { gte: since } },
    select: { sessionId: true, status: true },
  })
  const attendanceMap = new Map(attendance.map(a => [a.sessionId, a.status]))

  // Tính vị trí waitlist cho mỗi reg đang ở waitlist (FIFO theo registeredAt)
  const waitlistRegs = upcoming.filter(r => r.status === 'waitlist')
  const waitlistPositions = new Map<string, number>()
  for (const r of waitlistRegs) {
    const pos = await prisma.sessionRegistration.count({
      where: { sessionId: r.sessionId, status: 'waitlist', registeredAt: { lte: r.registeredAt } },
    })
    waitlistPositions.set(r.id, pos)
  }

  return (
    <div className="min-h-screen bg-paper pb-12">
      {/* Hero */}
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-3xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2">30 ngày · Buổi sắp tới + lịch sử</p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Lịch học của tôi</h1>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-3xl mx-auto space-y-5 relative z-10">
        {/* Upcoming */}
        <Section
          eyebrow="Sắp tới"
          title="Buổi đang chờ"
          empty="Bạn chưa đăng ký buổi nào sắp tới"
          emptyAction={
            <Link
              href="/student/schedule"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              Đăng ký buổi học <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </Link>
          }
        >
          {upcoming.map(r => {
            const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending
            const cancelled = r.session.status === 'cancelled'
            const waitPos = r.status === 'waitlist' ? waitlistPositions.get(r.id) : undefined
            const statusLabel = typeof waitPos === 'number' ? `Vị trí #${waitPos}` : cfg.label
            const showFindOther = r.status === 'rejected' || r.status === 'withdrawn'
            return (
              <RegRow
                key={r.id}
                date={r.session.date}
                timeSlot={r.session.timeSlot}
                statusLabel={statusLabel}
                statusVariant={cfg.variant}
                StatusIcon={cfg.Icon}
                cancelled={cancelled}
                rejectedReason={r.rejectedReasonText ?? null}
                showFindOther={showFindOther}
              />
            )
          })}
        </Section>

        {/* Past */}
        <Section eyebrow="Đã qua" title="Lịch sử 30 ngày" empty="Chưa có buổi nào trong 30 ngày qua">
          {past.map(r => {
            const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending
            const att = attendanceMap.get(r.session.id)
            const statusLabel = att === 'present' ? 'Đã đi học' : att === 'absent' ? 'Vắng' : cfg.label
            const statusVariant: StatusVariant =
              att === 'present' ? 'success' : att === 'absent' ? 'danger' : cfg.variant
            const StatusIcon = att === 'present' ? CheckCircle2 : att === 'absent' ? XCircle : cfg.Icon
            return (
              <RegRow
                key={r.id}
                date={r.session.date}
                timeSlot={r.session.timeSlot}
                statusLabel={statusLabel}
                statusVariant={statusVariant}
                StatusIcon={StatusIcon}
                past
              />
            )
          })}
        </Section>
      </div>
    </div>
  )
}

function Section({
  eyebrow, title, children, empty, emptyAction,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
  empty: string
  emptyAction?: React.ReactNode
}) {
  const hasChildren = Array.isArray(children) && children.length > 0
  return (
    <section className="glass-card glass-card-hover overflow-hidden">
      <header className="px-5 py-4 border-b border-foreground/8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" strokeWidth={1.75} />
          <div>
            <p className="eyebrow text-foreground/55">{eyebrow}</p>
            <h2 className="lqg-headline text-lg text-foreground mt-0.5">{title}</h2>
          </div>
        </div>
      </header>
      {hasChildren ? (
        <div className="divide-y divide-foreground/5">{children}</div>
      ) : (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-foreground/55 mb-2">{empty}</p>
          {emptyAction}
        </div>
      )}
    </section>
  )
}

function RegRow({
  date, timeSlot, statusLabel, statusVariant, StatusIcon, cancelled, past, rejectedReason, showFindOther,
}: {
  date: Date
  timeSlot: string
  statusLabel: string
  statusVariant: StatusVariant
  StatusIcon: typeof Clock
  cancelled?: boolean
  past?: boolean
  rejectedReason?: string | null
  showFindOther?: boolean
}) {
  const isMorning = timeSlot === 'morning'
  return (
    <div className={`px-5 py-4 flex items-start gap-3 ${past ? 'opacity-65' : ''}`}>
      <div className="text-center w-12 shrink-0 pt-0.5">
        <div className="text-[10px] tracking-widest uppercase text-foreground/45">
          {format(date, 'EEE', { locale: vi })}
        </div>
        <div className="lqg-headline text-2xl text-foreground leading-none mt-0.5">
          {format(date, 'dd', { locale: vi })}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {format(date, 'EEEE, dd/MM/yyyy', { locale: vi })}
          {isToday(date) && (
            <Chip variant="accent" active className="ml-2 align-middle text-[10px]">Hôm nay</Chip>
          )}
        </p>
        <p className="text-xs text-foreground/55 mt-1 inline-flex items-center gap-1.5">
          {isMorning ? (
            <><Sunrise className="h-3 w-3 text-accent" strokeWidth={1.75} /> 5:30 – 7:30 sáng</>
          ) : (
            <><Sunset className="h-3 w-3 text-accent" strokeWidth={1.75} /> 18:00 – 20:00 chiều</>
          )}
        </p>
        {cancelled && (
          <p className="text-xs text-danger mt-1.5 inline-flex items-center gap-1">
            <AlertCircle className="h-3 w-3" strokeWidth={2} /> Buổi đã huỷ — vé đã hoàn lại
          </p>
        )}
        {rejectedReason && (
          <p className="text-xs text-danger mt-1.5">Lý do: {rejectedReason}</p>
        )}
        {showFindOther && (
          <Link
            href="/student/schedule"
            className="text-xs text-accent hover:underline inline-flex items-center gap-1 mt-1.5"
          >
            Tìm buổi khác <ArrowRight className="h-3 w-3" strokeWidth={2.25} />
          </Link>
        )}
      </div>
      <Chip variant={statusVariant} active className="shrink-0">
        <StatusIcon className="h-3 w-3" strokeWidth={2.25} /> {statusLabel}
      </Chip>
    </div>
  )
}
