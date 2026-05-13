import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { z } from 'zod'

const createSchema = z.object({
  photoUrl: z.string().url(),
  caption: z.string().max(500).optional(),
  sessionId: z.string().uuid().optional().nullable(),
  eventId: z.string().uuid().optional().nullable(),
  visibleTo: z.enum(['all_students', 'specific_students']).default('all_students'),
})

export async function GET() {
  try {
    await requireRole(['admin', 'staff', 'student'])
    const photos = await prisma.sessionPhoto.findMany({
      where: { visibleTo: 'all_students' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        session: { select: { date: true, timeSlot: true } },
      }
    })
    return NextResponse.json({ data: photos, error: null })
  } catch (error) {
    await logError({ context: 'photos.list', message: 'Failed', error })
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

    const photo = await prisma.sessionPhoto.create({
      data: {
        photoUrl: parsed.data.photoUrl,
        caption: parsed.data.caption,
        sessionId: parsed.data.sessionId ?? null,
        eventId: parsed.data.eventId ?? null,
        visibleTo: parsed.data.visibleTo,
        uploadedBy: user.id,
      }
    })

    return NextResponse.json({ data: photo, error: null }, { status: 201 })
  } catch (error) {
    await logError({ context: 'photos.create', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
