import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, startOfWeek, addDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import { RegisterButton } from './register-button'
import { SESSION_TIMES } from '@/config/constants'

export default async function StudentSchedulePage() {
  const user = await requireRole(['admin', 'staff', 'student'])

  // Lấy student record
  const student = await prisma.student.findFirst({
    where: { userId: user.id },
    include: {
      poolTickets: { where: { isActive: true }, take: 1 },
      enrollments: {
        where: { status: { in: ['active', 'extension'] } },
        include: { course: true }
      }
    }
  })

  // Lịch tuần này
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 13) // 2 tuần

  const sessions = await prisma.classSession.findMany({
    where: {
      date: { gte: weekStart, lte: weekEnd },
      status: { not: 'cancelled' }
    },
    orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
    include: {
      registrations: {
        where: { status: { in: ['approved', 'pending'] } }
      }
    }
  })

  // Đăng ký của student hiện tại
  const myRegistrations = student ? await prisma.sessionRegistration.findMany({
    where: {
      studentId: student.id,
      status: { not: 'withdrawn' }
    }
  }) : []

  const myRegMap = new Map(myRegistrations.map(r => [r.sessionId, r]))

  const ticket = student?.poolTickets[0]
  const sessionsLeft = ticket ? ticket.maxSessions - ticket.sessionsUsed : null

  const STATUS_LABEL: Record<string, string> = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt ✓',
    rejected: 'Không được duyệt',
    waitlist: 'Chờ chỗ trống',
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Đăng ký học</h1>
        {sessionsLeft !== null ? (
          <p className="text-sm text-[#1C2B4A]/60 mt-1">Vé bơi còn: <strong className={sessionsLeft <= 2 ? 'text-red-500' : 'text-[#5B8E9F]'}>{sessionsLeft} buổi</strong></p>
        ) : (
          <p className="text-sm text-amber-600 mt-1">⚠️ Chưa có vé bơi</p>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 text-[#1C2B4A]/40">
          Chưa có lịch học nào được tạo cho 2 tuần tới
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const myReg = myRegMap.get(session.id)
            const approvedCount = session.registrations.filter(r => r.status === 'approved').length
            const isFull = approvedCount >= session.capacity
            const timeLabel = session.timeSlot === 'morning'
              ? `${SESSION_TIMES.MORNING.start}–${SESSION_TIMES.MORNING.end}`
              : `${SESSION_TIMES.EVENING.start}–${SESSION_TIMES.EVENING.end}`

            return (
              <div key={session.id} className="bg-white rounded-2xl border border-[#1C2B4A]/8 p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-[#1C2B4A]">
                      {format(session.date, 'EEEE, dd/MM', { locale: vi })}
                    </p>
                    <p className="text-sm text-[#1C2B4A]/60 mt-0.5">
                      {session.timeSlot === 'morning' ? '☀️' : '🌙'} {timeLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${isFull ? 'text-red-500' : 'text-[#1C2B4A]/60'}`}>
                      {approvedCount}/{session.capacity} chỗ
                    </p>
                    {isFull && <p className="text-xs text-amber-500">Hết chỗ</p>}
                  </div>
                </div>

                {session.notes && (
                  <p className="text-xs text-[#5B8E9F] mt-2 italic">{session.notes}</p>
                )}

                <div className="mt-3">
                  {myReg ? (
                    <div className={`text-center py-2 rounded-xl text-sm font-medium ${
                      myReg.status === 'approved'
                        ? 'bg-green-50 text-green-700'
                        : myReg.status === 'rejected'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}>
                      {STATUS_LABEL[myReg.status] ?? myReg.status}
                    </div>
                  ) : student ? (
                    <RegisterButton
                      sessionId={session.id}
                      studentId={student.id}
                      disabled={!ticket || sessionsLeft === 0}
                      disabledReason={!ticket ? 'Chưa có vé bơi' : sessionsLeft === 0 ? 'Hết vé bơi' : undefined}
                      enrollmentId={student.enrollments[0]?.courseId}
                    />
                  ) : (
                    <p className="text-sm text-center text-[#1C2B4A]/40">Chưa có hồ sơ học viên</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
