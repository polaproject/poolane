import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Sunrise, Sunset, Users, Phone, BookOpen, AlertCircle, FileText,
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CAPACITY } from '@/config/constants'
import { SessionActions } from './SessionActions'
import { Chip } from '@/components/ui/Chip'

type Params = { params: Promise<{ id: string }> }
type Variant = 'neutral' | 'accent' | 'mist' | 'success' | 'warn' | 'danger'

const SESSION_STATUS: Record<string, { label: string; variant: Variant }> = {
  scheduled:    { label: 'Đã lên lịch', variant: 'mist' },
  in_progress:  { label: 'Đang diễn ra', variant: 'success' },
  completed:    { label: 'Hoàn tất',     variant: 'neutral' },
  cancelled:    { label: 'Đã huỷ',       variant: 'danger' },
}

const REG_STATUS: Record<string, { label: string; variant: Variant }> = {
  pending:   { label: 'Chờ duyệt', variant: 'warn' },
  approved:  { label: 'Đã duyệt',  variant: 'success' },
  rejected:  { label: 'Từ chối',   variant: 'danger' },
  waitlist:  { label: 'Chờ slot',  variant: 'mist' },
  withdrawn: { label: 'Đã rút',    variant: 'neutral' },
}

const ATT_STATUS: Record<string, { label: string; variant: Variant }> = {
  present:  { label: 'Có mặt', variant: 'success' },
  absent:   { label: 'Vắng',   variant: 'danger' },
  walk_in:  { label: 'Walk-in', variant: 'mist' },
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
            },
          },
          course: { select: { name: true, code: true } },
        },
      },
      attendances: {
        include: { student: { select: { id: true, user: { select: { fullName: true } } } } },
      },
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

  return (
    <div className="min-h-screen bg-paper pb-12">
      {/* Hero */}
      <div className="bg-ink text-paper px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-mist/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
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
                {isMorning
                  ? <><Sunrise className="h-3 w-3 text-accent" strokeWidth={2.25} /> 5:30 – 7:30 sáng</>
                  : <><Sunset className="h-3 w-3 text-accent" strokeWidth={2.25} /> 18:00 – 20:00 chiều</>}
              </p>
              <h1 className="font-heading text-3xl sm:text-4xl italic leading-tight">
                {format(session.date, 'EEEE, dd/MM/yyyy', { locale: vi })}
              </h1>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Chip variant={cfg.variant} active>{cfg.label}</Chip>
                <Chip variant="mist"><Users className="h-3 w-3" strokeWidth={2.25} /> {approved.length}/{cap} đã duyệt</Chip>
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
        {/* Pending */}
        {pending.length > 0 && (
          <SectionCard
            eyebrow="Chờ duyệt"
            title={`${pending.length} đăng ký cần xử lý`}
            tone="warn"
          >
            {pending.map(reg => (
              <RegistrationRow key={reg.id} reg={reg} sessionId={session.id} showActions />
            ))}
          </SectionCard>
        )}

        {/* Approved */}
        <SectionCard
          eyebrow="Đã duyệt"
          title={approved.length === 0 ? 'Chưa có HV duyệt' : `${approved.length}/${cap} học viên`}
        >
          {approved.length > 0
            ? approved.map(reg => {
                const att = attendanceMap.get(reg.studentId)
                return <RegistrationRow key={reg.id} reg={reg} sessionId={session.id} attendance={att} />
              })
            : null}
        </SectionCard>

        {/* Waitlist */}
        {waitlist.length > 0 && (
          <SectionCard eyebrow="Danh sách chờ" title={`${waitlist.length} HV chờ slot`}>
            {waitlist.map(reg => (
              <RegistrationRow key={reg.id} reg={reg} sessionId={session.id} showActions />
            ))}
          </SectionCard>
        )}

        {/* Other */}
        {otherRegs.length > 0 && (
          <SectionCard eyebrow="Khác" title={`${otherRegs.length} đã từ chối hoặc rút`}>
            <div className="opacity-65">
              {otherRegs.map(reg => (
                <RegistrationRow key={reg.id} reg={reg} sessionId={session.id} />
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  )
}

function SectionCard({
  eyebrow, title, tone, children,
}: {
  eyebrow: string
  title: string
  tone?: 'warn'
  children?: React.ReactNode
}) {
  return (
    <section className={`rounded-card-lg bg-white shadow-soft ring-1 overflow-hidden ${
      tone === 'warn' ? 'ring-warn/30' : 'ring-ink/8'
    }`}>
      <header className={`px-5 py-3.5 border-b ${
        tone === 'warn' ? 'bg-warn/5 border-warn/20' : 'bg-paper-tint/30 border-ink/8'
      }`}>
        <p className={`eyebrow ${tone === 'warn' ? 'text-warn' : 'text-ink/55'}`}>{eyebrow}</p>
        <p className="text-sm font-medium text-ink mt-0.5">{title}</p>
      </header>
      <div className="divide-y divide-ink/5">
        {children}
      </div>
    </section>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RegistrationRow({ reg, sessionId, showActions, attendance }: any) {
  const ticket = reg.student.poolTickets[0]
  const sessionsLeft = ticket ? ticket.maxSessions - ticket.sessionsUsed : null
  const isLowTicket = sessionsLeft != null && sessionsLeft <= 2
  const regCfg = REG_STATUS[reg.status] ?? REG_STATUS.pending
  const attCfg = attendance ? ATT_STATUS[attendance as string] : null

  return (
    <div className="px-5 py-3.5 flex items-center gap-3">
      <div className="grid place-items-center h-9 w-9 rounded-pill bg-mist text-paper text-xs font-bold shrink-0">
        {reg.student.user.fullName.split(/\s+/).map((w: string) => w[0]).slice(-2).join('').toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/admin/students/${reg.student.id}`} className="text-sm font-medium text-ink hover:text-accent transition">
          {reg.student.user.fullName}
        </Link>
        <div className="flex items-center gap-3 text-xs text-ink/55 mt-0.5 flex-wrap">
          <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" strokeWidth={1.75} />{reg.student.user.phone}</span>
          <span className="font-mono">{reg.student.studentCode}</span>
          {reg.course && (
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-accent" strokeWidth={1.75} /> {reg.course.code}
            </span>
          )}
          {sessionsLeft != null && (
            <span className={isLowTicket ? 'text-danger font-medium' : ''}>
              Vé: {sessionsLeft} buổi
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {attCfg && <Chip variant={attCfg.variant} active className="text-[10px]">{attCfg.label}</Chip>}
        <Chip variant={regCfg.variant} active className="text-[10px]">{regCfg.label}</Chip>
        {showActions && (
          <Link
            href={`/staff/registrations?sessionId=${sessionId}`}
            className="text-xs font-medium text-accent hover:underline"
          >
            Xử lý →
          </Link>
        )}
      </div>
    </div>
  )
}
