import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sunrise, Sunset, Users, AlertCircle, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CAPACITY } from '@/config/constants'
import { SessionActions } from './SessionActions'
import { RegistrationActionRow, type RegRowData } from './RegistrationActionRow'
import { Chip } from '@/components/ui/Chip'

type Params = { params: Promise<{ id: string }> }
type Variant = 'neutral' | 'accent' | 'mist' | 'success' | 'warn' | 'danger'

const SESSION_STATUS: Record<string, { label: string; variant: Variant }> = {
  scheduled:   { label: 'Đã lên lịch', variant: 'mist' },
  in_progress: { label: 'Đang diễn ra', variant: 'success' },
  completed:   { label: 'Hoàn tất',     variant: 'neutral' },
  cancelled:   { label: 'Đã huỷ',       variant: 'danger' },
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
                select: { sessionsUsed: true, maxSessions: true },
              },
              enrollments: {
                where: { status: { in: ['active', 'extension', 'completed'] } },
                select: { courseId: true, status: true },
              },
            },
          },
          course: { select: { name: true, code: true } },
        },
      },
      attendances: true,
    },
  })

  if (!session) notFound()

  const isMorning = session.timeSlot === 'morning'
  const cap = isMorning ? CAPACITY.MORNING_MAX : CAPACITY.EVENING_MAX
  const approved = session.registrations.filter(r => r.status === 'approved')
  const pending = session.registrations.filter(r => r.status === 'pending')
  const waitlist = session.registrations.filter(r => r.status === 'waitlist')
  const otherRegs = session.registrations.filter(r => ['rejected', 'withdrawn'].includes(r.status))
  const attendanceMap = new Map(session.attendances.map(a => [a.studentId, a.status]))
  const cfg = SESSION_STATUS[session.status] ?? SESSION_STATUS.scheduled

  // Fetch progress + assessment data per student in parallel
  const allStudentIds = session.registrations.map(r => r.studentId)
  const allCourseIds = session.registrations
    .map(r => r.courseId)
    .filter((c): c is string => c !== null)

  const [completedAttendances, latestAssessments] = await Promise.all([
    // Count attendance completed per student per course (tiến độ)
    allStudentIds.length > 0 && allCourseIds.length > 0
      ? prisma.attendance.groupBy({
          by: ['studentId', 'courseId'],
          where: {
            studentId: { in: allStudentIds },
            courseId: { in: allCourseIds },
            status: 'present',
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),

    // Latest assessment per student per course
    allStudentIds.length > 0
      ? prisma.assessment.findMany({
          where: { studentId: { in: allStudentIds } },
          orderBy: [{ studentId: 'asc' }, { sessionNumber: 'desc' }],
          include: { scores: true },
        })
      : Promise.resolve([]),
  ])

  // Map progress per (student, course)
  const progressMap = new Map<string, number>()
  for (const a of completedAttendances) {
    if (a.courseId) {
      progressMap.set(`${a.studentId}__${a.courseId}`, a._count._all)
    }
  }

  // Map latest assessment per student (first item per student per course due to ordering)
  const latestByStudent = new Map<string, { avg: number; weak: number }>()
  for (const a of latestAssessments) {
    const key = `${a.studentId}__${a.courseId}`
    if (latestByStudent.has(key)) continue // chỉ giữ assessment đầu tiên (sessionNumber cao nhất)
    if (a.scores.length === 0) continue
    const avg = a.scores.reduce((sum, s) => sum + s.score, 0) / a.scores.length
    const weak = a.scores.filter(s => s.score <= 2).length
    latestByStudent.set(key, { avg, weak })
  }

  type RegWithStudent = (typeof session.registrations)[number]

  /** Build display data cho mỗi registration */
  function buildRowData(reg: RegWithStudent): RegRowData {
    const ticket = reg.student.poolTickets[0]
    const sessionsLeft = ticket ? ticket.maxSessions - ticket.sessionsUsed : null

    // Tìm enrollment match với courseId của registration (hoặc enrollment đầu tiên nếu reg không có course)
    const matchedEnrollment = reg.courseId
      ? reg.student.enrollments.find(e => e.courseId === reg.courseId)
      : reg.student.enrollments[0]
    const enrollmentStatus = matchedEnrollment?.status ?? null

    // Tiến độ: số buổi completed của course đó (max 10 cho khoá chuẩn)
    let progressLabel: string | null = null
    if (reg.courseId) {
      const completed = progressMap.get(`${reg.studentId}__${reg.courseId}`) ?? 0
      progressLabel = `Buổi ${completed + 1}/10`
    }

    // Assessment metrics
    const assessmentData = reg.courseId
      ? latestByStudent.get(`${reg.studentId}__${reg.courseId}`)
      : null

    return {
      id: reg.id,
      status: reg.status,
      studentId: reg.student.id,
      studentCode: reg.student.studentCode,
      fullName: reg.student.user.fullName,
      phone: reg.student.user.phone,
      courseCode: reg.course?.code ?? null,
      sessionsLeft,
      progressLabel,
      avgScore: assessmentData?.avg ?? null,
      weakSkillCount: assessmentData?.weak ?? 0,
      enrollmentStatus,
      attendance: attendanceMap.get(reg.studentId) ?? null,
    }
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Hero */}
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-5xl mx-auto">
          <Link
            href="/admin/schedule"
            className="inline-flex items-center gap-1.5 text-sm text-paper/65 hover:text-paper transition mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
            Lịch tuần
          </Link>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
                {isMorning ? (
                  <>
                    <Sunrise className="h-3 w-3 text-accent" strokeWidth={2.25} /> 5:30 – 7:30 sáng
                  </>
                ) : (
                  <>
                    <Sunset className="h-3 w-3 text-accent" strokeWidth={2.25} /> 18:00 – 20:00 chiều
                  </>
                )}
              </p>
              <h1 className="font-heading text-3xl sm:text-4xl italic leading-tight">
                {format(session.date, 'EEEE, dd/MM/yyyy', { locale: vi })}
              </h1>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Chip variant={cfg.variant} active>
                  {cfg.label}
                </Chip>
                <Chip variant="mist">
                  <Users className="h-3 w-3" strokeWidth={2.25} /> {approved.length}/{cap} đã duyệt
                </Chip>
                {pending.length > 0 && (
                  <Chip variant="warn" active>
                    {pending.length} chờ duyệt
                  </Chip>
                )}
              </div>
              {session.cancelledReason && (
                <p className="text-sm text-danger mt-3 inline-flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" strokeWidth={2.25} /> Lý do huỷ: {session.cancelledReason}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/staff/lesson-plan/${session.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-pill ring-1 ring-paper/20 hover:bg-paper/8 transition"
              >
                <FileText className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} /> Kế hoạch
              </Link>
              <SessionActions sessionId={session.id} status={session.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-5xl mx-auto space-y-4 relative z-10">
        {/* Approved — ô bên trên (đã duyệt) */}
        <SectionCard
          eyebrow="Đã duyệt"
          title={approved.length === 0 ? 'Chưa có HV duyệt' : `${approved.length}/${cap} học viên`}
          tone="success"
        >
          {approved.length > 0 ? (
            approved.map(reg => (
              <RegistrationActionRow
                key={reg.id}
                reg={buildRowData(reg)}
                sessionId={session.id}
                showActions={false}
              />
            ))
          ) : (
            <div className="px-5 py-6 text-center text-sm text-foreground/55">
              Duyệt HV ở ô bên dưới để hiện vào đây
            </div>
          )}
        </SectionCard>

        {/* Pending — ô bên dưới (chờ duyệt) — Có button Duyệt/Từ chối trực tiếp */}
        {pending.length > 0 && (
          <SectionCard
            eyebrow="Chờ duyệt"
            title={`${pending.length} đăng ký — click ✓ duyệt hoặc ✗ từ chối`}
            tone="warn"
          >
            {pending.map(reg => (
              <RegistrationActionRow
                key={reg.id}
                reg={buildRowData(reg)}
                sessionId={session.id}
                showActions
              />
            ))}
          </SectionCard>
        )}

        {/* Waitlist */}
        {waitlist.length > 0 && (
          <SectionCard eyebrow="Danh sách chờ" title={`${waitlist.length} HV chờ slot`}>
            {waitlist.map(reg => (
              <RegistrationActionRow
                key={reg.id}
                reg={buildRowData(reg)}
                sessionId={session.id}
                showActions
              />
            ))}
          </SectionCard>
        )}

        {/* Other (rejected / withdrawn) */}
        {otherRegs.length > 0 && (
          <SectionCard eyebrow="Khác" title={`${otherRegs.length} đã từ chối hoặc rút`}>
            <div className="opacity-65">
              {otherRegs.map(reg => (
                <RegistrationActionRow
                  key={reg.id}
                  reg={buildRowData(reg)}
                  sessionId={session.id}
                  showActions={false}
                />
              ))}
            </div>
          </SectionCard>
        )}

        {/* Empty state */}
        {session.registrations.length === 0 && (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <Users className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">Chưa có học viên đăng ký</p>
            <p className="text-sm text-foreground/55">HV sẽ tự đăng ký qua trang lịch của họ.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────
// SectionCard
// ───────────────────────────────────────────────────────────────
function SectionCard({
  eyebrow,
  title,
  tone,
  children,
}: {
  eyebrow: string
  title: string
  tone?: 'warn' | 'success'
  children?: React.ReactNode
}) {
  const ringClass =
    tone === 'warn'
      ? 'ring-warn/30'
      : tone === 'success'
        ? 'ring-success/25'
        : 'ring-foreground/8'

  const headerClass =
    tone === 'warn'
      ? 'bg-warn/5 border-warn/20'
      : tone === 'success'
        ? 'bg-success/5 border-success/15'
        : 'bg-paper-tint/30 border-foreground/8'

  const eyebrowColor =
    tone === 'warn'
      ? 'text-warn'
      : tone === 'success'
        ? 'text-success'
        : 'text-foreground/55'

  return (
    <section
      className={`rounded-card-lg bg-[var(--surface)] shadow-soft ring-1 overflow-hidden ${ringClass}`}
    >
      <header className={`px-5 py-3.5 border-b ${headerClass}`}>
        <p className={`eyebrow ${eyebrowColor}`}>{eyebrow}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{title}</p>
      </header>
      <div className="divide-y divide-foreground/5">{children}</div>
    </section>
  )
}
