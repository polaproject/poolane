import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { z } from 'zod'

const feedbackSchema = z.object({
  sessionId: z.string().uuid(),
  feeling: z.number().int().min(1).max(3), // 1=😊 2=😐 3=😟
  note: z.string().max(300).optional(),
})

// Lưu feedback sau buổi học vào notification metadata
// (đơn giản hoá: dùng notification table thay vì tạo bảng mới)
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['student', 'admin', 'staff'])

    const body = await request.json()
    const parsed = feedbackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } },
        { status: 400 }
      )
    }

    const { sessionId, feeling, note } = parsed.data
    const FEELING_LABELS = { 1: '😊 Tốt', 2: '😐 Bình thường', 3: '😟 Khó khăn' }

    // Lưu vào practice_log gần nhất của student
    const student = await prisma.student.findFirst({ where: { userId: user.id } })
    if (!student) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ học viên' } },
        { status: 404 }
      )
    }

    await prisma.practiceLog.create({
      data: {
        studentId: student.id,
        date: new Date(),
        selfFeeling: feeling,
        notes: note || FEELING_LABELS[feeling as keyof typeof FEELING_LABELS],
        focusSkills: `session:${sessionId}`,
      }
    })

    return NextResponse.json({
      data: { feeling, sessionId },
      error: null
    }, { status: 201 })

  } catch (error) {
    await logError({ context: 'feedback.create', message: 'Failed to save feedback', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
