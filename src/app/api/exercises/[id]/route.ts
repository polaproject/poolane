import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { updateExerciseSchema } from '@/lib/validations/exercise'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const ex = await prisma.exercise.findUnique({ where: { id } })
    if (!ex) return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy' } }, { status: 404 })
    return NextResponse.json({ data: ex, error: null })
  } catch (error) {
    await logError({ context: 'exercise.get', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const { id } = await params
    const body = await request.json()
    const parsed = updateExerciseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid' } }, { status: 400 })
    }
    const data: Record<string, unknown> = {}
    if (parsed.data.title !== undefined) data.title = parsed.data.title
    if (parsed.data.description !== undefined) data.description = parsed.data.description
    if (parsed.data.skillTarget !== undefined) data.skillTarget = parsed.data.skillTarget
    if (parsed.data.difficulty !== undefined) data.difficulty = parsed.data.difficulty
    if (parsed.data.videoUrl !== undefined) data.videoUrl = parsed.data.videoUrl || null
    if (parsed.data.steps !== undefined) data.stepsJson = parsed.data.steps
    if (parsed.data.isPublished !== undefined) data.isPublished = parsed.data.isPublished

    const updated = await prisma.exercise.update({ where: { id }, data })
    await prisma.auditLog.create({
      data: { userId: user.id, role: user.role, action: 'exercise.update', entityType: 'exercise', entityId: id, afterData: data as never }
    })
    return NextResponse.json({ data: updated, error: null })
  } catch (error) {
    await logError({ context: 'exercise.update', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin'])
    const { id } = await params
    await prisma.exerciseAssignment.deleteMany({ where: { exerciseId: id } })
    await prisma.exercise.delete({ where: { id } })
    await prisma.auditLog.create({
      data: { userId: user.id, role: user.role, action: 'exercise.delete', entityType: 'exercise', entityId: id }
    })
    return NextResponse.json({ data: { id }, error: null })
  } catch (error) {
    await logError({ context: 'exercise.delete', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
