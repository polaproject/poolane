import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Plus, Sunrise, Sunset, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CAPACITY } from '@/config/constants'
import { InteractiveSessionCard, type SessionData } from './InteractiveSessionCard'

type SearchParams = Promise<{ week?: string }>

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

  function toSessionData(s: NonNullable<ReturnType<typeof getSession>>): SessionData {
    return {
      id: s.id,
      timeSlot: s.timeSlot as 'morning' | 'evening',
      status: s.status,
      registrations: s.registrations.map(r => ({
        id: r.id,
        status: r.status as 'pending' | 'approved' | 'waitlist',
        student: { id: r.student.id, fullName: r.student.user.fullName },
        course: r.course ? { code: r.course.code } : null,
      })),
    }
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
        <div className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/10 p-4 sm:p-5">
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
                        ? <InteractiveSessionCard session={toSessionData(session)} cap={CAPACITY.MORNING_MAX} slotLabel="5:30" />
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
                        ? <InteractiveSessionCard session={toSessionData(session)} cap={CAPACITY.EVENING_MAX} slotLabel="18:00" />
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
          <span className="ml-auto opacity-65">Click vào HV chờ duyệt để Duyệt / Từ chối trực tiếp</span>
        </div>
      </div>
    </div>
  )
}
