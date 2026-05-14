import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { CheckSquare, Users, Calendar, Video, BarChart2, ArrowRight } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { vi } from 'date-fns/locale'

export default async function StaffDashboard() {
  const user = await requireRole(['admin', 'staff'])

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = addDays(today, 1)
  const weekFromNow = addDays(today, 7)

  const [pending, prospects, todaySessions, upcomingSessions, recentRegistrations] = await Promise.all([
    prisma.sessionRegistration.count({ where: { status: 'pending' } }),
    prisma.student.count({ where: { status: 'prospect' } }),
    prisma.classSession.findMany({
      where: { date: { gte: today, lt: tomorrow }, status: { not: 'cancelled' } },
      include: {
        registrations: { where: { status: 'approved' }, include: { student: { select: { user: { select: { fullName: true } } } } } }
      },
      orderBy: { timeSlot: 'asc' },
    }),
    prisma.classSession.findMany({
      where: { date: { gte: tomorrow, lt: weekFromNow }, status: 'scheduled' },
      orderBy: { date: 'asc' },
      take: 5,
      include: { registrations: { where: { status: 'approved' }, select: { id: true } } }
    }),
    prisma.sessionRegistration.findMany({
      where: { status: 'pending' },
      orderBy: { registeredAt: 'desc' },
      take: 5,
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        session: { select: { date: true, timeSlot: true } }
      }
    }),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-7">
        <p className="text-sm text-[#1C2B4A]/50 mb-1">Xin chào,</p>
        <h1 className="font-heading text-4xl text-[#1C2B4A]">
          {user.fullName} <span className="text-[#C8A84B]">✦</span>
        </h1>
        <p className="text-xs font-semibold tracking-widest uppercase mt-1 text-[#5B8E9F]">Trợ lý · Poolane</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Đăng ký chờ duyệt" value={pending} href="/staff/registrations" urgent={pending > 0} />
        <StatCard label="Học viên tiềm năng" value={prospects} href="/staff/students?status=prospect" />
        <StatCard label="Buổi hôm nay" value={todaySessions.length} href="/admin/schedule" />
      </div>

      {/* Today sessions */}
      {todaySessions.length > 0 && (
        <div className="bg-[#1C2B4A] rounded-2xl p-5 mb-6 text-[#F6F1EA]">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Buổi học hôm nay
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {todaySessions.map(s => (
              <Link key={s.id} href={`/admin/schedule/sessions/${s.id}`}
                className="block bg-white/10 rounded-xl p-4 hover:bg-white/15 transition-colors">
                <p className="text-sm font-semibold mb-1">
                  {s.timeSlot === 'morning' ? '🌅 5:30 – 7:30 sáng' : '🌆 18:00 – 20:00 chiều'}
                </p>
                <p className="text-xs text-[#F6F1EA]/60 mb-2">
                  {s.registrations.length}/{s.capacity} học viên đã duyệt
                </p>
                <div className="space-y-0.5">
                  {s.registrations.slice(0, 3).map(r => (
                    <p key={r.id} className="text-xs text-[#F6F1EA]/80 truncate">
                      • {r.student.user.fullName}
                    </p>
                  ))}
                  {s.registrations.length > 3 && (
                    <p className="text-xs text-[#F6F1EA]/40 mt-1">+{s.registrations.length - 3} khác</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1C2B4A]/8 flex items-center justify-between">
            <h2 className="font-semibold text-[#1C2B4A] text-sm inline-flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#C8A84B]" />
              Đăng ký mới chờ duyệt
            </h2>
            <Link href="/staff/registrations" className="text-xs text-[#5B8E9F] hover:underline">
              Tất cả →
            </Link>
          </div>
          {recentRegistrations.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[#1C2B4A]/40 text-center">Không có đăng ký mới</p>
          ) : (
            <div className="divide-y divide-[#1C2B4A]/5">
              {recentRegistrations.map(r => (
                <Link key={r.id} href={`/admin/schedule/sessions/${r.sessionId}`}
                  className="px-5 py-3 flex items-center justify-between hover:bg-[#F6F1EA]/30">
                  <div>
                    <p className="text-sm font-semibold text-[#1C2B4A]">{r.student.user.fullName}</p>
                    <p className="text-xs text-[#1C2B4A]/50">
                      {format(r.session.date, 'EEE dd/MM', { locale: vi })} · {r.session.timeSlot === 'morning' ? 'sáng' : 'chiều'}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#1C2B4A]/30" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-5">
          <h2 className="font-semibold text-[#1C2B4A] text-sm mb-3">Thao tác nhanh</h2>
          <div className="space-y-2">
            <QuickAction href="/staff/registrations" icon={CheckSquare} label="Duyệt đăng ký" badge={pending > 0 ? pending : undefined} />
            <QuickAction href="/staff/students" icon={Users} label="Xem học viên" />
            <QuickAction href="/staff/videos" icon={Video} label="Gửi video bơi" />
            <QuickAction href="/staff/stats" icon={BarChart2} label="Thống kê giảng dạy" />
          </div>
        </div>
      </div>

      {/* Upcoming sessions preview */}
      {upcomingSessions.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1C2B4A]/8 flex items-center justify-between">
            <h2 className="font-semibold text-[#1C2B4A] text-sm">Buổi tiếp theo trong tuần</h2>
            <Link href="/admin/schedule" className="text-xs text-[#5B8E9F] hover:underline">Xem lịch tuần →</Link>
          </div>
          <div className="grid grid-cols-5 divide-x divide-[#1C2B4A]/5">
            {upcomingSessions.map(s => (
              <Link key={s.id} href={`/admin/schedule/sessions/${s.id}`}
                className="px-3 py-3 text-center hover:bg-[#F6F1EA]/30 transition-colors">
                <p className="text-xs text-[#1C2B4A]/50 uppercase tracking-wider">{format(s.date, 'EEE', { locale: vi })}</p>
                <p className="text-xl font-heading text-[#1C2B4A]">{format(s.date, 'dd/MM')}</p>
                <p className="text-xs text-[#1C2B4A]/40 mt-1">
                  {s.timeSlot === 'morning' ? '🌅' : '🌆'} · {s.registrations.length}HV
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, href, urgent }: { label: string; value: number; href: string; urgent?: boolean }) {
  return (
    <Link href={href}
      className={`block bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow ${
        urgent ? 'border-[#C8A84B]/40 bg-[#C8A84B]/5' : 'border-[#1C2B4A]/8'
      }`}>
      <p className="text-xs text-[#1C2B4A]/40 uppercase tracking-wider mb-2">{label}</p>
      <p className={`font-heading text-3xl ${urgent ? 'text-[#C8A84B]' : 'text-[#1C2B4A]'}`}>{value}</p>
    </Link>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function QuickAction({ href, icon: Icon, label, badge }: { href: string; icon: any; label: string; badge?: number }) {
  return (
    <Link href={href}
      className="flex items-center justify-between p-3 rounded-xl border border-[#1C2B4A]/8 hover:border-[#1C2B4A]/20 hover:bg-[#F6F1EA]/30 transition-colors">
      <span className="text-sm font-semibold text-[#1C2B4A] inline-flex items-center gap-2">
        <Icon className="w-4 h-4" /> {label}
      </span>
      {badge && (
        <span className="bg-[#C8A84B] text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  )
}
