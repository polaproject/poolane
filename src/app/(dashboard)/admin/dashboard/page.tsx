import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, BookOpen, AlertTriangle, TrendingUp, Calendar, DollarSign, Zap, Brain } from 'lucide-react'
import { POOL_TICKET, ABSENCE_ALERT_THRESHOLDS } from '@/config/constants'

export default async function AdminDashboard() {
  const user = await requireRole(['admin'])

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const redCutoff = new Date(now.getTime() - ABSENCE_ALERT_THRESHOLDS.RED_DAYS * 86400000)

  const [
    totalStudents, activeStudents, pendingRegistrations,
    monthRevenue, needFollowUp, recentStudents, todaySessions,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: { in: ['active', 'extension'] } } }),
    prisma.sessionRegistration.count({ where: { status: 'pending' } }),
    prisma.payment.aggregate({
      where: { recordedAt: { gte: monthStart }, isReversal: false, amount: { gt: 0 } },
      _sum: { amount: true }
    }),
    prisma.student.count({
      where: {
        status: { in: ['active', 'extension', 'enrolled'] },
        OR: [
          { lastAttendedAt: { lt: redCutoff } },
          { lastAttendedAt: null, createdAt: { lt: redCutoff } }
        ]
      }
    }),
    prisma.student.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.classSession.findMany({
      where: {
        date: { gte: new Date(now.setHours(0,0,0,0)), lte: new Date(now.setHours(23,59,59,999)) },
        status: { not: 'cancelled' }
      },
      include: { registrations: { where: { status: 'approved' } } }
    }),
  ])

  const stats = [
    { label: 'Tổng học viên',  value: totalStudents,  icon: Users,       href: '/admin/students',               color: '#1C2B4A', bg: 'rgba(28,43,74,0.06)' },
    { label: 'Đang học',       value: activeStudents,  icon: BookOpen,    href: '/admin/students?status=active', color: '#5B8E9F', bg: 'rgba(91,142,159,0.08)' },
    { label: 'Thu tháng này',  value: `${((monthRevenue._sum.amount ?? 0) / 1_000_000).toFixed(1)}M`, icon: DollarSign, href: '/admin/finance', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
    { label: 'HV mới (7 ngày)', value: recentStudents.length, icon: TrendingUp, href: '/admin/students', color: '#C8A84B', bg: 'rgba(200,168,75,0.08)' },
  ]

  const alerts = [
    pendingRegistrations > 0 && { label: `${pendingRegistrations} đăng ký chờ duyệt`, href: '/staff/registrations', type: 'warning' as const },
    needFollowUp > 0 && { label: `${needFollowUp} học viên vắng > ${ABSENCE_ALERT_THRESHOLDS.RED_DAYS} ngày`, href: '/admin/pulse', type: 'danger' as const },
  ].filter(Boolean) as Array<{ label: string; href: string; type: 'warning' | 'danger' }>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <p className="text-sm mb-1" style={{ color: 'rgba(28,43,74,0.45)' }}>Xin chào,</p>
        <h1 className="font-heading text-[2.6rem] leading-tight" style={{ color: '#1C2B4A' }}>
          {user.fullName} <span style={{ color: '#C8A84B' }}>✦</span>
        </h1>
        <p className="text-xs font-semibold tracking-widest uppercase mt-1" style={{ color: '#5B8E9F' }}>
          Admin · Poolane
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {alerts.map((alert, i) => (
            <Link key={i} href={alert.href}>
              <div className={`notif-card notif-${alert.type} group`}>
                <div className={`notif-icon-bg ${alert.type}`}>
                  <AlertTriangle className="w-4 h-4" style={{ color: alert.type === 'danger' ? '#DC2626' : '#B45309' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: '#1C2B4A' }}>{alert.label}</p>
                <span className="ml-auto text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#5B8E9F' }}>
                  Xem →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} className="block">
            <div className="card-stat p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(28,43,74,0.40)' }}>
                  {stat.label}
                </p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="font-heading text-3xl" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Today sessions */}
      {todaySessions.length > 0 && (
        <div
          className="p-6 mb-6 relative overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #1C2B4A 0%, #162340 100%)',
            boxShadow: '0 8px 32px rgba(28,43,74,0.22)',
          }}
        >
          {/* Decorative orbs */}
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 rounded-full pointer-events-none" style={{ background: 'rgba(200,168,75,0.07)' }} />

          <div className="flex items-center gap-2 mb-4 relative">
            <Calendar className="w-4 h-4" style={{ color: 'rgba(246,241,234,0.6)' }} />
            <h2 className="font-semibold text-sm" style={{ color: 'rgba(246,241,234,0.8)' }}>Buổi học hôm nay</h2>
          </div>
          <div className="flex gap-3 relative">
            {todaySessions.map(s => (
              <Link key={s.id} href={`/staff/registrations?sessionId=${s.id}`}>
                <div
                  className="px-4 py-3 rounded-xl transition-all hover:scale-[1.03] cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <p className="font-medium text-sm" style={{ color: '#F6F1EA' }}>
                    {s.timeSlot === 'morning' ? '☀️ 5:30' : '🌙 18:00'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(246,241,234,0.55)' }}>
                    {s.registrations.length}/{s.capacity} người
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Recent students */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(28,43,74,0.08)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
          <div className="px-5 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(28,43,74,0.07)' }}>
            <h2 className="font-semibold text-sm" style={{ color: '#1C2B4A' }}>Học viên mới (7 ngày)</h2>
            <Link href="/admin/students" className="text-xs hover:underline" style={{ color: '#5B8E9F' }}>Xem tất cả</Link>
          </div>
          <div>
            {recentStudents.length === 0 ? (
              <p className="px-5 py-4 text-sm" style={{ color: 'rgba(28,43,74,0.40)' }}>Chưa có học viên mới</p>
            ) : (
              recentStudents.map(s => (
                <Link key={s.id} href={`/admin/students/${s.id}`}
                  className="flex items-center px-5 py-3 transition-colors hover:bg-[#F6F1EA]/60"
                  style={{ borderBottom: '1px solid rgba(28,43,74,0.05)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0"
                    style={{ background: 'rgba(91,142,159,0.12)', color: '#5B8E9F' }}
                  >
                    {s.user.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1C2B4A' }}>{s.user.fullName}</p>
                    <p className="text-xs" style={{ color: 'rgba(28,43,74,0.40)' }}>{s.studentCode}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card-base p-5">
          <h2 className="font-semibold text-sm mb-4" style={{ color: '#1C2B4A' }}>Thao tác nhanh</h2>
          <div className="space-y-2">
            {[
              { label: '+ Thêm học viên', href: '/admin/students/new', primary: true },
              { label: '📅 Lịch học tuần này', href: '/admin/schedule', primary: false },
              { label: '💰 Tài chính', href: '/admin/finance', primary: false },
              { label: '⚡ Pulse Check', href: '/admin/pulse', primary: false },
              { label: '🤖 AI Dự Báo', href: '/admin/ai', primary: false },
            ].map(action => (
              <Link key={action.label} href={action.href} className={action.primary ? 'btn-pola-primary block px-4 py-2.5 text-sm text-center' : 'btn-pola-secondary block px-4 py-2.5 text-sm text-center'}>
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
