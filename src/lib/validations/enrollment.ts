import { z } from 'zod'
import { COURSE_PRICES, PAYMENT_DEPOSIT_RATE } from '@/config/constants'

export const createEnrollmentSchema = z.object({
  studentId: z.string().uuid('ID học viên không hợp lệ'),
  courseId: z.string().uuid('ID khoá học không hợp lệ'),
  paymentPlan: z.enum(['A_full', 'B_course_first', 'C_deposit']),
  depositAmount: z.number().int().min(0).optional(),
  voucherCode: z.string().optional(),
}).refine(data => {
  // Phương án C phải có deposit amount
  if (data.paymentPlan === 'C_deposit') {
    return data.depositAmount !== undefined && data.depositAmount > 0
  }
  return true
}, {
  message: 'Phương án C yêu cầu nhập số tiền đặt cọc',
  path: ['depositAmount'],
})

export const createPoolTicketSchema = z.object({
  studentId: z.string().uuid(),
  ticketType: z.enum(['first', 'subsequent', 'single', 'weekly', 'daily', 'monthly']),
  pricePaid: z.number().int().min(0),
  totalSessions: z.number().int().min(1).max(30).optional(),
})

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>
export type CreatePoolTicketInput = z.infer<typeof createPoolTicketSchema>

// Helper: tính deposit amount theo phương án C
export function calculateDeposit(courseCode: 'ECH' | 'SAI' | 'BUOM'): number {
  return Math.floor(COURSE_PRICES[courseCode] * PAYMENT_DEPOSIT_RATE)
}
