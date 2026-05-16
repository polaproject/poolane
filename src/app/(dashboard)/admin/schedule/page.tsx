import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, startOfWeek, addDays, addWeeks } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ScheduleGrid } from './ScheduleGrid'
import { ScheduleSelectionProvider } from './ScheduleSelectionContext'
import { ScheduleHeaderControls } from './ScheduleHeaderControls'
import type { SessionData } from './InteractiveSessionCard'

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
        // 'withdrawn' nay cung lay ve de owner co the "Cho di hoc lai" qua bulk action
        where: { status: { in: ['approved', 'pending', 'waitlist', 'withdrawn'] } },
        include: {
          student: { select: { id: true, studentCode: true, user: { select: { fullName: true, avatarUrl: true } } } },
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
        status: r.status as 'pending' | 'approved' | 'waitlist' | 'withdrawn',
        student: { id: r.student.id, fullName: r.student.user.fullName, avatarUrl: r.student.user.avatarUrl },
        course: r.course ? { code: r.course.code } : null,
      })),
    }
  }

  // Server-side: serialize Date → string + tinh dayLabels (avoid client locale drift)
  const week = days.map(day => {
    const morning = getSession(day, 'morning')
    const evening = getSession(day, 'evening')
    return {
      date: format(day, 'yyyy-MM-dd'),
      morning: morning ? toSessionData(morning) : null,
      evening: evening ? toSessionData(evening) : null,
    }
  })
  const dayLabels = days.map(day => ({
    short: format(day, 'EEE', { locale: vi }),
    num: format(day, 'd'),
    isToday: format(day, 'yyyy-MM-dd') === todayStr,
  }))

  return (
    <ScheduleSelectionProvider>
      <div className="min-h-screen bg-paper pb-12">
        <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
          <div className="relative max-w-7xl mx-auto flex items-end justify-between gap-3 flex-wrap">
            <div>
              <p className="eyebrow text-paper/55 mb-2">
                Tuần {format(weekStart, 'dd/MM')} – {format(weekEnd, 'dd/MM/yyyy')}
              </p>
              <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Lịch học</h1>
            </div>
            <ScheduleHeaderControls weekOffset={weekOffset} />
          </div>
        </div>

        <div className="px-4 sm:px-8 -mt-6 max-w-7xl mx-auto relative z-10">
          <ScheduleGrid
            week={week}
            emptySlotBuilder={{ hrefBase: '/admin/sessions/new' }}
            dayLabels={dayLabels}
          />

          {/* Legend */}
          <div className="mt-4 px-2 flex gap-4 text-xs text-foreground/55 flex-wrap items-center">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-pill bg-warn" /> Ít HV</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-pill bg-mist" /> Đủ chỗ</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-pill bg-accent" /> Có chờ duyệt</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-pill bg-danger" /> Đã huỷ</span>
            <span className="ml-auto opacity-65">Click HV để chọn · Shift+click để chọn dải · action bar hiện trên hero</span>
          </div>
        </div>
      </div>
    </ScheduleSelectionProvider>
  )
}
