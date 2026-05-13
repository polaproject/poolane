import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { z } from 'zod'

const createGoalSchema = z.object({
  goalText: z.string().min(5).max(300),
  targetDate: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['student', 'admin', 'staff'])
    const body = await request.json()
    const parsed = createGoalSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Nhập mục tiêu hợp lệ' } },
        { status: 400 }
      )
    }

    const student = await prisma.student.findFirst({ where: { userId: user.id } })
    if (!student) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ học viên' } },
        { status: 404 }
      )
    }

    const goal = await prisma.skillGoal.create({
      data: {
        studentId: student.id,
        goalText: parsed.data.goalText,
        targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null,
        status: 'active',
      }
    })

    return NextResponse.json({ data: goal, error: null }, { status: 201 })

  } catch (error) {
    await logError({ context: 'skill-goals.create', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(['student', 'admin', 'staff'])
    const student = await prisma.student.findFirst({ where: { userId: user.id } })
    if (!student) return NextResponse.json({ data: [], error: null })

    const goals = await prisma.skillGoal.findMany({
      where: { studentId: student.id, status: 'active' },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: goals, error: null })

  } catch (error) {
    await logError({ context: 'skill-goals.list', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole(['student', 'admin', 'staff'])
    const { id, status } = await request.json()

    const goal = await prisma.skillGoal.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json({ data: goal, error: null })

  } catch (error) {
    await logError({ context: 'skill-goals.update', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
