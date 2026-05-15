import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  CheckSquare, Users, Calendar, Video, BarChart2, ArrowRight, Sunrise, Sunset, Zap,
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import { StatCard } from '@/components/ui/StatCard'
import { StarField } from '@/components/brand/StarField'
import { Stagger } from '@/components/motion/Stagger'

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
      include: { registrations: { where: { status: 'approved' }, include: { student: { select: { user: { select: { fullName: true } } } } } } },
      orderBy: { timeSlot: 'asc' },
    }),
    prisma.classSession.findMany({
      where: { date: { gte: tomorrow, lt: weekFromNow }, status: 'scheduled' },
      orderBy: { date: 'asc' },
      take: 5,
      include: { registrations: { where: { status: 'approved' }, select: { id: true } } },
    }),
    prisma.sessionRegistration.findMany({
      where: { status: 'pending' },
      orderBy: { registeredAt: 'desc' },
      take: 5,
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        session: { select: { date: true, timeSlot: true } },
      },
    }),
  ])

  return (
    <div className="min-h-screen pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl motion-sway" style={{ background: 'var(--hero-overlay-1)' }} />
        <div className="absolute bottom-0 left-1/4 w-60 h-60 rounded-full translate-y-1/2 blur-3xl motion-sway" style={{ background: 'var(--hero-overlay-2)', animationDelay: '-6s' }} />
        <StarField density={18} maxSize={2} className="text-accent/50" />
        <div className="relative max-w-6xl mx-auto">
          <p className="eyebrow opacity-65 mb-2">Trợ lý · Poolane</p>
          <h1 className="lqg-headline">Xin chào, {user.fullName}</h1>
          <p className="text-sm opacity-75 mt-3">Duyệt đăng ký, theo dõi học viên, hỗ trợ lớp học hàng ngày.</p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-6xl mx-auto space-y-5 relative z-10">
        {/* Stats */}
        <Stagger step={0.1} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/staff/registrations">
            <StatCard label="Đăng ký chờ duyệt" value={pending} icon={CheckSquare} tone={pending > 0 ? 'accent' : 'surface'} />
          </Link>
          <Link href="/staff/students?status=prospect">
            <StatCard label="Tiềm năng" value={prospects} icon={Users} />
          </Link>
          <Link href="/admin/schedule">
            <StatCard label="Buổi hôm nay" value={todaySessions.length} icon={Calendar} tone="dark" />
          </Link>
        </Stagger>

        {/* Today sessions */}
        {todaySessions.length > 0 && (
          <div className="rounded-card-xl bg-ink text-paper p-6 sm:p-7 relative overflow-hidden shadow-soft">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-accent" strokeWidth={1.75} />
                <p className="eyebrow text-paper/55">Buổi học hôm nay · {todaySessions.length}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {todaySessions.map(s => (
                  <Link
                    key={s.id}
                    href={`/admin/schedule/sessions/${s.id}`}
                    className="group block rounded-card bg-paper/8 ring-1 ring-paper/15 p-4 hover:bg-paper/12 transition"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {s.timeSlot === 'morning'
                        ? <Sunrise className="h-4 w-4 text-accent" strokeWidth={1.75} />
                        : <Sunset className="h-4 w-4 text-accent" strokeWidth={1.75} />}
                      <p className="lqg-headline text-lg leading-none">
                        {s.timeSlot === 'morning' ? '5:30 – 7:30' : '18:00 – 20:00'}
                      </p>
                    </div>
                    <p className="text-xs text-paper/65 mb-2">{s.registrations.length}/{s.capacity} đã duyệt</p>
                    <div className="space-y-0.5">
                      {s.registrations.slice(0, 3).map(r => (
                        <p key={r.id} className="text-xs text-paper/80 truncate">• {r.student.user.fullName}</p>
                      ))}
                      {s.registrations.length > 3 && (
                        <p className="text-xs text-paper/45 mt-1">+{s.registrations.length - 3} khác</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {/* Pending */}
          <div className="glass-card glass-card-hover overflow-hidden">
            <div className="px-5 py-4 border-b border-foreground/8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-accent" strokeWidth={1.75} />
                <p className="eyebrow text-foreground/55">Đăng ký mới</p>
              </div>
              <Link href="/staff/registrations" className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1">
                Tất cả <ArrowRight className="h-3 w-3" strokeWidth={2.25} />
              </Link>
            </div>
            {recentRegistrations.length === 0 ? (
              <div className="p-8 text-center text-foreground/45">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
                <p className="text-sm">Không có đăng ký mới</p>
              </div>
            ) : (
              <div className="divide-y divide-foreground/5">
                {recentRegistrations.map(r => (
                  <Link
                    key={r.id}
                    href={`/admin/schedule/sessions/${r.sessionId}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-paper-tint/30 transition group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.student.user.fullName}</p>
                      <p className="text-xs text-foreground/55 mt-0.5">
                        {format(r.session.date, 'EEE dd/MM', { locale: vi })} · {r.session.timeSlot === 'morning' ? 'sáng' : 'chiều'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-foreground/30 group-hover:translate-x-0.5 group-hover:text-accent transition" strokeWidth={2.25} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="glass-card glass-card-hover overflow-hidden">
            <div className="px-5 py-4 border-b border-foreground/8 flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <p className="eyebrow text-foreground/55">Thao tác nhanh</p>
            </div>
            <div className="p-3 space-y-1.5">
              <ActionLink href="/staff/registrations" icon={CheckSquare} label="Duyệt đăng ký" badge={pending > 0 ? pending : undefined} primary={pending > 0} />
              <ActionLink href="/staff/students" icon={Users} label="Xem học viên" />
              <ActionLink href="/staff/videos" icon={Video} label="Gửi video bơi" />
              <ActionLink href="/staff/stats" icon={BarChart2} label="Thống kê giảng dạy" />
            </div>
          </div>
        </div>

        {/* Upcoming sessions */}
        {upcomingSessions.length > 0 && (
          <div className="glass-card glass-card-hover overflow-hidden">
            <div className="px-5 py-4 border-b border-foreground/8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" strokeWidth={1.75} />
                <p className="eyebrow text-foreground/55">Tuần này tiếp theo</p>
              </div>
              <Link href="/admin/schedule" className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1">
                Lịch tuần <ArrowRight className="h-3 w-3" strokeWidth={2.25} />
              </Link>
            </div>
            <div className="grid grid-cols-5 divide-x divide-foreground/5">
              {upcomingSessions.map(s => (
                <Link
                  key={s.id}
                  href={`/admin/schedule/sessions/${s.id}`}
                  className="px-3 py-4 text-center hover:bg-paper-tint/30 transition"
                >
                  <p className="text-[10px] tracking-widest uppercase text-foreground/45">{format(s.date, 'EEE', { locale: vi })}</p>
                  <p className="lqg-headline text-2xl text-foreground mt-0.5">{format(s.date, 'dd/MM')}</p>
                  <p className="text-xs text-foreground/55 mt-1 inline-flex items-center gap-1">
                    {s.timeSlot === 'morning'
                      ? <Sunrise className="h-3 w-3 text-accent" strokeWidth={1.75} />
                      : <Sunset className="h-3 w-3 text-accent" strokeWidth={1.75} />}
                    {s.registrations.length} HV
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ActionLink({
  href, icon: Icon, label, badge, primary,
}: {
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  badge?: number
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-card transition ${
        primary ? 'bg-ink text-paper hover:bg-foreground/90 shadow-soft' : 'hover:bg-paper-tint/50'
      }`}
    >
      <Icon className="h-4 w-4 text-accent shrink-0" strokeWidth={1.75} />
      <span className={`text-sm font-medium flex-1 ${primary ? 'text-paper' : 'text-foreground'}`}>{label}</span>
      {badge !== undefined && (
        <span className="bg-accent text-ink text-xs font-bold rounded-pill min-w-[20px] h-5 px-1.5 grid place-items-center">
          {badge}
        </span>
      )}
      <ArrowRight className={`h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform ${primary ? 'text-paper/60' : 'text-foreground/30'}`} strokeWidth={2.25} />
    </Link>
  )
}
