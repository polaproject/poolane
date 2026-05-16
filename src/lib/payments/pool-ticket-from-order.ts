import { POOL_TICKET } from '@/config/constants'
import type { Prisma } from '@prisma/client'

type TxClient = Prisma.TransactionClient

/**
 * Detect ticket subtype từ SKU prefix.
 * Convention:
 *   TICKET-FIRST-*    → 'first'   (vé lần đầu, max 12 buổi)
 *   TICKET-SINGLE-*   → 'single'  (vé lẻ 1 buổi)
 *   TICKET-WEEKLY-*   → 'weekly'
 *   TICKET-DAILY-*    → 'daily'
 *   TICKET-MONTHLY-*  → 'monthly'
 *   Khác              → 'subsequent' (default)
 */
function detectTicketSubtype(sku: string | null | undefined): string {
  const s = (sku || '').toUpperCase()
  if (s.startsWith('TICKET-FIRST')) return 'first'
  if (s.startsWith('TICKET-WEEKLY')) return 'weekly'
  if (s.startsWith('TICKET-DAILY')) return 'daily'
  if (s.startsWith('TICKET-MONTHLY')) return 'monthly'
  if (s.startsWith('TICKET-SINGLE')) return 'single'
  return 'subsequent'
}

export interface OrderItemForTicket {
  productId: string
  quantity: number
  unitPrice: number
  product: {
    type: string
    sku: string | null
    sessionsCount: number | null
    name: string
  }
}

export interface OrderForTicket {
  id: string
  studentId: string
  orderItems: OrderItemForTicket[]
}

/**
 * Tạo PoolTicket cho mọi orderItem có product.type='pool_ticket' (hoặc fallback
 * detect qua name match). Gọi trong transaction để rollback đồng bộ.
 *
 * Logic:
 * - Mỗi orderItem ticket → 1 PoolTicket record với totalSessions = sessionsCount × quantity
 * - Vé 'first' chỉ tạo nếu HV chưa có (skip duplicate)
 * - pricePaid = unitPrice × quantity (ghi nhận tổng đã trả qua order này)
 *
 * Trả về số ticket đã tạo (cho logging).
 */
export async function createPoolTicketsFromOrder(
  tx: TxClient,
  order: OrderForTicket
): Promise<number> {
  let created = 0

  for (const item of order.orderItems) {
    // Detect: type 'pool_ticket' chính thức, hoặc fallback name match (backfill case
    // cho product cũ type=service với name 'Vé bơi'/'Thẻ bơi')
    const isTicket = item.product.type === 'pool_ticket' || isFallbackTicketName(item.product.name)
    if (!isTicket) continue

    const sessionsPerUnit = item.product.sessionsCount || 1
    const subtype = detectTicketSubtype(item.product.sku)

    if (subtype === 'first') {
      const existing = await tx.poolTicket.findFirst({
        where: { studentId: order.studentId, ticketType: 'first' },
      })
      if (existing) continue
    }

    const totalSessions = sessionsPerUnit * item.quantity
    const maxSessions = subtype === 'first' ? POOL_TICKET.MAX_SESSIONS : totalSessions

    await tx.poolTicket.create({
      data: {
        studentId: order.studentId,
        ticketType: subtype,
        totalSessions,
        maxSessions,
        sessionsUsed: 0,
        pricePaid: item.unitPrice * item.quantity,
        isActive: true,
      },
    })
    created++
  }

  return created
}

/**
 * Fallback heuristic: product cũ type='service' nhưng tên là "Vé bơi"/"Thẻ bơi"
 * → vẫn coi là ticket. Cho phép backfill data lịch sử mà không cần owner
 * migrate product type thủ công.
 *
 * Hạn chế: nếu product có tên "Bộ phụ kiện bơi" thì TRÁNH match (regex chặt).
 */
function isFallbackTicketName(name: string): boolean {
  // Match "vé bơi" hoặc "thẻ bơi" ở đầu hoặc giữa câu, không match "bộ ... bơi"
  return /^(vé|thẻ)\s+bơi/i.test(name)
}
