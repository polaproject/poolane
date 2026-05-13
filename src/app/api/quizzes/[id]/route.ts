import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

type Params = { params: Promise<{ id: string }> }

// ─── GET /api/quizzes/[id] — Lấy quiz với câu hỏi (HV làm bài) ─
// Ẩn correctAnswer/explanation khi role=student để không lộ đáp án
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { orderIndex: 'asc' } }
      }
    })

    if (!quiz) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy quiz' } }, { status: 404 })
    }

    if (!quiz.isPublished && user.role === 'student') {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Quiz chưa public' } }, { status: 404 })
    }

    // Hide answers for students
    if (user.role === 'student') {
      const sanitized = {
        ...quiz,
        questions: quiz.questions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          type: q.type,
          options: q.options,
          orderIndex: q.orderIndex,
        }))
      }
      return NextResponse.json({ data: sanitized, error: null })
    }

    return NextResponse.json({ data: quiz, error: null })
  } catch (error) {
    await logError({ context: 'quizzes.get', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
