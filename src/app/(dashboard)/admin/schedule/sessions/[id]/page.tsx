import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Users, Calendar, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CAPACITY } from '@/config/constants'
import { SessionActions } from './SessionActions'

type Params = { params: Promise<{ id: string }> }

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-gray-50 text-gray-700 border-gray-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Đã lên lịch',
  in_progress: 'Đang diễn ra',
  completed: 'Hoàn tất',
  cancelled: 'Đã huỷ',
}

const REG_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  waitlist: 'Chờ slot',
  withdrawn: 'Đã rút',
}

const REG_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  waitlist: 'bg-blue-50 text-blue-700 border-blue-200',
  withdrawn: 'bg-gray-100 text-gray-500 border-gray-200',
}

export default async function SessionDetailPage({ params }: Params) {
  await requireRole(['admin', 'staff'])
  const { id } = await params

  const session = await prisma.classSession.findUnique({
    where: { id },
    include: {
      registrations: {
        orderBy: [{ status: 'asc' }, { registeredAt: 'asc' }],
        include: {
          student: {
            include: {
              user: { select: { fullName: true, phone: true } },
              poolTickets: {
                where: { isActive: true },
                orderBy: { purchasedAt: 'desc' },
                take: 1,
                select: { sessionsUsed: true, maxSessions: true }
              }
            }
          },
          course: { select: { name: true, code: true } }
        }
      },
      attendances: {
        include: {
          student: { select: { id: true, user: { select: { fullName: true } } } }
        }
      }
    }
  })

  if (!session) notFound()

  const cap = session.timeSlot === 'morning' ? CAPACITY.MORNING_MAX : CAPACITY.EVENING_MAX
  const approved = session.registrations.filter(r => r.status === 'approved')
  const pending = session.registrations.filter(r => r.status === 'pending')
  const waitlist = session.registrations.filter(r => r.status === 'waitlist')
  const otherRegs = session.registrations.filter(r => ['rejected', 'withdrawn'].includes(r.status))

  const attendanceMap = new Map(session.attendances.map(a => [a.studentId, a.status]))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link href="/admin/schedule" className="inline-flex items-center gap-1 text-sm text-[#1C2B4A]/70 hover:text-[#1C2B4A] mb-6">
        <ArrowLeft className="w-4 h-4" /> Quay lại lịch tuần
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 shadow-sm p-5 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-heading text-2xl text-[#1C2B4A]">
              {format(session.date, 'EEEE, dd/MM/yyyy', { locale: vi })}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-[#1C2B4A]/60 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {session.timeSlot === 'morning' ? '5:30 – 7:30 (Sáng)' : '18:00 – 20:00 (Chiều)'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="w-4 h-4" />
                {approved.length}/{cap} học viên đã duyệt
              </span>
              <span className={`px-2 py-0.5 rounded-full border text-xs ${STATUS_COLORS[session.status]}`}>
                {STATUS_LABELS[session.status]}
              </span>
            </div>
            {session.cancelledReason && (
              <p className="text-sm text-red-700 mt-2">
                Lý do huỷ: {session.cancelledReason}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/staff/lesson-plan/${session.id}`}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border border-[#1C2B4A]/15 text-[#1C2B4A] hover:bg-[#1C2B4A]/5">
              📋 Kế hoạch bài học
            </Link>
            <SessionActions sessionId={session.id} status={session.status} />
          </div>
        </div>
      </div>

      {/* Pending registrations — cần xử lý */}
      {pending.length > 0 && (
        <SectionCard
          title={`Chờ duyệt (${pending.length})`}
          subtitle="Bấm để duyệt hoặc từ chối"
          highlight="amber"
        >
          <div className="divide-y divide-[#1C2B4A]/5">
            {pending.map(reg => (
              <RegistrationRow key={reg.id} reg={reg} sessionId={session.id} showActions />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Approved students */}
      <SectionCard
        title={`Học viên đã duyệt (${approved.length}/${cap})`}
        subtitle={approved.length === 0 ? 'Chưa có học viên nào' : ''}
      >
        {approved.length > 0 && (
          <div className="divide-y divide-[#1C2B4A]/5">
            {approved.map(reg => {
              const att = attendanceMap.get(reg.studentId)
              return (
                <RegistrationRow
                  key={reg.id}
                  reg={reg}
                  sessionId={session.id}
                  attendance={att}
                />
              )
            })}
          </div>
        )}
      </SectionCard>

      {/* Waitlist */}
      {waitlist.length > 0 && (
        <SectionCard title={`Danh sách chờ (${waitlist.length})`}>
          <div className="divide-y divide-[#1C2B4A]/5">
            {waitlist.map(reg => (
              <RegistrationRow key={reg.id} reg={reg} sessionId={session.id} showActions />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Other (rejected/withdrawn) */}
      {otherRegs.length > 0 && (
        <SectionCard title={`Khác (${otherRegs.length})`} subtitle="Đã từ chối hoặc HV rút">
          <div className="divide-y divide-[#1C2B4A]/5 opacity-60">
            {otherRegs.map(reg => (
              <RegistrationRow key={reg.id} reg={reg} sessionId={session.id} />
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

function SectionCard({ title, subtitle, children, highlight }: {
  title: string
  subtitle?: string
  highlight?: 'amber' | 'red'
  children?: React.ReactNode
}) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm mb-4 overflow-hidden ${
      highlight === 'amber' ? 'border-amber-200' :
      highlight === 'red' ? 'border-red-200' :
      'border-[#1C2B4A]/8'
    }`}>
      <div className="px-5 py-3 border-b border-[#1C2B4A]/5 bg-[#F6F1EA]/30">
        <h2 className="font-semibold text-[#1C2B4A] text-sm">{title}</h2>
        {subtitle && <p className="text-xs text-[#1C2B4A]/50 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RegistrationRow({ reg, sessionId, showActions, attendance }: any) {
  const ticket = reg.student.poolTickets[0]
  const sessionsLeft = ticket ? ticket.maxSessions - ticket.sessionsUsed : null
  return (
    <div className="px-5 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-[#5B8E9F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {reg.student.user.fullName.split(/\s+/).map((w: string) => w[0]).slice(-2).join('').toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/admin/students/${reg.student.id}`} className="text-sm font-semibold text-[#1C2B4A] hover:underline">
          {reg.student.user.fullName}
        </Link>
        <div className="flex items-center gap-3 text-xs text-[#1C2B4A]/50 mt-0.5">
          <span className="inline-flex items-center gap-1">
            <Phone className="w-3 h-3" />{reg.student.user.phone}
          </span>
          <span>{reg.student.studentCode}</span>
          {reg.course && (
            <span className="px-1.5 py-0.5 rounded bg-[#1C2B4A]/8 font-semibold text-[#1C2B4A]/70">
              {reg.course.code}
            </span>
          )}
          {sessionsLeft != null && (
            <span className={sessionsLeft <= 2 ? 'text-red-600 font-semibold' : ''}>
              Vé: {sessionsLeft} buổi
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {attendance && (
          <span className={`px-2 py-0.5 text-xs rounded-full border ${
            attendance === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            attendance === 'absent' ? 'bg-orange-50 text-orange-700 border-orange-200' :
            'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {attendance === 'present' ? '✓ Có mặt' : attendance === 'absent' ? 'Vắng' : attendance}
          </span>
        )}
        <span className={`px-2 py-0.5 text-xs rounded-full border ${REG_STATUS_COLORS[reg.status]}`}>
          {REG_STATUS_LABELS[reg.status]}
        </span>
        {showActions && (
          <Link
            href={`/staff/registrations?sessionId=${sessionId}`}
            className="px-2 py-1 text-xs font-semibold text-[#1C2B4A] hover:underline"
          >
            Xử lý →
          </Link>
        )}
      </div>
    </div>
  )
}
