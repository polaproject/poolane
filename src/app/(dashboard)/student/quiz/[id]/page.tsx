import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, HelpCircle } from 'lucide-react'
import { QuizRunner } from './QuizRunner'

type Params = { params: Promise<{ id: string }> }

export default async function TakeQuizPage({ params }: Params) {
  await requireRole(['student'])
  const { id } = await params

  const quiz = await prisma.quiz.findUnique({
    where: { id, isPublished: true },
    include: { questions: { orderBy: { orderIndex: 'asc' } } },
  })

  if (!quiz) notFound()

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-2xl mx-auto">
          <Link
            href="/student/quiz"
            className="inline-flex items-center gap-1.5 text-sm text-paper/65 hover:text-paper transition mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
            Danh sách quiz
          </Link>
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
            <HelpCircle className="h-3 w-3 text-accent" strokeWidth={1.75} /> {quiz.questions.length} câu hỏi
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl italic leading-tight">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-sm text-paper/65 mt-2 max-w-lg leading-relaxed">{quiz.description}</p>
          )}
        </div>
      </div>

      <div className="-mt-6 max-w-2xl mx-auto relative z-10">
        <div className="glass-card glass-card-hover p-5 sm:p-6">
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
    </div>
  )
}
