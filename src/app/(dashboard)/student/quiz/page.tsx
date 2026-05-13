import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { HelpCircle, Clock } from 'lucide-react'

export default async function StudentQuizListPage() {
  const user = await requireRole(['student'])
  const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })

  const quizzes = await prisma.quiz.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { questions: true } },
      attempts: student ? { where: { studentId: student.id }, orderBy: { completedAt: 'desc' }, take: 1 } : false,
    }
  })

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <h1 className="font-heading text-2xl text-[#F6F1EA]">Quiz</h1>
        <p className="text-[#F6F1EA]/50 text-xs mt-1">Kiểm tra kiến thức của bạn 🎯</p>
      </div>

      <div className="px-4 -mt-4 max-w-2xl mx-auto space-y-3">
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <HelpCircle className="w-10 h-10 text-[#1C2B4A]/20 mx-auto mb-3" />
            <p className="text-sm text-[#1C2B4A]/50">Chưa có quiz nào</p>
          </div>
        ) : (
          quizzes.map(q => {
            const lastAttempt = q.attempts?.[0]
            const score = lastAttempt?.score ?? null
            const max = lastAttempt?.maxScore ?? q._count.questions
            const pct = score !== null && max > 0 ? Math.round((score / max) * 100) : null
            return (
              <Link key={q.id} href={`/student/quiz/${q.id}`}
                className="block bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-4 hover:border-[#1C2B4A]/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-[#1C2B4A] text-sm">{q.title}</h2>
                    {q.description && <p className="text-xs text-[#1C2B4A]/50 mt-0.5 line-clamp-2">{q.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#1C2B4A]/50">
                      <span>{q._count.questions} câu</span>
                      {q.timeLimitMinutes && (
                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {q.timeLimitMinutes} phút</span>
                      )}
                      {q.linkedSkill && <span className="text-[#5B8E9F]">#{q.linkedSkill}</span>}
                    </div>
                  </div>
                  {pct !== null && (
                    <div className="text-right ml-3">
                      <p className={`font-heading text-2xl ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {pct}%
                      </p>
                      <p className="text-xs text-[#1C2B4A]/40">{score}/{max}</p>
                    </div>
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
