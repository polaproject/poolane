import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
    where: { studentId_courseId_sessionNumber: { studentId: student.id, courseId, sessionNumber: sn } }
  })

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <Link href="/student/self-assessment" className="inline-flex items-center gap-1 text-sm text-[#F6F1EA]/60 hover:text-[#F6F1EA] mb-3">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </Link>
        <h1 className="font-heading text-2xl text-[#F6F1EA]">Tự đánh giá — {course.name}</h1>
        <p className="text-[#F6F1EA]/50 text-xs mt-1">Buổi {sn} · Cho điểm trung thực để so sánh với giáo viên</p>
      </div>

      <div className="px-4 -mt-4 max-w-2xl mx-auto">
        <SelfAssessmentForm
          courseId={courseId}
          sessionNumber={sn}
          skills={skills.map(s => ({ key: s.key, label: s.label }))}
          initial={existing ? {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            scores: existing.scoresJson as Record<string, number>,
            notes: existing.notes ?? '',
          } : null}
        />
      </div>
    </div>
  )
}
