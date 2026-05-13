import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { z } from 'zod'

const eventSchema = z.object({
  name: z.string().min(3).max(200),
  date: z.string(),
  timeSlot: z.string().optional(),
  description: z.string().max(2000).optional(),
})

export async function GET() {
  try {
    const events = await prisma.event.findMany({ orderBy: { date: 'desc' }, take: 50 })
    return NextResponse.json({ data: events, error: null })
  } catch (error) {
    await logError({ context: 'events.list', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Lỗi' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const body = await request.json()
    const parsed = eventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } }, { status: 400 })
    }
    const event = await prisma.event.create({
      data: {
        name: parsed.data.name,
        date: new Date(parsed.data.date),
        timeSlot: parsed.data.timeSlot,
        description: parsed.data.description,
        createdBy: user.id,
      }
    })
    return NextResponse.json({ data: event, error: null }, { status: 201 })
  } catch (error) {
    await logError({ context: 'events.create', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Lỗi' } }, { status: 500 })
  }
}
