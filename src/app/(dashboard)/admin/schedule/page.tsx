import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Users, Clock, AlertCircle, X as XIcon } from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks } from 'date-fns'
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
    where: { date: { gte: weekStart, lte: weekEnd } },
    orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
    include: {
      registrations: {
        where: { status: { in: ['approved', 'pending', 'waitlist'] } },
        include: {
          student: {
            select: {
              id: true,
              studentCode: true,
              user: { select: { fullName: true } }
            }
          },
          course: { select: { code: true } },
        },
        orderBy: { registeredAt: 'asc' },
      }
    }
  })

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  function getSession(date: Date, timeSlot: 'morning' | 'evening') {
    return sessions.find(s =>
      format(s.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
      s.timeSlot === timeSlot
    )
  }

  // Helper: avatar bubble từ tên (initials)
  function initials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  function renderSessionCard(session: NonNullable<ReturnType<typeof getSession>>, cap: number, slotLabel: string) {
    const approved = session.registrations.filter(r => r.status === 'approved')
    const pending = session.registrations.filter(r => r.status === 'pending')
    const isFull = approved.length >= cap
    const isLow = approved.length < (session.timeSlot === 'morning' ? CAPACITY.MORNING_MIN : CAPACITY.EVENING_MIN)
    const isCancelled = session.status === 'cancelled'

    return (
      <Link href={`/admin/schedule/sessions/${session.id}`} className="block group">
        <div className={`rounded-xl border p-3 hover:shadow-md transition-all min-h-[180px] flex flex-col ${
          isCancelled ? 'bg-red-50 border-red-200' :
          isFull ? 'bg-blue-50 border-blue-200' :
          isLow ? 'bg-amber-50 border-amber-200' :
          'bg-white border-[#1C2B4A]/10'
        }`}>
          {/* Time + count */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-xs text-[#1C2B4A]/60">
              <Clock className="w-3 h-3" />
              {slotLabel}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-[#1C2B4A]/40" />
              <span className={`text-xs font-semibold ${
                isFull ? 'text-blue-700' : isLow ? 'text-amber-700' : 'text-[#1C2B4A]'
              }`}>
                {approved.length}/{cap}
              </span>
            </div>
          </div>

          {/* Cancelled banner */}
          {isCancelled && (
            <div className="text-xs text-red-700 flex items-center gap-1 mb-2">
              <XIcon className="w-3 h-3" /> Đã huỷ
            </div>
          )}

          {/* Student list inline */}
          <div className="flex-1 space-y-1 min-h-0">
            {approved.length === 0 && pending.length === 0 ? (
              <p className="text-xs text-[#1C2B4A]/30 italic">Chưa có học viên</p>
            ) : (
              <>
                {approved.map(r => (
                  <div key={r.id} className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                      style={{ background: '#5B8E9F', color: '#fff' }}
                    >
                      {initials(r.student.user.fullName)}
                    </div>
                    <span className="text-xs text-[#1C2B4A] truncate flex-1">
                      {r.student.user.fullName}
                    </span>
                    {r.course && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-[#1C2B4A]/8 text-[#1C2B4A]/70 font-semibold">
                        {r.course.code}
                      </span>
                    )}
                  </div>
                ))}
                {pending.map(r => (
                  <div key={r.id} className="flex items-center gap-1.5 opacity-60">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 border border-dashed border-[#C8A84B] text-[#C8A84B]">
                      ?
                    </div>
                    <span className="text-xs text-[#1C2B4A]/70 truncate flex-1 italic">
                      {r.student.user.fullName}
                    </span>
                    <span className="text-[9px] text-[#C8A84B] font-semibold">CHỜ</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer hint */}
          {pending.length > 0 && (
            <div className="text-xs text-[#C8A84B] mt-2 pt-2 border-t border-[#1C2B4A]/8 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {pending.length} chờ duyệt
            </div>
          )}
        </div>
      </Link>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl text-[#1C2B4A]">Lịch học</h1>
          <p className="text-sm text-[#1C2B4A]/50 mt-1">
            Tuần {format(weekStart, 'dd/MM')} – {format(weekEnd, 'dd/MM/yyyy')}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
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
              <Plus className="w-4 h-4 mr-2" /> Tạo buổi học
            </Link>
          </Button>
        </div>
      </div>

      {/* 7-day grid */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {days.map(day => {
          const isToday = format(day, 'yyyy-MM-dd') === todayStr
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
      </div>

      {/* Slot label */}
      <div className="text-xs uppercase tracking-wider text-[#1C2B4A]/40 font-semibold mb-2">
        🌅 Ca sáng (5:30 – 7:30)
      </div>
      <div className="grid grid-cols-7 gap-2 mb-4">
        {days.map(day => {
          const session = getSession(day, 'morning')
          return (
            <div key={`morning-${day.toISOString()}`}>
              {session ? renderSessionCard(session, CAPACITY.MORNING_MAX, '5:30')
              : (
                <Link href={`/admin/sessions/new?date=${format(day, 'yyyy-MM-dd')}&slot=morning`}>
                  <div className="rounded-xl border border-dashed border-[#1C2B4A]/20 p-3 min-h-[180px] flex flex-col items-center justify-center hover:border-[#1C2B4A]/40 hover:bg-[#F6F1EA]/50 transition-all cursor-pointer text-[#1C2B4A]/30">
                    <Plus className="w-5 h-5 mb-1" />
                    <p className="text-xs">Tạo buổi</p>
                  </div>
                </Link>
              )}
            </div>
          )
        })}
      </div>

      <div className="text-xs uppercase tracking-wider text-[#1C2B4A]/40 font-semibold mb-2">
        🌆 Ca chiều (18:00 – 20:00)
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const session = getSession(day, 'evening')
          return (
            <div key={`evening-${day.toISOString()}`}>
              {session ? renderSessionCard(session, CAPACITY.EVENING_MAX, '18:00')
              : (
                <Link href={`/admin/sessions/new?date=${format(day, 'yyyy-MM-dd')}&slot=evening`}>
                  <div className="rounded-xl border border-dashed border-[#1C2B4A]/20 p-3 min-h-[180px] flex flex-col items-center justify-center hover:border-[#1C2B4A]/40 hover:bg-[#F6F1EA]/50 transition-all cursor-pointer text-[#1C2B4A]/30">
                    <Plus className="w-5 h-5 mb-1" />
                    <p className="text-xs">Tạo buổi</p>
                  </div>
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-6 text-xs text-[#1C2B4A]/50 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> Ít học viên</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span> Đủ chỗ</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#C8A84B] inline-block"></span> Có chờ duyệt</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span> Đã huỷ</span>
        <span className="flex items-center gap-1">·</span>
        <span>Click vào ô để xem chi tiết + duyệt</span>
      </div>
    </div>
  )
}
