import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, startOfWeek, addDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import { RegisterButton } from './register-button'
import { SESSION_TIMES } from '@/config/constants'
import { Chip } from '@/components/ui/Chip'
import { Calendar, Sunrise, Sunset, Ticket, AlertCircle } from 'lucide-react'

const STATUS_LABEL: Record<string, { label: string; variant: 'success' | 'warn' | 'danger' | 'mist' }> = {
  pending:  { label: 'Chờ duyệt',         variant: 'warn' },
  approved: { label: 'Đã duyệt',          variant: 'success' },
  rejected: { label: 'Không được duyệt',  variant: 'danger' },
  waitlist: { label: 'Chờ chỗ trống',     variant: 'mist' },
}

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

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 13)

  const sessions = await prisma.classSession.findMany({
    where: { date: { gte: weekStart, lte: weekEnd }, status: { not: 'cancelled' } },
    orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
    include: { registrations: { where: { status: { in: ['approved', 'pending'] } } } },
  })

  const myRegistrations = student ? await prisma.sessionRegistration.findMany({
    where: { studentId: student.id, status: { not: 'withdrawn' } },
  }) : []
  const myRegMap = new Map(myRegistrations.map(r => [r.sessionId, r]))

  const ticket = student?.poolTickets[0]
  const sessionsLeft = ticket ? ticket.maxSessions - ticket.sessionsUsed : null
  const ticketLow = sessionsLeft !== null && sessionsLeft <= 2

  return (
    <div className="min-h-screen bg-paper pb-12">
      {/* Hero */}
      <div className="bg-ink text-paper px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-mist/15 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-3xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2">2 tuần tới · Đăng ký buổi</p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Đăng ký học</h1>
          <div className="mt-4 inline-flex items-center gap-2 text-sm">
            <Ticket className="h-4 w-4 text-accent" strokeWidth={1.75} />
            {sessionsLeft !== null ? (
              <span className={ticketLow ? 'text-danger' : 'text-paper/80'}>
                Vé còn <strong className={ticketLow ? 'text-danger' : 'text-accent'}>{sessionsLeft}</strong> buổi
              </span>
            ) : (
              <span className="text-warn inline-flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} /> Chưa có vé bơi
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-3xl mx-auto relative z-10">
        {sessions.length === 0 ? (
          <div className="rounded-card-xl bg-white shadow-soft ring-1 ring-ink/8 p-12 text-center">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-ink/30" strokeWidth={1.5} />
            <p className="font-heading italic text-2xl text-ink mb-1">Chưa có lịch</p>
            <p className="text-sm text-ink/55">Lớp chưa tạo buổi cho 2 tuần tới.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => {
              const myReg = myRegMap.get(session.id)
              const approvedCount = session.registrations.filter(r => r.status === 'approved').length
              const isFull = approvedCount >= session.capacity
              const isMorning = session.timeSlot === 'morning'
              const timeLabel = isMorning
                ? `${SESSION_TIMES.MORNING.start} – ${SESSION_TIMES.MORNING.end}`
                : `${SESSION_TIMES.EVENING.start} – ${SESSION_TIMES.EVENING.end}`

              return (
                <div key={session.id} className="rounded-card-lg bg-white shadow-soft ring-1 ring-ink/8 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Date block */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="text-center w-14 shrink-0">
                      <div className="text-[10px] tracking-widest uppercase text-ink/45">
                        {format(session.date, 'EEE', { locale: vi })}
                      </div>
                      <div className="font-heading italic text-3xl text-ink leading-none mt-0.5">
                        {format(session.date, 'dd', { locale: vi })}
                      </div>
                      <div className="text-[10px] text-ink/40 mt-0.5">
                        {format(session.date, 'MM', { locale: vi })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink text-sm">
                        {format(session.date, 'EEEE, dd/MM', { locale: vi })}
                      </p>
                      <p className="text-xs text-ink/60 mt-0.5 inline-flex items-center gap-1.5">
                        {isMorning ? (
                          <><Sunrise className="h-3 w-3 text-accent" strokeWidth={1.75} /> {timeLabel}</>
                        ) : (
                          <><Sunset className="h-3 w-3 text-accent" strokeWidth={1.75} /> {timeLabel}</>
                        )}
                      </p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <Chip variant={isFull ? 'danger' : 'mist'}>
                          {approvedCount}/{session.capacity} chỗ
                        </Chip>
                        {isFull && <span className="text-xs text-warn">Hết chỗ</span>}
                      </div>
                      {session.notes && (
                        <p className="text-xs text-mist mt-2 italic">{session.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="sm:shrink-0 sm:w-44">
                    {myReg ? (
                      <Chip
                        variant={(STATUS_LABEL[myReg.status]?.variant) ?? 'warn'}
                        active
                        className="w-full justify-center py-2.5 text-sm"
                      >
                        {STATUS_LABEL[myReg.status]?.label ?? myReg.status}
                      </Chip>
                    ) : student ? (
                      <RegisterButton
                        sessionId={session.id}
                        studentId={student.id}
                        disabled={!ticket || sessionsLeft === 0}
                        disabledReason={!ticket ? 'Chưa có vé bơi' : sessionsLeft === 0 ? 'Hết vé bơi' : undefined}
                        enrollmentId={student.enrollments[0]?.courseId}
                      />
                    ) : (
                      <p className="text-xs text-center text-ink/45">Chưa có hồ sơ</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
