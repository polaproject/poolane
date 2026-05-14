import { NextRequest, NextResponse } from 'next/server'
import { requireRole, getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { createExerciseSchema, DIFFICULTY_LEVELS } from '@/lib/validations/exercise'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const sp = request.nextUrl.searchParams
    const skill = sp.get('skill')
    const difficulty = sp.get('difficulty')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (user?.role === 'student') where.isPublished = true
    if (skill) where.skillTarget = skill
    if (difficulty && (DIFFICULTY_LEVELS as readonly string[]).includes(difficulty)) where.difficulty = difficulty

    const items = await prisma.exercise.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { _count: { select: { assignments: true } } }
    })
    return NextResponse.json({ data: items, error: null })
  } catch (error) {
    await logError({ context: 'exercises.list', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const body = await request.json()
    const parsed = createExerciseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() } }, { status: 400 })
    }

    const ex = await prisma.exercise.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        skillTarget: parsed.data.skillTarget,
        difficulty: parsed.data.difficulty,
        videoUrl: parsed.data.videoUrl || null,
        stepsJson: parsed.data.steps,
        isPublished: parsed.data.isPublished,
        createdBy: user.id,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id, role: user.role,
        action: 'exercise.create', entityType: 'exercise', entityId: ex.id,
        afterData: { title: ex.title, skillTarget: ex.skillTarget, difficulty: ex.difficulty },
      }
    })

    log.info('exercises.create', `Created exercise ${ex.id}`, { createdBy: user.id })
    return NextResponse.json({ data: ex, error: null }, { status: 201 })
  } catch (error) {
    await logError({ context: 'exercises.create', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
