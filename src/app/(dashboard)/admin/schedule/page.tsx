import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Clock } from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CAPACITY } from '@/config/constants'

type SearchParams = Promise<{ week?: string }>

export default async function SchedulePage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['admin', 'staff'])

  const params = await searchParams
  const weekOffset = parseInt(params.week ?? '0')
  const baseDate = new Date()
  const weekStart = startOfWeek(addWeeks(baseDate, weekOffset), { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 6)

  const sessions = await prisma.classSession.findMany({
    where: {
      date: { gte: weekStart, lte: weekEnd },
    },
    orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
    include: {
      registrations: {
        where: { status: { in: ['approved', 'pending', 'waitlist'] } },
        select: { id: true, status: true }
      }
    }
  })

  // Build 7-day grid
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function getSession(date: Date, timeSlot: 'morning' | 'evening') {
    return sessions.find(s =>
      format(s.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
      s.timeSlot === timeSlot
    )
  }

  const STATUS_CONFIG = {
    scheduled: { label: 'Lên lịch', color: 'bg-blue-50 border-blue-200' },
    in_progress: { label: 'Đang học', color: 'bg-green-50 border-green-200' },
    completed: { label: 'Xong', color: 'bg-gray-50 border-gray-200' },
    cancelled: { label: 'Huỷ', color: 'bg-red-50 border-red-200' },
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl text-[#1C2B4A]">Lịch học</h1>
          <p className="text-sm text-[#1C2B4A]/50 mt-1">
            Tuần {format(weekStart, 'dd/MM')} – {format(weekEnd, 'dd/MM/yyyy')}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-1">
            <Link href={`/admin/schedule?week=${weekOffset - 1}`}>
              <Button variant="outline" size="sm">← Tuần trước</Button>
            </Link>
            {weekOffset !== 0 && (
              <Link href="/admin/schedule">
                <Button variant="outline" size="sm">Hôm nay</Button>
              </Link>
            )}
            <Link href={`/admin/schedule?week=${weekOffset + 1}`}>
              <Button variant="outline" size="sm">Tuần sau →</Button>
            </Link>
          </div>
          <Button asChild className="bg-[#1C2B4A] text-[#F6F1EA] hover:bg-[#1C2B4A]/90">
            <Link href="/admin/sessions/new">
              <Plus className="w-4 h-4 mr-2" />
              Tạo buổi học
            </Link>
          </Button>
        </div>
      </div>

      {/* 7-day grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {days.map(day => {
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          return (
            <div key={day.toISOString()} className={`text-center pb-2 border-b ${isToday ? 'border-[#1C2B4A]' : 'border-[#1C2B4A]/15'}`}>
              <p className={`text-xs font-medium uppercase tracking-wider ${isToday ? 'text-[#1C2B4A]' : 'text-[#1C2B4A]/40'}`}>
                {format(day, 'EEE', { locale: vi })}
              </p>
              <p className={`text-lg font-heading ${isToday ? 'text-[#1C2B4A] font-semibold' : 'text-[#1C2B4A]/70'}`}>
                {format(day, 'd')}
              </p>
            </div>
          )
        })}

        {/* Morning sessions */}
        {days.map(day => {
          const session = getSession(day, 'morning')
          const cap = CAPACITY.MORNING_MAX
          const approved = session?.registrations.filter(r => r.status === 'approved').length ?? 0
          const pending = session?.registrations.filter(r => r.status === 'pending').length ?? 0
          const isFull = approved >= cap
          const isLow = !session || approved < CAPACITY.MORNING_MIN

          return (
            <div key={`morning-${day.toISOString()}`} className="min-h-[100px]">
              {session ? (
                <Link href={`/staff/registrations?sessionId=${session.id}`}>
                  <div className={`rounded-xl border p-2.5 h-full hover:shadow-sm transition-shadow cursor-pointer ${STATUS_CONFIG[session.status]?.color ?? 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-1 mb-2">
                      <Clock className="w-3 h-3 text-[#1C2B4A]/50" />
                      <span className="text-xs text-[#1C2B4A]/60">5:30–7:30</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span className={`text-sm font-semibold ${isFull ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-[#1C2B4A]'}`}>
                        {approved}/{cap}
                      </span>
                    </div>
                    {pending > 0 && (
                      <p className="text-xs text-[#C8A84B] mt-1">{pending} chờ duyệt</p>
                    )}
                    {session.status === 'cancelled' && (
                      <p className="text-xs text-red-500 mt-1">Đã huỷ</p>
                    )}
                  </div>
                </Link>
              ) : (
                <Link href={`/admin/sessions/new?date=${format(day, 'yyyy-MM-dd')}&slot=morning`}>
                  <div className="rounded-xl border border-dashed border-[#1C2B4A]/20 p-2.5 h-full flex flex-col items-center justify-center hover:border-[#1C2B4A]/40 hover:bg-[#F6F1EA]/50 transition-all cursor-pointer text-[#1C2B4A]/30">
                    <p className="text-xs">5:30 sáng</p>
                    <Plus className="w-3 h-3 mt-1" />
                  </div>
                </Link>
              )}
            </div>
          )
        })}

        {/* Evening sessions */}
        {days.map(day => {
          const session = getSession(day, 'evening')
          const cap = CAPACITY.EVENING_MAX
          const approved = session?.registrations.filter(r => r.status === 'approved').length ?? 0
          const pending = session?.registrations.filter(r => r.status === 'pending').length ?? 0
          const isFull = approved >= cap
          const isLow = !session || approved < CAPACITY.EVENING_MIN

          return (
            <div key={`evening-${day.toISOString()}`} className="min-h-[100px]">
              {session ? (
                <Link href={`/staff/registrations?sessionId=${session.id}`}>
                  <div className={`rounded-xl border p-2.5 h-full hover:shadow-sm transition-shadow cursor-pointer ${STATUS_CONFIG[session.status]?.color ?? 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-1 mb-2">
                      <Clock className="w-3 h-3 text-[#1C2B4A]/50" />
                      <span className="text-xs text-[#1C2B4A]/60">18:00–20:00</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span className={`text-sm font-semibold ${isFull ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-[#1C2B4A]'}`}>
                        {approved}/{cap}
                      </span>
                    </div>
                    {pending > 0 && (
                      <p className="text-xs text-[#C8A84B] mt-1">{pending} chờ duyệt</p>
                    )}
                    {session.status === 'cancelled' && (
                      <p className="text-xs text-red-500 mt-1">Đã huỷ</p>
                    )}
                  </div>
                </Link>
              ) : (
                <Link href={`/admin/sessions/new?date=${format(day, 'yyyy-MM-dd')}&slot=evening`}>
                  <div className="rounded-xl border border-dashed border-[#1C2B4A]/20 p-2.5 h-full flex flex-col items-center justify-center hover:border-[#1C2B4A]/40 hover:bg-[#F6F1EA]/50 transition-all cursor-pointer text-[#1C2B4A]/30">
                    <p className="text-xs">18:00 chiều</p>
                    <Plus className="w-3 h-3 mt-1" />
                  </div>
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-6 text-xs text-[#1C2B4A]/50">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> Ít học viên</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span> Đầy chỗ</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#C8A84B] inline-block"></span> Chờ duyệt</span>
      </div>
    </div>
  )
}
