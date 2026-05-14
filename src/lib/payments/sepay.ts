import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface SepayPayload {
  id: number
  gateway?: string
  transactionDate: string
  accountNumber?: string
  code?: string | null
  content: string
  transferType: 'in' | 'out'
  transferAmount: number
  accumulated?: number
  subAccount?: string | null
  referenceCode?: string
  description?: string
}

/** Verify Sepay sent the request — checks Authorization: Apikey <SEPAY_API_KEY> */
export function verifySepayAuth(req: NextRequest): boolean {
  const expected = process.env.SEPAY_API_KEY
  if (!expected) return false  // chưa setup → reject
  const header = req.headers.get('authorization') ?? ''
  return header === `Apikey ${expected}` || header === `Bearer ${expected}`
}

/**
 * Parse memo từ content sao kê.
 * Format mong đợi: POLA<8chars> (order) hoặc POLAE<8chars> (enrollment).
 * Content có thể có nhiều text khác, ta tìm pattern trong chuỗi.
 */
export function parseMemo(content: string): { type: 'order' | 'enrollment'; shortId: string } | null {
  const upper = content.toUpperCase().replace(/\s+/g, '')
  // POLAE phải check trước POLA vì POLAE chứa POLA
  const enrollmentMatch = upper.match(/POLAE([A-Z0-9]{8})/)
  if (enrollmentMatch) {
    return { type: 'enrollment', shortId: enrollmentMatch[1] }
  }
  const orderMatch = upper.match(/POLA([A-Z0-9]{8})/)
  if (orderMatch) {
    return { type: 'order', shortId: orderMatch[1] }
  }
  return null
}

/**
 * Tìm order theo 8 ký tự đầu của id (uuid bỏ dấu - rồi slice 8).
 * Trả về order id full hoặc null.
 */
export async function findOrderByShortId(shortId: string): Promise<string | null> {
  const normalized = shortId.toLowerCase()
  // Lấy tất cả order approved + thử match prefix sau khi strip dashes
  const candidates = await prisma.order.findMany({
    where: { status: 'approved' },
    select: { id: true },
    take: 500,
  })
  for (const c of candidates) {
    if (c.id.replace(/-/g, '').slice(0, 8) === normalized) return c.id
  }
  return null
}

export async function findEnrollmentByShortId(shortId: string): Promise<string | null> {
  const normalized = shortId.toLowerCase()
  // Enrollment active hoặc extension có thể nhận thanh toán
  const candidates = await prisma.enrollment.findMany({
    where: { status: { in: ['active', 'extension'] } },
    select: { id: true },
    take: 1000,
  })
  for (const c of candidates) {
    if (c.id.replace(/-/g, '').slice(0, 8) === normalized) return c.id
  }
  return null
}

/** Check sepayId đã được xử lý chưa (idempotency) */
export async function isSepayIdProcessed(sepayId: number): Promise<boolean> {
  const [unmatched, audit] = await Promise.all([
    prisma.unmatchedTransaction.findUnique({ where: { sepayId } }),
    prisma.auditLog.findFirst({
      where: {
        action: { startsWith: 'sepay.' },
        afterData: { path: ['sepayId'], equals: sepayId } as never,
      }
    }),
  ])
  return Boolean(unmatched) || Boolean(audit)
}
