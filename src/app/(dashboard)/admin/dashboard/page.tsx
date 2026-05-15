import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Users, BookOpen, AlertTriangle, TrendingUp, Calendar, DollarSign, ShoppingBag,
  Sunrise, Sunset, ArrowRight, UserPlus, FileText, Zap, BarChart2, Tags,
} from 'lucide-react'
import { ABSENCE_ALERT_THRESHOLDS } from '@/config/constants'
import { getDemoStudentIds } from '@/lib/demo-account'
import { StatCard } from '@/components/ui/StatCard'
import { StarField } from '@/components/brand/StarField'
import { Stagger } from '@/components/motion/Stagger'

export default async function AdminDashboard() {
  const user = await requireRole(['admin'])

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const redCutoff = new Date(now.getTime() - ABSENCE_ALERT_THRESHOLDS.RED_DAYS * 86400000)

  // Phase 15.2: Exclude demo accounts khỏi all dashboard stats (data integrity)
  const demoStudentIds = await getDemoStudentIds(prisma)

  // Phase 16.1: Tính sẵn cutoff để tránh Date.now() impure trong render scope
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const [
    totalStudents, activeStudents, pendingRegistrations,
    monthRevenue, needFollowUp, recentStudents, todaySessions,
  ] = await Promise.all([
    prisma.student.count({ where: { id: { notIn: demoStudentIds } } }),
    prisma.student.count({
      where: {
        status: { in: ['active', 'extension'] },
        id: { notIn: demoStudentIds },
      },
    }),
    prisma.sessionRegistration.count({
      where: {
        status: 'pending',
        studentId: { notIn: demoStudentIds },
      },
    }),
    prisma.payment.aggregate({
      where: {
        recordedAt: { gte: monthStart },
        isReversal: false,
        amount: { gt: 0 },
        studentId: { notIn: demoStudentIds },
      },
      _sum: { amount: true },
    }),
    prisma.student.count({
      where: {
        status: { in: ['active', 'extension', 'enrolled'] },
        id: { notIn: demoStudentIds },
        OR: [
          { lastAttendedAt: { lt: redCutoff } },
          { lastAttendedAt: null, createdAt: { lt: redCutoff } },
        ],
      },
    }),
    prisma.student.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        id: { notIn: demoStudentIds },
      },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.classSession.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        status: { not: 'cancelled' },
      },
      include: { registrations: { where: { status: 'approved' } } },
    }),
  ])

  const monthSum = (monthRevenue._sum.amount ?? 0)

  const alerts = [
    pendingRegistrations > 0 && {
      label: `${pendingRegistrations} đăng ký chờ duyệt`,
      href: '/staff/registrations',
      tone: 'warn' as const,
    },
    needFollowUp > 0 && {
      label: `${needFollowUp} học viên vắng > ${ABSENCE_ALERT_THRESHOLDS.RED_DAYS} ngày`,
      href: '/admin/pulse',
      tone: 'danger' as const,
    },
  ].filter(Boolean) as Array<{ label: string; href: string; tone: 'warn' | 'danger' }>

  return (
    <div className="min-h-screen pb-12">
      {/* Hero */}
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl motion-sway" style={{ background: 'var(--hero-overlay-1)' }} />
        <div className="absolute bottom-0 left-1/4 w-60 h-60 rounded-full translate-y-1/2 blur-3xl motion-sway" style={{ background: 'var(--hero-overlay-2)', animationDelay: '-6s' }} />
        <StarField density={18} maxSize={2} className="text-accent/50" />

        <div className="relative max-w-6xl mx-auto">
          <p className="eyebrow opacity-65 mb-2">Admin · Poolane</p>
          <h1 className="lqg-headline">
            Xin chào, {user.fullName}
          </h1>
          <p className="text-sm opacity-75 mt-3">
            Tổng quan vận hành — đăng ký, học viên, tài chính, lịch học.
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-6xl mx-auto space-y-5 relative z-10">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <Link
                key={i}
                href={alert.href}
                className={`group flex items-center gap-3 p-4 rounded-card-lg ring-1 backdrop-blur-sm transition hover:ring-opacity-60 ${
                  alert.tone === 'danger'
                    ? 'bg-danger/8 ring-danger/30 hover:ring-danger/50'
                    : 'bg-warn/8 ring-warn/30 hover:ring-warn/50'
                }`}
              >
                <div className={`grid place-items-center h-9 w-9 rounded-pill shrink-0 ${
                  alert.tone === 'danger' ? 'bg-danger/15' : 'bg-warn/15'
                }`}>
                  <AlertTriangle className={`h-4 w-4 ${alert.tone === 'danger' ? 'text-danger' : 'text-warn'}`} strokeWidth={1.75} />
                </div>
                <p className="text-sm font-medium text-foreground flex-1">{alert.label}</p>
                <ArrowRight className="h-4 w-4 text-foreground/40 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.25} />
              </Link>
            ))}
          </div>
        )}

        {/* Stats */}
        <Stagger step={0.08} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/students"><StatCard label="Tổng học viên" value={totalStudents} icon={Users} /></Link>
          <Link href="/admin/students?status=active"><StatCard label="Đang học" value={activeStudents} icon={BookOpen} /></Link>
          <Link href="/admin/finance"><StatCard label="Thu tháng này" value={`${(monthSum / 1_000_000).toFixed(1)}M`} unit="đ" icon={DollarSign} tone="dark" /></Link>
          <Link href="/admin/students"><StatCard label="HV mới (7 ngày)" value={recentStudents.length} icon={TrendingUp} tone="accent" /></Link>
        </Stagger>

        {/* Today sessions */}
        {todaySessions.length > 0 && (
          <div className="rounded-card-xl bg-ink text-paper p-6 sm:p-7 relative overflow-hidden shadow-soft">

<div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-accent" strokeWidth={1.75} />
                <p className="eyebrow text-paper/55">Buổi học hôm nay · {todaySessions.length}</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                {todaySessions.map(s => (
                  <Link
                    key={s.id}
                    href={`/admin/schedule/sessions/${s.id}`}
                    className="group flex items-center gap-3 px-4 py-3 rounded-card bg-paper/8 ring-1 ring-paper/15 hover:bg-paper/12 hover:scale-[1.02] transition-all"
                  >
                    <div className="grid place-items-center h-9 w-9 rounded-pill bg-accent/15 shrink-0">
                      {s.timeSlot === 'morning' ? (
                        <Sunrise className="h-4 w-4 text-accent" strokeWidth={1.75} />
                      ) : (
                        <Sunset className="h-4 w-4 text-accent" strokeWidth={1.75} />
                      )}
                    </div>
                    <div>
                      <p className="lqg-headline text-lg leading-none">
                        {s.timeSlot === 'morning' ? '5:30' : '18:00'}
                      </p>
                      <p className="text-xs text-paper/65 mt-1">{s.registrations.length}/{s.capacity} HV</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2-col: recent students + quick actions */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Recent students */}
          <div className="glass-card glass-card-hover overflow-hidden">
            <div className="px-5 py-4 border-b border-foreground/8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-accent" strokeWidth={1.75} />
                <p className="eyebrow text-foreground/55">HV mới · 7 ngày</p>
              </div>
              <Link href="/admin/students" className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1">
                Tất cả <ArrowRight className="h-3 w-3" strokeWidth={2.25} />
              </Link>
            </div>
            {recentStudents.length === 0 ? (
              <div className="p-8 text-center text-foreground/45">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
                <p className="text-sm">Chưa có học viên mới</p>
              </div>
            ) : (
              <div className="divide-y divide-foreground/5">
                {recentStudents.map(s => (
                  <Link
                    key={s.id}
                    href={`/admin/students/${s.id}`}
                    className="flex items-center px-5 py-3 hover:bg-paper-tint/40 transition group"
                  >
                    <div className="grid place-items-center h-9 w-9 rounded-pill bg-mist/15 text-mist lqg-headline text-sm shrink-0 mr-3">
                      {s.user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.user.fullName}</p>
                      <p className="text-xs text-foreground/45 font-mono">{s.studentCode}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-foreground/30 group-hover:translate-x-0.5 group-hover:text-accent transition" strokeWidth={2.25} />
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
              <ActionLink href="/admin/students/new" icon={UserPlus} label="Thêm học viên" primary />
              <ActionLink href="/admin/schedule" icon={Calendar} label="Lịch học tuần này" />
              <ActionLink href="/admin/finance" icon={DollarSign} label="Tài chính" />
              <ActionLink href="/admin/reports" icon={BarChart2} label="Báo cáo & Đối chiếu" />
              <ActionLink href="/admin/vouchers" icon={Tags} label="Mã giảm giá" />
              <ActionLink href="/admin/blog/new" icon={FileText} label="Viết bài blog" />
              <ActionLink href="/admin/pulse" icon={Zap} label="Pulse Check" />
              <ActionLink href="/admin/shop/orders" icon={ShoppingBag} label="Đơn hàng" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActionLink({
  href, icon: Icon, label, primary,
}: {
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-card transition ${
        primary
          ? 'bg-ink text-paper hover:bg-foreground/90 shadow-soft'
          : 'hover:bg-paper-tint/50'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${primary ? 'text-accent' : 'text-accent'}`} strokeWidth={1.75} />
      <span className={`text-sm font-medium flex-1 ${primary ? 'text-paper' : 'text-foreground'}`}>{label}</span>
      <ArrowRight className={`h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform ${primary ? 'text-paper/60' : 'text-foreground/30'}`} strokeWidth={2.25} />
    </Link>
  )
}
