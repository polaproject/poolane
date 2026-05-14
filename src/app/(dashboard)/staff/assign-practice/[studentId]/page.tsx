import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AssignForm } from './AssignForm'

type Params = { params: Promise<{ studentId: string }> }

export default async function AssignPracticePage({ params }: Params) {
  await requireRole(['admin', 'staff'])
  const { studentId } = await params

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { fullName: true } } }
  })
  if (!student) notFound()

  const exercises = await prisma.exercise.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href={`/staff/students/${studentId}`}
        className="inline-flex items-center gap-1 text-sm text-[#1C2B4A]/70 hover:text-[#1C2B4A] mb-6">
        <ArrowLeft className="w-4 h-4" /> Hồ sơ {student.user.fullName}
      </Link>
      <h1 className="font-heading text-3xl text-[#1C2B4A] mb-1">Gán bài tập</h1>
      <p className="text-sm text-[#1C2B4A]/50 mb-6">
        Cho: <strong>{student.user.fullName}</strong> ({student.studentCode})
      </p>

      <AssignForm studentId={studentId} exercises={exercises.map(e => ({
        id: e.id,
        title: e.title,
        skillTarget: e.skillTarget,
        difficulty: e.difficulty,
      }))} />
    </div>
  )
}
