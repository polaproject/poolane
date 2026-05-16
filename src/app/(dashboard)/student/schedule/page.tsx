import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, startOfWeek, addDays, isSameWeek, isToday, isTomorrow, isPast, isSameDay } from 'date-fns'
import { vi } from 'date-fns/locale'
import { RegisterPlusButton, StatusIcon } from './register-button'
import { SESSION_TIMES } from '@/config/constants'
import { Calendar, Sunrise, Sunset, Ticket, AlertCircle, Users, Clock as ClockIcon, ShoppingBag, ArrowRight } from 'lucide-react'
import { getAverageApprovalHours } from '@/lib/registration-sla'
import Link from 'next/link'

export default async function StudentSchedulePage() {
  const user = await requireRole(['admin', 'staff', 'student'])

  const student = await prisma.student.findFirst({
    where: { userId: user.id },
    include: {
      poolTickets: { where: { isActive: true }, take: 1 },
      enrollments: {
        where: { status: { in: ['active', 'extension'] } },
        include: { course: true },
      },
    },
  })

  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 13) // 2 tuần

  const sessions = await prisma.classSession.findMany({
    where: { date: { gte: today, lte: weekEnd }, status: { not: 'cancelled' } },
    orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
    include: { registrations: { where: { status: { in: ['approved', 'pending'] } } } },
  })

  const myRegistrations = student
    ? await prisma.sessionRegistration.findMany({
        where: { studentId: student.id, status: { not: 'withdrawn' } },
      })
    : []
  const myRegMap = new Map(myRegistrations.map(r => [r.sessionId, r]))

  const ticket = student?.poolTickets[0]
  const sessionsLeft = ticket ? ticket.maxSessions - ticket.sessionsUsed : null
  const ticketLow = sessionsLeft !== null && sessionsLeft <= 2
  const noTicket = !ticket
  const outOfTicket = sessionsLeft === 0

  const { hoursAvg, sampleSize } = await getAverageApprovalHours()
  const showSla = sampleSize >= 5
  const slaLabel = hoursAvg < 1 ? '<1' : String(Math.round(hoursAvg))

  // Group sessions by date string (yyyy-MM-dd)
  const byDate = new Map<string, typeof sessions>()
  for (const s of sessions) {
    const key = format(s.date, 'yyyy-MM-dd')
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(s)
  }

  // Group dates into "Tuần này" / "Tuần sau"
  const weekGroups: { label: string; dates: string[] }[] = [
    { label: 'Tuần này', dates: [] },
    { label: 'Tuần sau', dates: [] },
  ]
  for (const dateKey of byDate.keys()) {
    const d = new Date(dateKey)
    if (isSameWeek(d, today, { weekStartsOn: 1 })) {
      weekGroups[0].dates.push(dateKey)
    } else {
      weekGroups[1].dates.push(dateKey)
    }
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Hero */}
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-3xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2">2 tuần tới · Click + để đăng ký</p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Lịch học</h1>
          <div className="mt-4 inline-flex items-center gap-2 text-sm">
            <Ticket className="h-4 w-4 text-accent" strokeWidth={1.75} />
            {sessionsLeft !== null ? (
              <span className={ticketLow ? 'text-danger' : 'text-paper/80'}>
                Vé còn{' '}
                <strong className={ticketLow ? 'text-danger' : 'text-accent'}>
                  {sessionsLeft}
                </strong>{' '}
                buổi
              </span>
            ) : (
              <span className="text-warn inline-flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} /> Chưa có vé bơi
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-3xl mx-auto relative z-10 space-y-6">
        {/* Warning banner nếu hết / chưa có vé */}
        {(noTicket || outOfTicket) && (
          <div className="rounded-card-lg bg-warn/10 ring-1 ring-warn/30 p-4 flex flex-col sm:flex-row items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warn shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="text-sm flex-1 min-w-0">
              <p className="font-medium text-foreground">
                {noTicket ? 'Bạn chưa có vé bơi' : 'Vé bơi đã hết'}
              </p>
              <p className="text-foreground/70 mt-0.5">
                Bạn cần có vé bơi để đăng ký buổi học. Ghé cửa hàng chọn gói phù hợp với mình.
              </p>
            </div>
            <Link
              href="/student/shop"
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-ink rounded-pill text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-soft"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={2} />
              Mua vé bơi
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </Link>
          </div>
        )}

        {showSla && (
          <p className="inline-flex items-center gap-1.5 text-xs text-foreground/65 px-1">
            <ClockIcon className="h-3.5 w-3.5 text-mist" strokeWidth={2} />
            Giáo viên thường duyệt trong ~{slaLabel} giờ
          </p>
        )}

        {sessions.length === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">Chưa có lịch</p>
            <p className="text-sm text-foreground/55">Lớp chưa tạo buổi cho 2 tuần tới.</p>
          </div>
        ) : (
          weekGroups.map(group => {
            if (group.dates.length === 0) return null
            return (
              <section key={group.label}>
                <h2 className="lqg-headline text-base text-foreground/75 mb-3 px-1">{group.label}</h2>
                <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 overflow-hidden divide-y divide-foreground/8">
                  {group.dates.map(dateKey => (
                    <DateBlock
                      key={dateKey}
                      dateKey={dateKey}
                      sessions={byDate.get(dateKey)!}
                      myRegMap={myRegMap}
                      student={student}
                      ticket={ticket}
                      sessionsLeft={sessionsLeft}
                    />
                  ))}
                </div>
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────
// DateBlock: 1 ngày — list các session trong ngày đó
// ───────────────────────────────────────────────────────────────
type SessionWithRegs = NonNullable<Awaited<ReturnType<typeof prisma.classSession.findMany>>>[number] & {
  registrations: Array<{ status: string }>
}

function DateBlock({
  dateKey,
  sessions,
  myRegMap,
  student,
  ticket,
  sessionsLeft,
}: {
  dateKey: string
  sessions: SessionWithRegs[]
  myRegMap: Map<string, { status: string; sessionId: string }>
  student: { id: string; enrollments: Array<{ courseId: string }> } | null
  ticket: { id: string } | undefined
  sessionsLeft: number | null
}) {
  const date = new Date(dateKey)
  const dateIsToday = isToday(date)
  const dateIsTomorrow = isTomorrow(date)
  const datePast = isPast(date) && !isSameDay(date, new Date())

  let dateLabel: string
  if (dateIsToday) dateLabel = 'Hôm nay'
  else if (dateIsTomorrow) dateLabel = 'Ngày mai'
  else dateLabel = format(date, 'EEEE', { locale: vi })

  return (
    <div className={`px-5 py-4 ${datePast ? 'opacity-50' : ''}`}>
      {/* Date header */}
      <div className="flex items-baseline gap-2 mb-3">
        <span
          className={`lqg-headline text-base ${
            dateIsToday ? 'text-accent' : 'text-foreground'
          }`}
        >
          {dateLabel}
        </span>
        <span className="text-xs text-foreground/55">
          · {format(date, 'dd/MM', { locale: vi })}
        </span>
      </div>

      {/* Session rows */}
      <ul className="space-y-2">
        {sessions.map(session => (
          <SessionRow
            key={session.id}
            session={session}
            myReg={myRegMap.get(session.id) ?? null}
            student={student}
            ticket={ticket}
            sessionsLeft={sessionsLeft}
          />
        ))}
      </ul>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────
// SessionRow: 1 dòng cho 1 buổi học cụ thể
// ───────────────────────────────────────────────────────────────
function SessionRow({
  session,
  myReg,
  student,
  ticket,
  sessionsLeft,
}: {
  session: SessionWithRegs
  myReg: { status: string } | null
  student: { id: string; enrollments: Array<{ courseId: string }> } | null
  ticket: { id: string } | undefined
  sessionsLeft: number | null
}) {
  const isMorning = session.timeSlot === 'morning'
  const timeLabel = isMorning
    ? `${SESSION_TIMES.MORNING.start} – ${SESSION_TIMES.MORNING.end}`
    : `${SESSION_TIMES.EVENING.start} – ${SESSION_TIMES.EVENING.end}`
  const approvedCount = session.registrations.filter(r => r.status === 'approved').length
  const isFull = approvedCount >= session.capacity

  const noTicket = !ticket
  const outOfTicket = sessionsLeft === 0
  const disabled = noTicket || outOfTicket
  const disabledReason = noTicket
    ? 'Chưa có vé bơi'
    : outOfTicket
      ? 'Hết vé bơi'
      : undefined

  return (
    <li className="flex items-center gap-3 group">
      {/* Time slot icon */}
      <div
        className={`shrink-0 h-9 w-9 rounded-full grid place-items-center ${
          isMorning ? 'bg-accent-soft text-accent' : 'bg-mist/15 text-mist'
        }`}
      >
        {isMorning ? (
          <Sunrise className="h-4 w-4" strokeWidth={1.75} />
        ) : (
          <Sunset className="h-4 w-4" strokeWidth={1.75} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="font-medium text-foreground text-sm">
            {isMorning ? 'Buổi sáng' : 'Buổi chiều'}
          </p>
          <span className="text-xs text-foreground/55 tabular-nums">{timeLabel}</span>
        </div>
        <div className="text-xs text-foreground/55 mt-0.5 inline-flex items-center gap-1">
          <Users className="h-3 w-3" strokeWidth={1.75} />
          <span className="tabular-nums">
            {approvedCount}/{session.capacity}
          </span>
          {isFull && <span className="text-warn ml-1">· hết chỗ</span>}
          {session.notes && (
            <span className="text-mist italic ml-2 truncate">· {session.notes}</span>
          )}
        </div>
      </div>

      {/* Action: + button hoặc status icon */}
      <div className="shrink-0">
        {myReg ? (
          <StatusIcon status={myReg.status} />
        ) : student ? (
          <RegisterPlusButton
            sessionId={session.id}
            studentId={student.id}
            sessionDate={session.date}
            timeSlot={session.timeSlot}
            disabled={disabled}
            disabledReason={disabledReason}
            enrollmentId={student.enrollments[0]?.courseId}
            isFull={isFull}
          />
        ) : (
          <span className="text-xs text-foreground/45 px-2">—</span>
        )}
      </div>
    </li>
  )
}
