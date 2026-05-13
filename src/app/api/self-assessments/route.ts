import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { z } from 'zod'

const createSchema = z.object({
  courseId: z.string().uuid(),
  sessionNumber: z.number().int().min(1).max(20),
  scores: z.record(z.string(), z.number().int().min(1).max(5)),
  notes: z.string().max(500).optional(),
})

// ─── POST /api/self-assessments — HV tự đánh giá ──
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['student'])
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() } }, { status: 400 })
    }

    const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })
    if (!student) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ HV' } }, { status: 404 })
    }

    const result = await prisma.selfAssessment.upsert({
      where: {
        studentId_courseId_sessionNumber: {
          studentId: student.id,
          courseId: parsed.data.courseId,
          sessionNumber: parsed.data.sessionNumber,
        }
      },
      create: {
        studentId: student.id,
        courseId: parsed.data.courseId,
        sessionNumber: parsed.data.sessionNumber,
        scoresJson: parsed.data.scores,
        notes: parsed.data.notes,
      },
      update: {
        scoresJson: parsed.data.scores,
        notes: parsed.data.notes,
      }
    })

    log.info('self_assessment.submit', `Submitted by ${student.id}`, { sessionNumber: parsed.data.sessionNumber })
    return NextResponse.json({ data: result, error: null }, { status: 201 })

  } catch (error) {
    await logError({ context: 'self_assessment.submit', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
