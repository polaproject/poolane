import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, BookOpen, AlertTriangle, TrendingUp, Calendar, DollarSign, BarChart2, Bell } from 'lucide-react'
import { ABSENCE_ALERT_THRESHOLDS, POOL_TICKET } from '@/config/constants'

export default async function AdminDashboard() {
  const user = await requireRole(['admin'])

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const redCutoff = new Date(now.getTime() - ABSENCE_ALERT_THRESHOLDS.RED_DAYS * 86400000)

  const [
    totalStudents,
    activeStudents,
    todaySessions,
    pendingRegistrations,
    monthRevenue,
    needFollowUp,
    recentStudents,
    lowTickets,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: { in: ['active', 'extension'] } } }),
    prisma.classSession.findMany({
      where: {
        date: {
          gte: new Date(now.setHours(0, 0, 0, 0)),
          lte: new Date(now.setHours(23, 59, 59, 999)),
        },
        status: { not: 'cancelled' }
      },
      include: {
        registrations: { where: { status: 'approved' } }
      }
    }),
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
    prisma.poolTicket.count({
      where: { isActive: true, student: { status: { in: ['active', 'extension'] } } }
    }).then(async total => {
      const tickets = await prisma.poolTicket.findMany({ where: { isActive: true } })
      return tickets.filter(t => (t.maxSessions - t.sessionsUsed) <= POOL_TICKET.LOW_STOCK_ALERT).length
    }),
  ])

  const todayAttendance = todaySessions.reduce((sum, s) => sum + s.registrations.length, 0)

  const stats = [
    { label: 'Tổng học viên', value: totalStudents, icon: Users, href: '/admin/students', color: 'text-[#1C2B4A]' },
    { label: 'Đang học', value: activeStudents, icon: BookOpen, href: '/admin/students?status=active', color: 'text-[#5B8E9F]' },
    { label: 'Thu tháng này', value: `${(monthRevenue._sum.amount ?? 0).toLocaleString('vi-VN')}đ`, icon: DollarSign, href: '/admin/finance', color: 'text-green-600' },
    { label: 'Mới 7 ngày', value: recentStudents.length, icon: TrendingUp, href: '/admin/students', color: 'text-blue-600' },
  ]

  const alerts = [
    pendingRegistrations > 0 && {
      label: `${pendingRegistrations} đăng ký chờ duyệt`,
      href: '/staff/registrations',
      color: 'text-amber-600 bg-amber-50',
      urgent: true,
    },
    needFollowUp > 0 && {
      label: `${needFollowUp} học viên vắng > ${ABSENCE_ALERT_THRESHOLDS.RED_DAYS} ngày`,
      href: '/admin/pulse',
      color: 'text-red-600 bg-red-50',
      urgent: true,
    },
    lowTickets > 0 && {
      label: `${lowTickets} học viên sắp hết vé bơi`,
      href: '/admin/pulse',
      color: 'text-teal-600 bg-teal-50',
      urgent: false,
    },
  ].filter(Boolean) as Array<{ label: string; href: string; color: string; urgent: boolean }>

  const quickActions = [
    { label: '+ Thêm học viên', href: '/admin/students/new', primary: true },
    { label: '📅 Lịch học', href: '/admin/schedule', primary: false },
    { label: '💰 Tài chính', href: '/admin/finance', primary: false },
    { label: '📊 Pulse Check', href: '/admin/pulse', primary: false },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-[#1C2B4A]/50 mb-1">Xin chào,</p>
        <h1 className="font-heading text-4xl text-[#1C2B4A]">{user.fullName} ✦</h1>
        <p className="text-sm text-[#5B8E9F] mt-1 font-semibold tracking-wide uppercase">Admin · Poolane</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {alerts.map((alert, i) => (
            <Link key={i} href={alert.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${alert.color} font-medium text-sm hover:opacity-90 transition-opacity`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {alert.label}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} className="block">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#1C2B4A]/8 hover:border-[#1C2B4A]/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[#1C2B4A]/40 uppercase tracking-wider">{stat.label}</p>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className={`font-heading text-2xl ${stat.color}`}>{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Today sessions */}
      {todaySessions.length > 0 && (
        <div className="bg-[#1C2B4A] rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-[#F6F1EA]/60" />
            <h2 className="font-semibold text-[#F6F1EA] text-sm">Buổi học hôm nay</h2>
          </div>
          <div className="flex gap-3">
            {todaySessions.map(s => (
              <Link key={s.id} href={`/staff/registrations?sessionId=${s.id}`}>
                <div className="bg-white/10 rounded-xl px-4 py-3 hover:bg-white/20 transition-colors">
                  <p className="text-[#F6F1EA] font-medium text-sm">
                    {s.timeSlot === 'morning' ? '☀️ 5:30' : '🌙 18:00'}
                  </p>
                  <p className="text-[#F6F1EA]/60 text-xs mt-0.5">{s.registrations.length}/{s.capacity} người</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Recent students */}
        <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1C2B4A]/8 flex justify-between items-center">
            <h2 className="font-semibold text-[#1C2B4A] text-sm">Học viên mới (7 ngày)</h2>
            <Link href="/admin/students" className="text-xs text-[#5B8E9F] hover:underline">Xem tất cả</Link>
          </div>
          <div className="divide-y divide-[#1C2B4A]/5">
            {recentStudents.length === 0 ? (
              <p className="px-5 py-4 text-sm text-[#1C2B4A]/40">Chưa có học viên mới</p>
            ) : (
              recentStudents.map(s => (
                <Link key={s.id} href={`/admin/students/${s.id}`} className="flex items-center px-5 py-3 hover:bg-[#F6F1EA]/50">
                  <div className="w-7 h-7 rounded-full bg-[#5B8E9F]/15 flex items-center justify-center text-xs font-bold text-[#5B8E9F] mr-3 flex-shrink-0">
                    {s.user.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1C2B4A] truncate">{s.user.fullName}</p>
                    <p className="text-xs text-[#1C2B4A]/40">{s.studentCode}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 shadow-sm p-5">
          <h2 className="font-semibold text-[#1C2B4A] text-sm mb-4">Thao tác nhanh</h2>
          <div className="space-y-2">
            {quickActions.map(action => (
              <Link
                key={action.label}
                href={action.href}
                className={`block px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  action.primary
                    ? 'bg-[#1C2B4A] text-[#F6F1EA] hover:bg-[#1C2B4A]/90'
                    : 'bg-[#F6F1EA] text-[#1C2B4A] hover:bg-[#1C2B4A] hover:text-[#F6F1EA]'
                }`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
