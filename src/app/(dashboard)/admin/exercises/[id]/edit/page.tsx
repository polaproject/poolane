import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ExerciseForm } from '../../ExerciseForm'
import { PageHeader } from '@/components/ui/PageHeader'

type Params = { params: Promise<{ id: string }> }

export default async function EditExercisePage({ params }: Params) {
  await requireRole(['admin', 'staff'])
  const { id } = await params
  const ex = await prisma.exercise.findUnique({ where: { id } })
  if (!ex) notFound()

  return (
    <div className="ambient-bg min-h-screen">
      <div className="p-6 max-w-3xl mx-auto">
        <Link href="/admin/exercises" className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Thư viện bài tập
        </Link>
        <PageHeader
          eyebrow="Thư viện bài tập"
          title="Sửa bài tập"
          description={ex.title}
          display
          className="mb-8"
        />
        <ExerciseForm mode="edit" initial={{
          id: ex.id,
          title: ex.title,
          description: ex.description,
          skillTarget: ex.skillTarget,
          difficulty: ex.difficulty,
          videoUrl: ex.videoUrl ?? '',
          steps: Array.isArray(ex.stepsJson) ? (ex.stepsJson as string[]) : [],
          isPublished: ex.isPublished,
        }} />
      </div>
    </div>
  )
}
