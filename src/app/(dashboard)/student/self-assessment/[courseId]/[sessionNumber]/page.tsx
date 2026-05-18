import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import { COURSE_SKILLS } from '@/config/constants'
import { SelfAssessmentForm } from './SelfAssessmentForm'

type Params = { params: Promise<{ courseId: string; sessionNumber: string }> }

export default async function SelfAssessmentPage({ params }: Params) {
  const user = await requireRole(['student'])
  const { courseId, sessionNumber } = await params
  const sn = Number(sessionNumber)
  if (isNaN(sn)) notFound()

  const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })
  if (!student) notFound()

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, code: true, name: true } })
  if (!course) notFound()

  const skills = (COURSE_SKILLS as Record<string, ReadonlyArray<{ key: string; label: string }>>)[course.code] ?? []

  const existing = await prisma.selfAssessment.findUnique({
    where: { studentId_courseId_sessionNumber: { studentId: student.id, courseId, sessionNumber: sn } },
  })

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-2xl mx-auto">
          <Link
            href="/student/self-assessment"
            className="inline-flex items-center gap-1.5 text-sm text-paper/65 hover:text-paper transition mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
            Quay lại
          </Link>
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
            <ClipboardCheck className="h-3 w-3 text-accent" strokeWidth={1.75} /> Buổi {sn} · {course.name}
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl italic leading-tight">Tự đánh giá kỹ năng</h1>
          <p className="text-sm text-paper/65 mt-2 max-w-lg leading-relaxed">
            Cho điểm trung thực để so sánh với giáo viên — giúp bạn nhận ra điểm mù bản thân.
          </p>
        </div>
      </div>

      <div className="pl-5 pr-[5rem] sm:px-8 -mt-6 max-w-2xl mx-auto relative z-10">
        <div className="glass-card glass-card-hover p-5 sm:p-6">
          <SelfAssessmentForm
            courseId={courseId}
            sessionNumber={sn}
            skills={skills.map(s => ({ key: s.key, label: s.label }))}
            initial={existing ? {
               
              scores: existing.scoresJson as Record<string, number>,
              notes: existing.notes ?? '',
            } : null}
          />
        </div>
      </div>
    </div>
  )
}
