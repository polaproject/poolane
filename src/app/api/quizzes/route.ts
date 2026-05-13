import { NextRequest, NextResponse } from 'next/server'
import { requireRole, getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { z } from 'zod'

// ─── GET /api/quizzes — Danh sách quiz published ─────
export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { questions: true, attempts: true } }
      },
    })
    return NextResponse.json({ data: quizzes, error: null })
  } catch (error) {
    await logError({ context: 'quizzes.list', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Lỗi' } }, { status: 500 })
  }
}

const createQuizSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  courseId: z.string().uuid().optional().nullable(),
  linkedSkill: z.string().max(100).optional().nullable(),
  timeLimitMinutes: z.number().int().min(1).max(120).optional(),
  isPublished: z.boolean().default(false),
  questions: z.array(z.object({
    questionText: z.string().min(3),
    type: z.enum(['multiple_choice', 'true_false', 'short_answer']),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string(),
    explanation: z.string().optional(),
  })).min(1, { message: 'Cần ít nhất 1 câu hỏi' }),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const body = await request.json()
    const parsed = createQuizSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() } }, { status: 400 })
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        courseId: parsed.data.courseId ?? null,
        linkedSkill: parsed.data.linkedSkill ?? null,
        createdBy: user.id,
        isPublished: parsed.data.isPublished,
        timeLimitMinutes: parsed.data.timeLimitMinutes,
        questions: {
          create: parsed.data.questions.map((q, i) => ({
            questionText: q.questionText,
            type: q.type,
            options: q.options ?? [],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            orderIndex: i,
          }))
        }
      }
    })

    return NextResponse.json({ data: quiz, error: null }, { status: 201 })
  } catch (error) {
    await logError({ context: 'quizzes.create', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
