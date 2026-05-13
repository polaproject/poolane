import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const submitSchema = z.object({
  answers: z.record(z.string(), z.string()), // questionId → answer
})

// ─── POST /api/quizzes/[id]/attempts — Nộp bài ─────────
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['student'])
    const { id: quizId } = await params

    const body = await request.json()
    const parsed = submitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } }, { status: 400 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId, isPublished: true },
      include: { questions: true }
    })
    if (!quiz) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Quiz không tồn tại' } }, { status: 404 })
    }

    const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })
    if (!student) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ HV' } }, { status: 404 })
    }

    // Chấm điểm
    let score = 0
    const detail: Array<{ questionId: string; correct: boolean; userAnswer: string; correctAnswer: string }> = []
    for (const q of quiz.questions) {
      const userAns = (parsed.data.answers[q.id] ?? '').trim().toLowerCase()
      const correctAns = q.correctAnswer.trim().toLowerCase()
      const correct = userAns === correctAns
      if (correct) score++
      detail.push({ questionId: q.id, correct, userAnswer: userAns, correctAnswer: q.correctAnswer })
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: student.id,
        score,
        maxScore: quiz.questions.length,
        answers: parsed.data.answers,
        completedAt: new Date(),
      }
    })

    log.info('quiz.attempt', `Quiz ${quizId} attempted by ${student.id}`, { score, max: quiz.questions.length })

    // Trả về kết quả + đáp án + giải thích
    return NextResponse.json({
      data: {
        attemptId: attempt.id,
        score,
        maxScore: quiz.questions.length,
        percentage: Math.round((score / quiz.questions.length) * 100),
        detail: detail.map(d => {
          const q = quiz.questions.find(qq => qq.id === d.questionId)!
          return {
            questionId: d.questionId,
            questionText: q.questionText,
            userAnswer: d.userAnswer,
            correctAnswer: q.correctAnswer,
            correct: d.correct,
            explanation: q.explanation,
          }
        }),
      },
      error: null
    }, { status: 201 })

  } catch (error) {
    await logError({ context: 'quiz.attempt', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
