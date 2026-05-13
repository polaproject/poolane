import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { z } from 'zod'

const createLogSchema = z.object({
  date: z.string(),
  distanceMeters: z.number().int().min(1).optional(),
  durationMinutes: z.number().int().min(1).optional(),
  focusSkills: z.string().max(200).optional(),
  selfFeeling: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['student', 'admin', 'staff'])
    const body = await request.json()
    const parsed = createLogSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } },
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

    const log = await prisma.practiceLog.create({
      data: {
        studentId: student.id,
        date: new Date(parsed.data.date),
        distanceMeters: parsed.data.distanceMeters,
        durationMinutes: parsed.data.durationMinutes,
        focusSkills: parsed.data.focusSkills,
        selfFeeling: parsed.data.selfFeeling,
        notes: parsed.data.notes,
      }
    })

    return NextResponse.json({ data: log, error: null }, { status: 201 })

  } catch (error) {
    await logError({ context: 'practice-logs.create', message: 'Failed', error })
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

    const logs = await prisma.practiceLog.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' },
      take: 30,
    })

    return NextResponse.json({ data: logs, error: null })

  } catch (error) {
    await logError({ context: 'practice-logs.list', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
