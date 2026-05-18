import { z } from 'zod'

/**
 * Schema cho admin "Quản lý giao dịch" — form thống nhất tạo Payment + tuỳ chọn
 * tạo PoolTicket kèm. Cho phép 4 use case chính:
 *
 *   1. Carryover ticket (HV cũ đã trả ngoài): Payment OFF + PoolTicket ON (carryover=true)
 *   2. Manual cash payment retroactive: Payment ON + PoolTicket OFF
 *   3. Compensation / gift: Payment ON (excludeFromRevenue=true) + PoolTicket optional
 *   4. Combo bình thường HV mua vé: Payment ON + PoolTicket ON
 *
 * Bắt buộc ≥ 1 trong 2 section bật (refine). Notes bắt buộc để audit log có lý do.
 */

const paymentSection = z.object({
  enabled: z.literal(true),
  amount: z.number().int(), // cho phép âm cho refund manual / đảo bút toán
  type: z.enum(['course_fee', 'pool_ticket', 'shop', 'refund', 'adjustment']),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'card', 'other']),
  referenceNumber: z.string().max(100).optional().nullable(),
  excludeFromRevenue: z.boolean().default(false),
})

const ticketSection = z.object({
  enabled: z.literal(true),
  ticketType: z.enum(['first', 'subsequent', 'single', 'weekly', 'daily', 'monthly']),
  totalSessions: z.number().int().min(1).max(30),
  sessionsUsedInitial: z.number().int().min(0).default(0),
  pricePaid: z.number().int().min(0).default(0),
  isCarryover: z.boolean().default(false),
})

export const createTransactionSchema = z
  .object({
    studentId: z.string().uuid(),
    notes: z.string().trim().min(3, 'Lý do tối thiểu 3 ký tự').max(500),
    payment: paymentSection.optional(),
    poolTicket: ticketSection.optional(),
  })
  .refine((d) => d.payment !== undefined || d.poolTicket !== undefined, {
    message: 'Phải chọn ít nhất 1 trong 2: tạo Payment hoặc tạo PoolTicket',
  })
  .refine(
    (d) => {
      if (!d.poolTicket) return true
      return d.poolTicket.sessionsUsedInitial <= d.poolTicket.totalSessions
    },
    {
      message: 'Số buổi đã dùng không được vượt tổng số buổi',
      path: ['poolTicket', 'sessionsUsedInitial'],
    },
  )
  .refine(
    (d) => {
      if (!d.payment) return true
      return d.payment.amount !== 0
    },
    {
      message: 'Số tiền phải khác 0',
      path: ['payment', 'amount'],
    },
  )

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

/** Schema cho POST /api/admin/transactions/[paymentId]/reverse */
export const reverseTransactionSchema = z.object({
  reason: z.string().trim().min(3, 'Lý do tối thiểu 3 ký tự').max(300),
})

export type ReverseTransactionInput = z.infer<typeof reverseTransactionSchema>
