import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { updateAssignmentSchema } from '@/lib/validations/exercise'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const assignment = await prisma.exerciseAssignment.findUnique({
      where: { id },
      include: { exercise: true }
    })
    if (!assignment) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy' } }, { status: 404 })
    }

    // Student chỉ update được của chính mình
    if (user.role === 'student') {
      const stu = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })
      if (!stu || stu.id !== assignment.studentId) {
        return NextResponse.json({ data: null, error: { code: 'FORBIDDEN' } }, { status: 403 })
      }
    }

    const body = await request.json()
    const parsed = updateAssignmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR' } }, { status: 400 })
    }

    const updated = await prisma.exerciseAssignment.update({
      where: { id },
      data: {
        status: parsed.data.status,
        studentNote: parsed.data.studentNote,
        completedAt: parsed.data.status === 'completed' ? new Date() : null,
      }
    })

    return NextResponse.json({ data: updated, error: null })
  } catch (error) {
    await logError({ context: 'assignment.update', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    if (user.role === 'student') {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN' } }, { status: 403 })
    }
    const { id } = await params
    await prisma.exerciseAssignment.delete({ where: { id } })
    return NextResponse.json({ data: { id }, error: null })
  } catch (error) {
    await logError({ context: 'assignment.delete', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
