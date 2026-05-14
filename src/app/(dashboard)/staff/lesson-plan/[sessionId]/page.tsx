import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
          course: { select: { id: true, code: true, name: true } }
        }
      }
    }
  })
  if (!session) notFound()

  const existing = await prisma.lessonPlan.findUnique({ where: { sessionId } })

  // Suggest course từ majority registrations
  const courseCounts = new Map<string, { id: string; code: string; name: string; count: number }>()
  for (const r of session.registrations) {
    if (r.course) {
      const cur = courseCounts.get(r.course.id) ?? { id: r.course.id, code: r.course.code, name: r.course.name, count: 0 }
      cur.count++
      courseCounts.set(r.course.id, cur)
    }
  }
  const courses = [...courseCounts.values()].sort((a, b) => b.count - a.count)

  // Lấy plan buổi liền trước cùng ca (auto-prefill nếu chưa có plan)
  let previousPlan: typeof existing = null
  if (!existing) {
    const prev = await prisma.classSession.findFirst({
      where: { date: { lt: session.date }, timeSlot: session.timeSlot, status: 'completed' },
      orderBy: { date: 'desc' },
      select: { id: true },
    })
    if (prev) {
      previousPlan = await prisma.lessonPlan.findUnique({ where: { sessionId: prev.id } })
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href={`/admin/schedule/sessions/${sessionId}`}
        className="inline-flex items-center gap-1 text-sm text-[#1C2B4A]/70 hover:text-[#1C2B4A] mb-6">
        <ArrowLeft className="w-4 h-4" /> Buổi học
      </Link>

      <h1 className="font-heading text-3xl text-[#1C2B4A] mb-1">Kế hoạch bài học</h1>
      <p className="text-sm text-[#1C2B4A]/50 mb-6">
        {format(session.date, 'EEEE, dd/MM/yyyy', { locale: vi })} ·
        {session.timeSlot === 'morning' ? ' Ca sáng 5:30 – 7:30' : ' Ca chiều 18:00 – 20:00'} ·
        {session.registrations.length} HV đã duyệt
      </p>

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
  )
}
