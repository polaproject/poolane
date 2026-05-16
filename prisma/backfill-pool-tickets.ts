/**
 * Idempotent backfill: scan toàn bộ Order status='paid' hoặc 'fulfilled' với
 * orderItem là pool_ticket (hoặc fallback: type='service' + name match
 * "vé bơi"/"thẻ bơi") → check đã có PoolTicket tương ứng chưa → tạo nếu thiếu.
 *
 * Phase 18.2 fix: trước đây HV mua vé qua shop nhưng `confirmOrderTransfer()`
 * không tạo PoolTicket → data inconsistency. Script này khắc phục data lịch sử.
 *
 * Chạy: npx dotenv -e .env.local -- npx tsx prisma/backfill-pool-tickets.ts
 *
 * An toàn chạy nhiều lần — dedupe theo (studentId, ticketType, createdAt ~order.createdAt).
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { POOL_TICKET } from '../src/config/constants'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter, log: ['error', 'warn'] })

function detectTicketSubtype(sku: string | null | undefined): string {
  const s = (sku || '').toUpperCase()
  if (s.startsWith('TICKET-FIRST')) return 'first'
  if (s.startsWith('TICKET-WEEKLY')) return 'weekly'
  if (s.startsWith('TICKET-DAILY')) return 'daily'
  if (s.startsWith('TICKET-MONTHLY')) return 'monthly'
  if (s.startsWith('TICKET-SINGLE')) return 'single'
  return 'subsequent'
}

function isFallbackTicketName(name: string): boolean {
  return /^(vé|thẻ)\s+bơi/i.test(name)
}

async function main() {
  console.log('🎫 Backfill PoolTicket từ Order paid/fulfilled...\n')

  const orders = await prisma.order.findMany({
    where: { status: { in: ['paid', 'fulfilled'] } },
    include: {
      orderItems: { include: { product: true } },
      student: { include: { user: { select: { fullName: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Tìm thấy ${orders.length} đơn paid/fulfilled.`)

  let createdCount = 0
  let skippedCount = 0
  let unchangedCount = 0

  for (const order of orders) {
    const ticketItems = order.orderItems.filter(it =>
      it.product.type === 'pool_ticket' || isFallbackTicketName(it.product.name)
    )

    if (ticketItems.length === 0) {
      unchangedCount++
      continue
    }

    for (const item of ticketItems) {
      const subtype = detectTicketSubtype(item.product.sku) ||
        // Heuristic cho fallback: name "Vé bơi 01 Lượt" → single; "Thẻ bơi lần đầu" → first
        (/lần\s*đầu/i.test(item.product.name) ? 'first' :
         /lẻ|lượt|01\s*lượt/i.test(item.product.name) ? 'single' :
         'subsequent')

      // Dedupe: với cùng student + cùng subtype, đã có ticket purchasedAt trong
      // khoảng ±1 ngày so với order → coi như đã backfill, skip.
      const orderTime = order.createdAt.getTime()
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
      if (existing) {
        console.log(`  ⏭  [${order.student.user.fullName}] đã có ${subtype} ticket cho đơn ${order.id.slice(0, 8)} — skip`)
        skippedCount++
        continue
      }

      // First ticket guard: 1 HV chỉ có 1 vé first toàn cuộc đời
      if (subtype === 'first') {
        const anyFirst = await prisma.poolTicket.findFirst({
          where: { studentId: order.studentId, ticketType: 'first' },
        })
        if (anyFirst) {
          console.log(`  ⏭  [${order.student.user.fullName}] đã có first ticket khác — skip`)
          skippedCount++
          continue
        }
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
          userId: null,
          role: 'admin',
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

      console.log(`  ✅ [${order.student.user.fullName}] tạo ${subtype} (${totalSessions} buổi) cho đơn ${order.id.slice(0, 8)}`)
      createdCount++
    }
  }

  console.log(`\n📊 Tổng kết:`)
  console.log(`  Tickets đã tạo: ${createdCount}`)
  console.log(`  Skip (đã có): ${skippedCount}`)
  console.log(`  Đơn không có ticket item: ${unchangedCount}`)
  console.log(`✨ Done.`)
}

main()
  .catch(e => {
    console.error('❌ Backfill thất bại:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
