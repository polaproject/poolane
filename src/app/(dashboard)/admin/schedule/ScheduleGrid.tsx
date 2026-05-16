'use client'

import Link from 'next/link'
import { Plus, Sunrise, Sunset } from 'lucide-react'
import { CAPACITY } from '@/config/constants'
import { InteractiveSessionCard, type SessionData } from './InteractiveSessionCard'

interface DayData {
  date: string
  morning: SessionData | null
  evening: SessionData | null
}

interface Props {
  week: DayData[]
  emptySlotBuilder: { hrefBase: string }
  dayLabels: Array<{ short: string; num: string; isToday: boolean }>
}

/**
 * Schedule grid — render 14 session cards (7 ngày × sáng/chiều).
 * Selection state quản lý bởi ScheduleSelectionProvider (wrap page.tsx).
 * Action bar render trong ScheduleHeaderControls (cùng row hero) khi có
 * selection — KHÔNG render thêm dòng để tránh xô lệch grid.
 */
export function ScheduleGrid({ week, emptySlotBuilder, dayLabels }: Props) {
  return (
    <div className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/10 p-4 sm:p-5">
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[820px]">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {dayLabels.map((d, i) => (
              <div
                key={i}
                className={`text-center pb-2 border-b ${
                  d.isToday ? 'border-accent' : 'border-foreground/10'
                }`}
              >
                <p className={`text-[10px] tracking-widest uppercase font-medium ${
                  d.isToday ? 'text-accent' : 'text-foreground/45'
                }`}>
                  {d.short}
                </p>
                <p className={`lqg-headline text-2xl mt-0.5 ${
                  d.isToday ? 'text-foreground' : 'text-foreground/65'
                }`}>
                  {d.num}
                </p>
              </div>
            ))}
          </div>

          {/* Morning row */}
          <div className="eyebrow text-foreground/55 mb-2 inline-flex items-center gap-1.5">
            <Sunrise className="h-3 w-3 text-accent" strokeWidth={2.25} /> Ca sáng · 5:30 – 7:30
          </div>
          <div className="grid grid-cols-7 gap-2 mb-5">
            {week.map((day, i) => (
              <div key={`morning-${i}`}>
                {day.morning
                  ? <InteractiveSessionCard session={day.morning} cap={CAPACITY.MORNING_MAX} />
                  : <EmptySlot href={`${emptySlotBuilder.hrefBase}?date=${day.date}&slot=morning`} />}
              </div>
            ))}
          </div>

          {/* Evening row */}
          <div className="eyebrow text-foreground/55 mb-2 inline-flex items-center gap-1.5">
            <Sunset className="h-3 w-3 text-accent" strokeWidth={2.25} /> Ca chiều · 18:00 – 20:00
          </div>
          <div className="grid grid-cols-7 gap-2">
            {week.map((day, i) => (
              <div key={`evening-${i}`}>
                {day.evening
                  ? <InteractiveSessionCard session={day.evening} cap={CAPACITY.EVENING_MAX} />
                  : <EmptySlot href={`${emptySlotBuilder.hrefBase}?date=${day.date}&slot=evening`} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptySlot({ href }: { href: string }) {
  return (
    <Link href={href}>
      <div className="rounded-card ring-1 ring-dashed ring-foreground/15 p-3 min-h-[180px] flex flex-col items-center justify-center hover:ring-accent/40 hover:bg-paper-tint/30 transition-all cursor-pointer text-foreground/30">
        <Plus className="h-5 w-5 mb-1" strokeWidth={1.75} />
        <p className="text-xs">Tạo buổi</p>
      </div>
    </Link>
  )
}
