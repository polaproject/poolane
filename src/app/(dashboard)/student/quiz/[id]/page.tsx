import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { QuizRunner } from './QuizRunner'

type Params = { params: Promise<{ id: string }> }

export default async function TakeQuizPage({ params }: Params) {
  await requireRole(['student'])
  const { id } = await params

  const quiz = await prisma.quiz.findUnique({
    where: { id, isPublished: true },
    include: { questions: { orderBy: { orderIndex: 'asc' } } }
  })

  if (!quiz) notFound()

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <Link href="/student/quiz" className="inline-flex items-center gap-1 text-sm text-[#F6F1EA]/60 hover:text-[#F6F1EA] mb-3">
          <ArrowLeft className="w-4 h-4" /> Danh sách quiz
        </Link>
        <h1 className="font-heading text-2xl text-[#F6F1EA]">{quiz.title}</h1>
        {quiz.description && <p className="text-[#F6F1EA]/60 text-sm mt-1">{quiz.description}</p>}
      </div>

      <div className="px-4 -mt-4 max-w-2xl mx-auto">
        <QuizRunner
          quizId={quiz.id}
          questions={quiz.questions.map(q => ({
            id: q.id,
            questionText: q.questionText,
            type: q.type,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options: (q.options as any) ?? [],
          }))}
        />
      </div>
    </div>
  )
}
