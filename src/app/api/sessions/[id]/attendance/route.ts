import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { markAttendanceSchema } from '@/lib/validations/session'
import { POOL_TICKET } from '@/config/constants'

type Params = { params: Promise<{ id: string }> }

// ─── GET /api/sessions/[id]/attendance ────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireRole(['admin', 'staff'])
    const { id: sessionId } = await params

    const attendance = await prisma.attendance.findMany({
      where: { sessionId },
      include: {
        student: {
          include: { user: { select: { fullName: true, phone: true } } }
        }
      }
    })

    return NextResponse.json({ data: attendance, error: null })

  } catch (error) {
    await logError({ context: 'attendance.list', message: 'Failed to fetch attendance', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}

// ─── POST /api/sessions/[id]/attendance — Điểm danh ─────
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const { id: sessionId } = await params

    const body = await request.json()
    const parsed = markAttendanceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const session = await prisma.classSession.findUnique({ where: { id: sessionId } })
    if (!session) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy buổi học' } },
        { status: 404 }
      )
    }

    const { records } = parsed.data
    const results = []

    for (const record of records) {
      const { studentId, status, notes } = record

      // Upsert attendance
      const attendance = await prisma.attendance.upsert({
        where: {
          sessionId_studentId: { sessionId, studentId }
        },
        update: { status, notes: notes || null, markedBy: user.id, markedAt: new Date() },
        create: {
          sessionId,
          studentId,
          status,
          notes: notes || null,
          markedBy: user.id,
          markedAt: new Date(),
        }
      })

      // Nếu có mặt → trừ 1 buổi vé bơi
      if (status === 'present' || status === 'walk_in') {
        const activeTicket = await prisma.poolTicket.findFirst({
          where: { studentId, isActive: true },
          orderBy: { purchasedAt: 'desc' }
        })

        if (activeTicket) {
          const newUsed = activeTicket.sessionsUsed + 1
          await prisma.poolTicket.update({
            where: { id: activeTicket.id },
            data: {
              sessionsUsed: newUsed,
              // Deactivate nếu đã dùng hết
              isActive: newUsed < activeTicket.maxSessions
            }
          })

          // Cảnh báo sắp hết vé
          const remaining = activeTicket.maxSessions - newUsed
          if (remaining <= POOL_TICKET.LOW_STOCK_ALERT) {
            await prisma.notification.create({
              data: {
                userId: (await prisma.student.findUnique({
                  where: { id: studentId },
                  select: { userId: true }
                }))!.userId,
                studentId,
                type: 'general',
                title: `Vé bơi sắp hết!`,
                body: `Bạn còn ${remaining} buổi vé bơi. Nhớ sắp xếp mua thêm để không bị gián đoạn nhé 🌊`,
              }
            })
          }
        }

        // Cập nhật lastAttendedAt
        await prisma.student.update({
          where: { id: studentId },
          data: { lastAttendedAt: new Date() }
        })
      }

      // Nếu vắng → gửi thông báo
      if (status === 'absent') {
        const studentUser = await prisma.student.findUnique({
          where: { id: studentId },
          select: { userId: true }
        })
        if (studentUser) {
          await prisma.notification.create({
            data: {
              userId: studentUser.userId,
              studentId,
              type: 'absence',
              title: 'Hôm nay bạn vắng học',
              body: `Chúng mình nhớ bạn! Nếu có gì trở ngại, cứ nhắn tin cho lớp nhé 😊`,
            }
          })
        }
      }

      results.push(attendance)
    }

    // Cập nhật session status → completed
    await prisma.classSession.update({
      where: { id: sessionId },
      data: { status: 'completed' }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'attendance.mark',
        entityType: 'class_session',
        entityId: sessionId,
        afterData: { recordsCount: records.length, markedBy: user.id }
      }
    })

    log.info('attendance.mark', `Marked ${records.length} attendance records for session ${sessionId}`, {
      markedBy: user.id
    })

    return NextResponse.json({ data: results, error: null })

  } catch (error) {
    await logError({ context: 'attendance.mark', message: 'Failed to mark attendance', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi điểm danh' } },
      { status: 500 }
    )
  }
}
