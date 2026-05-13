import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Calendar, TrendingUp, Bell, ShoppingBag, ArrowRight, Ticket, BookOpen, Sparkles } from 'lucide-react'
import { format, isFuture, isToday } from 'date-fns'
import { vi } from 'date-fns/locale'

export default async function StudentDashboard() {
  const user = await requireRole(['student'])

  const student = await prisma.student.findFirst({
    where: { userId: user.id },
    include: {
      user: true,
      enrollments: {
        where: { status: { in: ['active', 'extension'] } },
        include: { course: { select: { code: true, name: true } } },
        take: 3,
      },
      poolTickets: {
        where: { isActive: true },
        orderBy: { purchasedAt: 'desc' },
        take: 1,
      },
    }
  })

  // Next approved session
  const nextSession = student ? await prisma.sessionRegistration.findFirst({
    where: {
      studentId: student.id,
      status: 'approved',
      session: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    },
    orderBy: { session: { date: 'asc' } },
    include: { session: { select: { date: true, timeSlot: true, status: true } } }
  }) : null

  // Unread notifications count
  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, readAt: null }
  })

  // Latest assessment score for badge
  const latestAssessment = student ? await prisma.assessment.findFirst({
    where: { studentId: student.id },
    orderBy: { assessmentDate: 'desc' },
    include: { scores: true }
  }) : null
  const avgScore = latestAssessment && latestAssessment.scores.length > 0
    ? (latestAssessment.scores.reduce((s, x) => s + x.score, 0) / latestAssessment.scores.length).toFixed(1)
    : null

  const ticket = student?.poolTickets[0]
  const sessionsLeft = ticket ? ticket.maxSessions - ticket.sessionsUsed : null
  const ticketProgress = ticket ? Math.min(100, (ticket.sessionsUsed / ticket.maxSessions) * 100) : 0

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 6) return 'Bơi sáng sớm cùng Poolane,'
    if (hour < 12) return 'Buổi sáng tốt lành,'
    if (hour < 17) return 'Buổi trưa vui vẻ,'
    if (hour < 21) return 'Buổi tối bình yên,'
    return 'Đêm muộn rồi,'
  })()

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      {/* Hero */}
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-[#C8A84B]/10 translate-y-1/4" />
        <div className="relative z-10">
          <p className="text-[#F6F1EA]/50 text-xs mb-1">{greeting}</p>
          <h1 className="font-heading text-3xl text-[#F6F1EA]">{user.fullName} 🌊</h1>
          {avgScore && (
            <p className="text-xs text-[#C8A84B] mt-2 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Điểm trung bình kỹ năng: <strong>{avgScore}/5</strong>
            </p>
          )}
        </div>
      </div>

      <div className="px-4 -mt-6 max-w-2xl mx-auto space-y-3">
        {/* Pool ticket */}
        <div className={`bg-white rounded-2xl p-5 shadow-sm border ${
          sessionsLeft !== null && sessionsLeft <= 2 ? 'border-red-200' : 'border-[#1C2B4A]/8'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#5B8E9F]" />
              <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/40 font-semibold">Vé bơi</p>
            </div>
            {sessionsLeft !== null && sessionsLeft <= 2 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">
                Sắp hết
              </span>
            )}
          </div>
          {ticket ? (
            <>
              <p className="font-heading text-4xl text-[#1C2B4A] mb-1">
                {sessionsLeft} <span className="text-base font-body text-[#1C2B4A]/40">buổi còn lại</span>
              </p>
              <div className="h-1.5 bg-[#1C2B4A]/8 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    ticketProgress > 80 ? 'bg-red-400' : ticketProgress > 60 ? 'bg-amber-400' : 'bg-[#5B8E9F]'
                  }`}
                  style={{ width: `${ticketProgress}%` }}
                />
              </div>
              <p className="text-xs text-[#1C2B4A]/40 mt-1.5">
                Đã dùng {ticket.sessionsUsed}/{ticket.maxSessions}
              </p>
            </>
          ) : (
            <>
              <p className="font-heading text-2xl text-[#1C2B4A]/40 mb-1">Chưa có vé</p>
              <p className="text-xs text-[#1C2B4A]/50">Liên hệ lớp để mua vé bơi</p>
            </>
          )}
        </div>

        {/* Next session */}
        <Link href="/student/my-schedule" className="block">
          <div className="bg-[#1C2B4A] rounded-2xl p-5 hover:bg-[#1C2B4A]/95 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wider text-[#F6F1EA]/40 font-semibold inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Buổi tiếp theo
              </p>
              <ArrowRight className="w-4 h-4 text-[#F6F1EA]/40" />
            </div>
            {nextSession ? (
              <>
                <p className="font-heading text-2xl text-[#F6F1EA]">
                  {format(nextSession.session.date, 'EEEE, dd/MM', { locale: vi })}
                  {isToday(nextSession.session.date) && <span className="ml-2 text-sm text-[#C8A84B]">HÔM NAY</span>}
                </p>
                <p className="text-sm text-[#F6F1EA]/60 mt-1">
                  {nextSession.session.timeSlot === 'morning' ? '🌅 5:30 – 7:30 sáng' : '🌆 18:00 – 20:00 chiều'}
                </p>
              </>
            ) : (
              <>
                <p className="font-heading text-xl text-[#F6F1EA]">Chưa có buổi sắp tới</p>
                <p className="text-sm text-[#F6F1EA]/50 mt-1">Đăng ký ngay ở tab Đăng ký buổi học</p>
              </>
            )}
          </div>
        </Link>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <QuickLink href="/student/schedule" icon={Calendar} label="Đăng ký buổi" color="#5B8E9F" />
          <QuickLink href="/student/progress" icon={TrendingUp} label="Tiến độ" color="#C8A84B" />
          <QuickLink
            href="/shared/notifications" icon={Bell} label="Thông báo" color="#1C2B4A"
            badge={unreadCount > 0 ? unreadCount : undefined}
          />
          <QuickLink href="/student/shop" icon={ShoppingBag} label="Cửa hàng" color="#5B8E9F" />
        </div>

        {/* Active courses */}
        {student && student.enrollments.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#1C2B4A]/8">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-[#C8A84B]" />
              <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/40 font-semibold">Khoá đang học</p>
            </div>
            <div className="space-y-2">
              {student.enrollments.map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-[#1C2B4A]/5 last:border-0">
                  <span className="text-sm font-semibold text-[#1C2B4A]">{e.course.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#5B8E9F]/15 text-[#5B8E9F] font-semibold">
                    {e.course.code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function QuickLink({ href, icon: Icon, label, color, badge }: {
  href: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  label: string
  color: string
  badge?: number
}) {
  return (
    <Link href={href}
      className="bg-white rounded-2xl p-4 shadow-sm border border-[#1C2B4A]/8 hover:shadow-md transition-shadow flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-sm font-semibold text-[#1C2B4A]">{label}</span>
      </div>
      {badge && (
        <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}
