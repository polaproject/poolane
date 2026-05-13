import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { z } from 'zod'

const createSchema = z.object({
  studentId: z.string().uuid(),
  sessionId: z.string().uuid().optional().nullable(),
  driveUrl: z.string().url(),
  caption: z.string().max(500).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])
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

    const items = await prisma.videoLink.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        student: { select: { user: { select: { fullName: true } }, studentCode: true } },
        session: { select: { date: true, timeSlot: true } },
      }
    })

    return NextResponse.json({ data: items, error: null })
  } catch (error) {
    await logError({ context: 'videos.list', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } }, { status: 400 })
    }

    const video = await prisma.videoLink.create({
      data: {
        studentId: parsed.data.studentId,
        sessionId: parsed.data.sessionId || null,
        driveUrl: parsed.data.driveUrl,
        caption: parsed.data.caption,
        createdBy: user.id,
      }
    })

    // Notify học viên
    const student = await prisma.student.findUnique({ where: { id: parsed.data.studentId }, select: { userId: true, user: { select: { fullName: true } } } })
    if (student) {
      await prisma.notification.create({
        data: {
          userId: student.userId,
          studentId: parsed.data.studentId,
          senderId: user.id,
          type: 'general',
          title: '📹 Video bơi của bạn',
          body: `Lớp vừa gửi 1 video kỹ thuật cho bạn xem!`,
          actionUrl: '/student/videos',
        }
      })
    }

    log.info('videos.create', `Video for student ${parsed.data.studentId}`, { createdBy: user.id })
    return NextResponse.json({ data: video, error: null }, { status: 201 })
  } catch (error) {
    await logError({ context: 'videos.create', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
