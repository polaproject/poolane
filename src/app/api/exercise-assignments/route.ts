import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { assignExerciseSchema } from '@/lib/validations/exercise'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const studentId = request.nextUrl.searchParams.get('studentId')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (user.role === 'student') {
      const stu = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })
      if (!stu) return NextResponse.json({ data: [], error: null })
      where.studentId = stu.id
    } else if (studentId) {
      where.studentId = studentId
    }

    const items = await prisma.exerciseAssignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { exercise: true }
    })
    return NextResponse.json({ data: items, error: null })
  } catch (error) {
    await logError({ context: 'assignments.list', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const body = await request.json()
    const parsed = assignExerciseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { id: parsed.data.studentId },
      include: { user: { select: { id: true, fullName: true } } }
    })
    if (!student) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy HV' } }, { status: 404 })
    }

    const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null

    const created = await prisma.$transaction(async (tx) => {
      const items = await Promise.all(parsed.data.exerciseIds.map(exerciseId =>
        tx.exerciseAssignment.create({
          data: {
            exerciseId,
            studentId: parsed.data.studentId,
            assignedBy: user.id,
            dueDate,
            status: 'assigned',
          }
        })
      ))

      await tx.notification.create({
        data: {
          userId: student.user.id,
          studentId: student.id,
          senderId: user.id,
          type: 'general',
          title: '📚 Bạn có bài tập mới',
          body: `Lớp vừa gán ${items.length} bài tập cho bạn. Mở app để xem chi tiết.`,
          actionUrl: '/student/exercises/my',
        }
      })

      return items
    })

    log.info('assignments.create', `Created ${created.length} assignments for student ${parsed.data.studentId}`)
    return NextResponse.json({ data: { count: created.length, items: created }, error: null }, { status: 201 })
  } catch (error) {
    await logError({ context: 'assignments.create', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
