import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Calendar, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import { format, isFuture, isPast, isToday } from 'date-fns'
import { vi } from 'date-fns/locale'

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending:   { label: 'Chờ duyệt',  className: 'bg-amber-50 text-amber-700 border-amber-200',   icon: <Clock className="w-3.5 h-3.5" /> },
  approved:  { label: 'Đã duyệt',   className: 'bg-green-50 text-green-700 border-green-200',  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected:  { label: 'Từ chối',    className: 'bg-red-50 text-red-700 border-red-200',         icon: <XCircle className="w-3.5 h-3.5" /> },
  waitlist:  { label: 'Chờ',        className: 'bg-blue-50 text-blue-700 border-blue-200',     icon: <Clock className="w-3.5 h-3.5" /> },
  withdrawn: { label: 'Đã rút',     className: 'bg-gray-100 text-gray-500 border-gray-200',     icon: <XCircle className="w-3.5 h-3.5" /> },
}

const TIME_SLOT_LABEL: Record<string, string> = {
  morning: '🌅 5:30–7:30 sáng',
  evening: '🌆 18:00–20:00 chiều',
}

export default async function MySchedulePage() {
  const user = await requireRole(['student'])

  const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })
  if (!student) {
    return <div className="p-6 text-center text-[#1C2B4A]/40">Không tìm thấy hồ sơ học viên</div>
  }

  // Đăng ký từ 30 ngày trước đến tương lai
  const since = new Date(Date.now() - 30 * 86400000)
  const registrations = await prisma.sessionRegistration.findMany({
    where: { studentId: student.id, registeredAt: { gte: since } },
    orderBy: { registeredAt: 'desc' },
    include: {
      session: { select: { id: true, date: true, timeSlot: true, status: true } },
    },
    take: 100,
  })

  // Tách thành upcoming / past
  const upcoming = registrations.filter(r => !isPast(r.session.date) || isToday(r.session.date))
  const past = registrations.filter(r => isPast(r.session.date) && !isToday(r.session.date))

  // Attendance để biết HV có đi không
  const attendance = await prisma.attendance.findMany({
    where: { studentId: student.id, markedAt: { gte: since } },
    select: { sessionId: true, status: true },
  })
  const attendanceMap = new Map(attendance.map(a => [a.sessionId, a.status]))

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <h1 className="font-heading text-2xl text-[#F6F1EA]">Lịch học của tôi</h1>
        <p className="text-[#F6F1EA]/50 text-xs mt-1">Buổi sắp tới và lịch sử 30 ngày</p>
      </div>

      <div className="px-4 -mt-4 max-w-2xl mx-auto space-y-4">
        {/* Upcoming */}
        <Section
          title="Sắp tới"
          icon={<Calendar className="w-4 h-4" />}
          empty="Bạn chưa đăng ký buổi nào sắp tới"
          emptyAction={
            <Link href="/student/schedule" className="text-xs font-semibold text-[#5B8E9F] hover:underline">
              → Đăng ký buổi học
            </Link>
          }
        >
          {upcoming.map(r => {
            const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending
            const sessionCancelled = r.session.status === 'cancelled'
            return (
              <RegRow key={r.id}
                date={r.session.date}
                timeSlot={r.session.timeSlot}
                status={cfg.label}
                statusClass={cfg.className}
                statusIcon={cfg.icon}
                cancelled={sessionCancelled}
                rejectedReason={r.rejectedReasonText ?? null}
              />
            )
          })}
        </Section>

        {/* Past */}
        <Section title="Đã qua" icon={<Calendar className="w-4 h-4 text-[#1C2B4A]/40" />} empty="Chưa có buổi nào trong 30 ngày qua">
          {past.map(r => {
            const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending
            const att = attendanceMap.get(r.session.id)
            return (
              <RegRow key={r.id}
                date={r.session.date}
                timeSlot={r.session.timeSlot}
                status={att === 'present' ? 'Đã đi học' : att === 'absent' ? 'Vắng' : cfg.label}
                statusClass={att === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : att === 'absent' ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : cfg.className}
                statusIcon={att === 'present' ? <CheckCircle2 className="w-3.5 h-3.5" /> : cfg.icon}
                past
              />
            )
          })}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, icon, children, empty, emptyAction }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
  empty: string; emptyAction?: React.ReactNode
}) {
  const hasChildren = Array.isArray(children) && children.length > 0
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 overflow-hidden">
      <div className="px-5 py-3 border-b border-[#1C2B4A]/8 flex items-center gap-2">
        {icon}
        <h2 className="font-semibold text-[#1C2B4A] text-sm">{title}</h2>
      </div>
      {hasChildren ? (
        <div className="divide-y divide-[#1C2B4A]/5">{children}</div>
      ) : (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-[#1C2B4A]/40">{empty}</p>
          {emptyAction && <div className="mt-2">{emptyAction}</div>}
        </div>
      )}
    </div>
  )
}

function RegRow({ date, timeSlot, status, statusClass, statusIcon, cancelled, past, rejectedReason }: {
  date: Date; timeSlot: string; status: string; statusClass: string; statusIcon: React.ReactNode
  cancelled?: boolean; past?: boolean; rejectedReason?: string | null
}) {
  return (
    <div className="px-5 py-3 flex items-center justify-between">
      <div className={past ? 'opacity-60' : ''}>
        <p className="text-sm font-semibold text-[#1C2B4A]">
          {format(date, 'EEEE, dd/MM/yyyy', { locale: vi })}
          {isToday(date) && <span className="ml-2 text-xs text-[#C8A84B] font-bold">HÔM NAY</span>}
        </p>
        <p className="text-xs text-[#1C2B4A]/50 mt-0.5">{TIME_SLOT_LABEL[timeSlot] ?? timeSlot}</p>
        {cancelled && (
          <p className="text-xs text-red-600 mt-1 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Buổi đã bị huỷ — vé đã hoàn lại
          </p>
        )}
        {rejectedReason && (
          <p className="text-xs text-red-600 mt-1">Lý do: {rejectedReason}</p>
        )}
      </div>
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${statusClass}`}>
        {statusIcon}
        {status}
      </span>
    </div>
  )
}
