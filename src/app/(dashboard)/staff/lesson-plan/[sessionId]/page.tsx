import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Sunrise, Sunset } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { LessonPlanForm } from './LessonPlanForm'

type Params = { params: Promise<{ sessionId: string }> }

export default async function LessonPlanPage({ params }: Params) {
  await requireRole(['admin', 'staff'])
  const { sessionId } = await params

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      registrations: {
        where: { status: 'approved' },
        include: {
          student: { select: { user: { select: { fullName: true } } } },
          course: { select: { id: true, code: true, name: true } },
        },
      },
    },
  })
  if (!session) notFound()

  const existing = await prisma.lessonPlan.findUnique({ where: { sessionId } })

  const courseCounts = new Map<string, { id: string; code: string; name: string; count: number }>()
  for (const r of session.registrations) {
    if (r.course) {
      const cur = courseCounts.get(r.course.id) ?? { id: r.course.id, code: r.course.code, name: r.course.name, count: 0 }
      cur.count++
      courseCounts.set(r.course.id, cur)
    }
  }
  const courses = [...courseCounts.values()].sort((a, b) => b.count - a.count)

  let previousPlan: typeof existing = null
  if (!existing) {
    const prev = await prisma.classSession.findFirst({
      where: { date: { lt: session.date }, timeSlot: session.timeSlot, status: 'completed' },
      orderBy: { date: 'desc' },
      select: { id: true },
    })
    if (prev) previousPlan = await prisma.lessonPlan.findUnique({ where: { sessionId: prev.id } })
  }

  const isMorning = session.timeSlot === 'morning'

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-3xl mx-auto">
          <Link
            href={`/admin/schedule/sessions/${sessionId}`}
            className="inline-flex items-center gap-1.5 text-sm text-paper/65 hover:text-paper transition mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
            Buổi học
          </Link>
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-accent" strokeWidth={1.75} /> {session.registrations.length} HV duyệt
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl italic leading-tight">Kế hoạch bài học</h1>
          <p className="text-sm text-paper/65 mt-2 inline-flex items-center gap-2 flex-wrap">
            <span>{format(session.date, 'EEEE, dd/MM/yyyy', { locale: vi })}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              {isMorning
                ? <><Sunrise className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} /> 5:30 – 7:30</>
                : <><Sunset className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} /> 18:00 – 20:00</>}
            </span>
          </p>
        </div>
      </div>

      <div className="pl-5 pr-[5rem] sm:px-8 -mt-6 max-w-3xl mx-auto relative z-10">
        <div className="glass-card glass-card-hover p-5 sm:p-6">
          <LessonPlanForm
            sessionId={sessionId}
            defaultCourseId={courses[0]?.id ?? null}
            courses={courses}
            initial={existing ? {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              focusSkills: (existing.focusSkills as any) ?? [],
              warmupNotes: existing.warmupNotes ?? '',
              mainNotes: existing.mainNotes ?? '',
              cooldownNotes: existing.cooldownNotes ?? '',
              equipment: existing.equipment ?? '',
              courseId: existing.courseId ?? '',
            } : (previousPlan ? {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              focusSkills: (previousPlan.focusSkills as any) ?? [],
              warmupNotes: previousPlan.warmupNotes ?? '',
              mainNotes: previousPlan.mainNotes ?? '',
              cooldownNotes: previousPlan.cooldownNotes ?? '',
              equipment: previousPlan.equipment ?? '',
              courseId: previousPlan.courseId ?? '',
            } : null)}
            previousPlanExists={!!previousPlan && !existing}
          />
        </div>
      </div>
    </div>
  )
}
