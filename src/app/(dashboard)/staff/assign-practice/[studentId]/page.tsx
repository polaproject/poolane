import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import { AssignForm } from './AssignForm'

type Params = { params: Promise<{ studentId: string }> }

export default async function AssignPracticePage({ params }: Params) {
  await requireRole(['admin', 'staff'])
  const { studentId } = await params

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { fullName: true } } },
  })
  if (!student) notFound()

  const exercises = await prisma.exercise.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-3xl mx-auto">
          <Link
            href={`/staff/students/${studentId}`}
            className="inline-flex items-center gap-1.5 text-sm text-paper/65 hover:text-paper transition mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
            Hồ sơ
          </Link>
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5 font-mono normal-case tracking-[0.2em]">
            <Dumbbell className="h-3 w-3 text-accent" strokeWidth={1.75} /> {student.studentCode}
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl italic leading-tight">Gán bài tập</h1>
          <p className="text-sm text-paper/65 mt-2">Cho <strong className="text-paper">{student.user.fullName}</strong></p>
        </div>
      </div>

      <div className="-mt-6 max-w-3xl mx-auto relative z-10">
        <div className="glass-card glass-card-hover p-5 sm:p-6">
          <AssignForm
            studentId={studentId}
            exercises={exercises.map(e => ({
              id: e.id,
              title: e.title,
              skillTarget: e.skillTarget,
              difficulty: e.difficulty,
            }))}
          />
        </div>
      </div>
    </div>
  )
}
