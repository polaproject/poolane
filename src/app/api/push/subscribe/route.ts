import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { z } from 'zod'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  userAgent: z.string().optional(),
})

// POST: lưu subscription
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const parsed = subscribeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid' } }, { status: 400 })
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint: parsed.data.endpoint },
      create: {
        userId: user.id,
        endpoint: parsed.data.endpoint,
        keysP256: parsed.data.keys.p256dh,
        keysAuth: parsed.data.keys.auth,
        userAgent: parsed.data.userAgent,
      },
      update: {
        userId: user.id,
        keysP256: parsed.data.keys.p256dh,
        keysAuth: parsed.data.keys.auth,
        userAgent: parsed.data.userAgent,
      }
    })

    log.info('push.subscribe', `User ${user.id} subscribed`)
    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (error) {
    await logError({ context: 'push.subscribe', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Lỗi' } }, { status: 500 })
  }
}

// DELETE: huỷ subscription
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    if (!body.endpoint) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Cần endpoint' } }, { status: 400 })
    }
    await prisma.pushSubscription.deleteMany({
      where: { userId: user.id, endpoint: body.endpoint }
    })
    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (error) {
    await logError({ context: 'push.unsubscribe', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Lỗi' } }, { status: 500 })
  }
}
