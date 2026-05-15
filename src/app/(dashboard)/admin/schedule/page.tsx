import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Plus, Users, Sunrise, Sunset, AlertCircle, X as XIcon, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CAPACITY } from '@/config/constants'
import { Chip } from '@/components/ui/Chip'

type SearchParams = Promise<{ week?: string }>

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default async function SchedulePage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['admin', 'staff'])

  const params = await searchParams
  const weekOffset = parseInt(params.week ?? '0')
  const baseDate = new Date()
  const weekStart = startOfWeek(addWeeks(baseDate, weekOffset), { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 6)

  const sessions = await prisma.classSession.findMany({
    where: { date: { gte: weekStart, lte: weekEnd } },
    orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
    include: {
      registrations: {
        where: { status: { in: ['approved', 'pending', 'waitlist'] } },
        include: {
          student: { select: { id: true, studentCode: true, user: { select: { fullName: true } } } },
          course: { select: { code: true } },
        },
        orderBy: { registeredAt: 'asc' },
      },
    },
  })

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  function getSession(date: Date, timeSlot: 'morning' | 'evening') {
    return sessions.find(s =>
      format(s.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && s.timeSlot === timeSlot
    )
  }

  function SessionCard({
    session, cap, slotLabel,
  }: {
    session: NonNullable<ReturnType<typeof getSession>>
    cap: number
    slotLabel: string
  }) {
    const approved = session.registrations.filter(r => r.status === 'approved')
    const pending = session.registrations.filter(r => r.status === 'pending')
    const isFull = approved.length >= cap
    const isLow = approved.length < (session.timeSlot === 'morning' ? CAPACITY.MORNING_MIN : CAPACITY.EVENING_MIN)
    const isCancelled = session.status === 'cancelled'

    const tone = isCancelled
      ? 'bg-danger/8 ring-danger/30'
      : isFull
        ? 'bg-mist/10 ring-mist/30'
        : isLow
          ? 'bg-warn/10 ring-warn/30'
          : 'bg-[var(--surface)] ring-foreground/8'

    return (
      <Link href={`/admin/schedule/sessions/${session.id}`} className="block group">
        <div className={`rounded-card p-3 ring-1 hover:-translate-y-0.5 hover:shadow-soft transition-all min-h-[180px] flex flex-col ${tone}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground/65">{slotLabel}</span>
            <Chip variant={isFull ? 'mist' : isLow ? 'warn' : 'neutral'} className="text-[10px]">
              <Users className="h-2.5 w-2.5" strokeWidth={2.25} /> {approved.length}/{cap}
            </Chip>
          </div>

          {isCancelled && (
            <div className="text-xs text-danger inline-flex items-center gap-1 mb-2 font-medium">
              <XIcon className="h-3 w-3" strokeWidth={2.25} /> Đã huỷ
            </div>
          )}

          <div className="flex-1 space-y-1 min-h-0">
            {approved.length === 0 && pending.length === 0 ? (
              <p className="text-xs text-foreground/30 italic">Chưa có HV</p>
            ) : (
              <>
                {approved.map(r => (
                  <div key={r.id} className="flex items-center gap-1.5">
                    <div className="grid place-items-center h-5 w-5 rounded-pill bg-mist text-paper text-[9px] font-bold shrink-0">
                      {initials(r.student.user.fullName)}
                    </div>
                    <span className="text-xs text-foreground truncate flex-1">
                      {r.student.user.fullName}
                    </span>
                    {r.course && (
                      <Chip variant="neutral" className="text-[9px] px-1.5 py-0">{r.course.code}</Chip>
                    )}
                  </div>
                ))}
                {pending.map(r => (
                  <div key={r.id} className="flex items-center gap-1.5 opacity-65">
                    <div className="grid place-items-center h-5 w-5 rounded-pill ring-1 ring-dashed ring-accent text-accent text-[9px] font-bold shrink-0">
                      ?
                    </div>
                    <span className="text-xs text-foreground/70 truncate flex-1 italic">
                      {r.student.user.fullName}
                    </span>
                    <span className="text-[9px] text-accent font-bold">CHỜ</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {pending.length > 0 && (
            <div className="text-xs text-accent mt-2 pt-2 border-t border-foreground/8 inline-flex items-center gap-1 font-medium">
              <AlertCircle className="h-3 w-3" strokeWidth={2.25} /> {pending.length} chờ duyệt
            </div>
          )}
        </div>
      </Link>
    )
  }

  function EmptySlotLink({ date, slot }: { date: Date; slot: 'morning' | 'evening' }) {
    return (
      <Link href={`/admin/sessions/new?date=${format(date, 'yyyy-MM-dd')}&slot=${slot}`}>
        <div className="rounded-card ring-1 ring-dashed ring-foreground/15 p-3 min-h-[180px] flex flex-col items-center justify-center hover:ring-accent/40 hover:bg-paper-tint/30 transition-all cursor-pointer text-foreground/30">
          <Plus className="h-5 w-5 mb-1" strokeWidth={1.75} />
          <p className="text-xs">Tạo buổi</p>
        </div>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-mist/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-7xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2">
              Tuần {format(weekStart, 'dd/MM')} – {format(weekEnd, 'dd/MM/yyyy')}
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Lịch học</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1 glass-pill p-1">
              <Link
                href={`/admin/schedule?week=${weekOffset - 1}`}
                className="grid place-items-center h-8 w-8 rounded-pill hover:bg-paper/10 transition"
                aria-label="Tuần trước"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
              </Link>
              {weekOffset !== 0 && (
                <Link
                  href="/admin/schedule"
                  className="px-3 h-8 rounded-pill text-xs font-medium hover:bg-paper/10 transition inline-flex items-center"
                >
                  Hôm nay
                </Link>
              )}
              <Link
                href={`/admin/schedule?week=${weekOffset + 1}`}
                className="grid place-items-center h-8 w-8 rounded-pill hover:bg-paper/10 transition"
                aria-label="Tuần sau"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
              </Link>
            </div>
            <Link
              href="/admin/sessions/new"
              className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2 rounded-pill text-sm hover:bg-accent/90 transition shadow-cta"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Tạo buổi
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-7xl mx-auto relative z-10">
        <div className="glass-card glass-card-hover p-4 sm:p-5">
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[820px]">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {days.map(day => {
                  const isToday = format(day, 'yyyy-MM-dd') === todayStr
                  return (
                    <div
                      key={day.toISOString()}
                      className={`text-center pb-2 border-b ${
                        isToday ? 'border-accent' : 'border-foreground/10'
                      }`}
                    >
                      <p className={`text-[10px] tracking-widest uppercase font-medium ${
                        isToday ? 'text-accent' : 'text-foreground/45'
                      }`}>
                        {format(day, 'EEE', { locale: vi })}
                      </p>
                      <p className={`lqg-headline text-2xl mt-0.5 ${
                        isToday ? 'text-foreground' : 'text-foreground/65'
                      }`}>
                        {format(day, 'd')}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Morning */}
              <div className="eyebrow text-foreground/55 mb-2 inline-flex items-center gap-1.5">
                <Sunrise className="h-3 w-3 text-accent" strokeWidth={2.25} /> Ca sáng · 5:30 – 7:30
              </div>
              <div className="grid grid-cols-7 gap-2 mb-5">
                {days.map(day => {
                  const session = getSession(day, 'morning')
                  return (
                    <div key={`morning-${day.toISOString()}`}>
                      {session
                        ? <SessionCard session={session} cap={CAPACITY.MORNING_MAX} slotLabel="5:30" />
                        : <EmptySlotLink date={day} slot="morning" />}
                    </div>
                  )
                })}
              </div>

              {/* Evening */}
              <div className="eyebrow text-foreground/55 mb-2 inline-flex items-center gap-1.5">
                <Sunset className="h-3 w-3 text-accent" strokeWidth={2.25} /> Ca chiều · 18:00 – 20:00
              </div>
              <div className="grid grid-cols-7 gap-2">
                {days.map(day => {
                  const session = getSession(day, 'evening')
                  return (
                    <div key={`evening-${day.toISOString()}`}>
                      {session
                        ? <SessionCard session={session} cap={CAPACITY.EVENING_MAX} slotLabel="18:00" />
                        : <EmptySlotLink date={day} slot="evening" />}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 px-2 flex gap-4 text-xs text-foreground/55 flex-wrap items-center">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-pill bg-warn" /> Ít HV</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-pill bg-mist" /> Đủ chỗ</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-pill bg-accent" /> Có chờ duyệt</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-pill bg-danger" /> Đã huỷ</span>
          <span className="ml-auto opacity-65">Click vào ô để xem chi tiết + duyệt</span>
        </div>
      </div>
    </div>
  )
}
