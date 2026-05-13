import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, BookOpen, AlertTriangle, TrendingUp } from 'lucide-react'

export default async function AdminDashboard() {
  const user = await requireRole(['admin'])

  // Stats
  const [totalStudents, activeStudents, pendingPayments, recentStudents] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: { in: ['active', 'extension'] } } }),
    prisma.enrollment.count({
      where: {
        status: 'active',
        totalPaid: { lt: prisma.enrollment.fields.depositAmount }
      }
    }).catch(() => 0),
    prisma.student.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ])

  const stats = [
    { label: 'Tổng học viên',  value: totalStudents, icon: Users,        href: '/admin/students',              color: 'text-[#1C2B4A]' },
    { label: 'Đang học',       value: activeStudents, icon: BookOpen,     href: '/admin/students?status=active', color: 'text-[#5B8E9F]' },
    { label: 'Chờ đóng nốt',   value: 0,              icon: AlertTriangle, href: '/admin/students',             color: 'text-[#C8A84B]' },
    { label: 'Mới tuần này',   value: recentStudents.length, icon: TrendingUp, href: '/admin/students',        color: 'text-green-600' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <p className="text-sm text-[#1C2B4A]/50 mb-1">Xin chào,</p>
        <h1 className="font-heading text-4xl text-[#1C2B4A]">{user.fullName} ✦</h1>
        <p className="text-sm text-[#5B8E9F] mt-1 font-semibold tracking-wide uppercase">Admin · Poolane</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} className="block">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#1C2B4A]/8 hover:border-[#1C2B4A]/20 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#1C2B4A]/40 uppercase tracking-wider">{stat.label}</p>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className={`font-heading text-3xl ${stat.color}`}>{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

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
                  <div className="w-7 h-7 rounded-full bg-[#5B8E9F]/15 flex items-center justify-center text-xs font-bold text-[#5B8E9F] mr-3">
                    {s.user.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1C2B4A]">{s.user.fullName}</p>
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
            {[
              { label: '+ Thêm học viên mới', href: '/admin/students/new' },
              { label: '👥 Danh sách học viên', href: '/admin/students' },
              { label: '📋 Đăng ký vắng (sắp có)', href: '#' },
              { label: '💰 Thu học phí (sắp có)', href: '#' },
            ].map(action => (
              <Link
                key={action.label}
                href={action.href}
                className={`block px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  action.href === '#'
                    ? 'text-[#1C2B4A]/30 cursor-not-allowed'
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
