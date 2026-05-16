import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { POOL_TICKET } from '@/config/constants'

function detectTicketSubtype(sku: string | null | undefined, name: string): string {
  const s = (sku || '').toUpperCase()
  if (s.startsWith('TICKET-FIRST')) return 'first'
  if (s.startsWith('TICKET-WEEKLY')) return 'weekly'
  if (s.startsWith('TICKET-DAILY')) return 'daily'
  if (s.startsWith('TICKET-MONTHLY')) return 'monthly'
  if (s.startsWith('TICKET-SINGLE')) return 'single'
  // Heuristic theo name khi SKU không follow convention
  if (/lần\s*đầu/i.test(name)) return 'first'
  if (/lẻ|lượt|01\s*lượt|1\s*lượt/i.test(name)) return 'single'
  if (/tháng|month/i.test(name)) return 'monthly'
  if (/tuần|week/i.test(name)) return 'weekly'
  if (/ngày|daily/i.test(name)) return 'daily'
  return 'subsequent'
}

function isTicketItem(productType: string, productName: string): boolean {
  if (productType === 'pool_ticket') return true
  return /^(vé|thẻ)\s+bơi/i.test(productName)
}

/**
 * POST /api/admin/backfill-pool-tickets
 *
 * Scan toàn bộ Order paid/fulfilled với orderItem là vé bơi (type='pool_ticket'
 * hoặc name fallback) → tạo PoolTicket còn thiếu. Idempotent: dedupe theo
 * (studentId, ticketType, purchasedAt ±1 day với order.createdAt).
 *
 * Trả về thống kê { created, skipped, scanned }.
 */
export async function POST() {
  try {
    const user = await requireRole(['admin'])

    const orders = await prisma.order.findMany({
      where: { status: { in: ['paid', 'fulfilled'] } },
      include: {
        orderItems: { include: { product: true } },
        student: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    })

    let created = 0
    let skipped = 0
    let scanned = 0
    const details: Array<{ student: string; subtype: string; sessions: number; orderId: string }> = []

    for (const order of orders) {
      const ticketItems = order.orderItems.filter(it =>
        isTicketItem(it.product.type, it.product.name)
      )
      if (ticketItems.length === 0) continue
      scanned++

      for (const item of ticketItems) {
        const subtype = detectTicketSubtype(item.product.sku, item.product.name)
        const orderTime = order.createdAt.getTime()

        // Dedupe ±1 day
        const existing = await prisma.poolTicket.findFirst({
          where: {
            studentId: order.studentId,
            ticketType: subtype,
            purchasedAt: {
              gte: new Date(orderTime - 86400000),
              lte: new Date(orderTime + 86400000),
            },
          },
        })
        if (existing) { skipped++; continue }

        if (subtype === 'first') {
          const anyFirst = await prisma.poolTicket.findFirst({
            where: { studentId: order.studentId, ticketType: 'first' },
          })
          if (anyFirst) { skipped++; continue }
        }

        const sessionsPerUnit = item.product.sessionsCount || 1
        const totalSessions = sessionsPerUnit * item.quantity
        const maxSessions = subtype === 'first' ? POOL_TICKET.MAX_SESSIONS : totalSessions

        const ticket = await prisma.poolTicket.create({
          data: {
            studentId: order.studentId,
            ticketType: subtype,
            totalSessions,
            maxSessions,
            sessionsUsed: 0,
            pricePaid: item.unitPrice * item.quantity,
            purchasedAt: order.createdAt,
            isActive: true,
          },
        })

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            role: user.role,
            action: 'pool_ticket.backfill',
            entityType: 'pool_ticket',
            entityId: ticket.id,
            afterData: {
              studentId: order.studentId,
              ticketType: subtype,
              totalSessions,
              pricePaid: item.unitPrice * item.quantity,
              sourceOrderId: order.id,
              productName: item.product.name,
            },
          },
        })

        details.push({
          student: order.student.user.fullName,
          subtype,
          sessions: totalSessions,
          orderId: order.id.slice(0, 8),
        })
        created++
      }
    }

    log.info('admin.backfill_pool_tickets', `Backfill done: ${created} created, ${skipped} skipped, ${scanned} orders scanned`, {
      triggeredBy: user.id,
    })

    return NextResponse.json({
      data: { created, skipped, scanned, details },
      error: null,
    })
  } catch (error) {
    await logError({ context: 'admin.backfill_pool_tickets', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
