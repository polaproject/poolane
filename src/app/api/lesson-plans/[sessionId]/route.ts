import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { z } from 'zod'

type Params = { params: Promise<{ sessionId: string }> }

const schema = z.object({
  focusSkills: z.array(z.string()).max(5),
  warmupNotes: z.string().max(2000).optional(),
  mainNotes: z.string().max(2000).optional(),
  cooldownNotes: z.string().max(2000).optional(),
  equipment: z.string().max(500).optional(),
  courseId: z.string().uuid().optional(),
})

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireRole(['admin', 'staff'])
    const { sessionId } = await params
    const plan = await prisma.lessonPlan.findUnique({ where: { sessionId } })
    return NextResponse.json({ data: plan, error: null })
  } catch (error) {
    await logError({ context: 'lesson_plan.get', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const { sessionId } = await params
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } }, { status: 400 })
    }

    const session = await prisma.classSession.findUnique({ where: { id: sessionId } })
    if (!session) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy buổi học' } }, { status: 404 })
    }

    const plan = await prisma.lessonPlan.upsert({
      where: { sessionId },
      create: {
        sessionId,
        courseId: parsed.data.courseId,
        focusSkills: parsed.data.focusSkills,
        warmupNotes: parsed.data.warmupNotes,
        mainNotes: parsed.data.mainNotes,
        cooldownNotes: parsed.data.cooldownNotes,
        equipment: parsed.data.equipment,
        createdBy: user.id,
      },
      update: {
        focusSkills: parsed.data.focusSkills,
        warmupNotes: parsed.data.warmupNotes,
        mainNotes: parsed.data.mainNotes,
        cooldownNotes: parsed.data.cooldownNotes,
        equipment: parsed.data.equipment,
      }
    })

    return NextResponse.json({ data: plan, error: null })
  } catch (error) {
    await logError({ context: 'lesson_plan.upsert', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
