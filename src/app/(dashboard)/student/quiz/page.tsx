import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { HelpCircle, Clock, ArrowRight } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'

export default async function StudentQuizListPage() {
  const user = await requireRole(['student'])
  const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })

  const quizzes = await prisma.quiz.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { questions: true } },
      attempts: student ? { where: { studentId: student.id }, orderBy: { completedAt: 'desc' }, take: 1 } : false,
    },
  })

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-3xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2">Kiến thức · {quizzes.length} quiz</p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Quiz</h1>
          <p className="text-sm text-paper/65 mt-2">Kiểm tra hiểu biết về kỹ thuật, an toàn, sức khoẻ.</p>
        </div>
      </div>

      <div className="pl-5 pr-[5rem] sm:px-8 -mt-6 max-w-3xl mx-auto space-y-3 relative z-10">
        {quizzes.length === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <HelpCircle className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">Chưa có quiz</p>
            <p className="text-sm text-foreground/55">Lớp đang chuẩn bị bộ câu hỏi đầu tiên.</p>
          </div>
        ) : (
          quizzes.map(q => {
            const lastAttempt = q.attempts?.[0]
            const score = lastAttempt?.score ?? null
            const max = lastAttempt?.maxScore ?? q._count.questions
            const pct = score !== null && max > 0 ? Math.round((score / max) * 100) : null
            const scoreTone = pct === null ? 'text-foreground' : pct >= 80 ? 'text-success' : pct >= 60 ? 'text-warn' : 'text-danger'
            return (
              <Link
                key={q.id}
                href={`/student/quiz/${q.id}`}
                className="group block glass-card glass-card-hover p-5 hover:ring-accent/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="lqg-headline text-xl text-foreground leading-tight">{q.title}</h2>
                    {q.description && <p className="text-sm text-foreground/65 mt-1 line-clamp-2 leading-relaxed">{q.description}</p>}
                    <div className="flex items-center gap-2 mt-3 flex-wrap text-xs">
                      <Chip variant="mist">{q._count.questions} câu</Chip>
                      {q.timeLimitMinutes && (
                        <Chip variant="neutral">
                          <Clock className="h-3 w-3" strokeWidth={2.25} /> {q.timeLimitMinutes} phút
                        </Chip>
                      )}
                      {q.linkedSkill && (
                        <Chip variant="accent">#{q.linkedSkill}</Chip>
                      )}
                    </div>
                  </div>
                  {pct !== null ? (
                    <div className="text-right shrink-0">
                      <p className={`lqg-headline text-3xl leading-none ${scoreTone}`}>{pct}%</p>
                      <p className="text-xs text-foreground/55 mt-1">{score}/{max}</p>
                    </div>
                  ) : (
                    <ArrowRight className="h-5 w-5 text-foreground/40 group-hover:translate-x-0.5 group-hover:text-accent transition" strokeWidth={2.25} />
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
