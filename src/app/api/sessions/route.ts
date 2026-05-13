import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { createSessionSchema } from '@/lib/validations/session'
import { CAPACITY, SESSION_TIMES } from '@/config/constants'

// ─── GET /api/sessions — Danh sách buổi học ───────────────
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'staff', 'student'])

    const { searchParams } = request.nextUrl
    const from = searchParams.get('from') // ISO date
    const to = searchParams.get('to')     // ISO date
    const timeSlot = searchParams.get('timeSlot') as 'morning' | 'evening' | null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }
    if (timeSlot) where.timeSlot = timeSlot

    const sessions = await prisma.classSession.findMany({
      where,
      orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
      include: {
        registrations: {
          where: { status: { in: ['approved', 'pending'] } },
          include: {
            student: {
              include: {
                user: { select: { fullName: true } }
              }
            }
          }
        }
      }
    })

    const data = sessions.map(s => ({
      id: s.id,
      date: s.date,
      timeSlot: s.timeSlot,
      capacity: s.capacity,
      status: s.status,
      notes: s.notes,
      approvedCount: s.registrations.filter(r => r.status === 'approved').length,
      pendingCount: s.registrations.filter(r => r.status === 'pending').length,
      registrations: s.registrations,
      timeLabel: s.timeSlot === 'morning'
        ? `${SESSION_TIMES.MORNING.start}–${SESSION_TIMES.MORNING.end}`
        : `${SESSION_TIMES.EVENING.start}–${SESSION_TIMES.EVENING.end}`,
    }))

    return NextResponse.json({ data, error: null })

  } catch (error) {
    await logError({ context: 'sessions.list', message: 'Failed to fetch sessions', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}

// ─── POST /api/sessions — Tạo buổi học ───────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])

    const body = await request.json()
    const parsed = createSessionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Thông tin không hợp lệ', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const { date, timeSlot, notes } = parsed.data

    // Capacity theo ca
    const capacity = timeSlot === 'morning' ? CAPACITY.MORNING_MAX : CAPACITY.EVENING_MAX

    // Kiểm tra buổi đã tồn tại
    const existing = await prisma.classSession.findFirst({
      where: {
        date: new Date(date),
        timeSlot,
        status: { not: 'cancelled' }
      }
    })

    if (existing) {
      return NextResponse.json(
        { data: null, error: { code: 'DUPLICATE', message: `Ca ${timeSlot === 'morning' ? 'sáng' : 'chiều'} ngày này đã tồn tại` } },
        { status: 409 }
      )
    }

    const session = await prisma.classSession.create({
      data: {
        date: new Date(date),
        timeSlot,
        capacity,
        status: 'scheduled',
        notes: notes || null,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'session.create',
        entityType: 'class_session',
        entityId: session.id,
        afterData: { date, timeSlot, capacity }
      }
    })

    log.info('sessions.create', `Created ${timeSlot} session on ${date}`, { createdBy: user.id })

    return NextResponse.json({ data: session, error: null }, { status: 201 })

  } catch (error) {
    await logError({ context: 'sessions.create', message: 'Failed to create session', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi tạo buổi học' } },
      { status: 500 }
    )
  }
}
