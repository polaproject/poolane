import { z } from 'zod'

export const recordPaymentSchema = z.object({
  studentId: z.string().uuid(),
  amount: z.number().int().positive({ message: 'Số tiền phải lớn hơn 0' }),
  type: z.enum(['course_fee', 'pool_ticket', 'shop', 'adjustment']),
  referenceType: z.string().optional(),
  referenceId: z.string().uuid().optional(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'card', 'other']),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(300).optional(),
})

export const createRefundSchema = z.object({
  studentId: z.string().uuid(),
  enrollmentId: z.string().uuid().optional(),
  poolTicketId: z.string().uuid().optional(),
  includeCourseRefund: z.boolean().default(false),
  includeTicketRefund: z.boolean().default(false),
  reason: z.enum(['work', 'health', 'other']),
  reasonText: z.string().max(300).optional(),
}).refine(d => d.includeCourseRefund || d.includeTicketRefund, {
  message: 'Phải chọn ít nhất một khoản muốn hoàn',
})

export const processRefundSchema = z.object({
  action: z.enum(['approve', 'reject', 'transfer']),
  transferReference: z.string().max(100).optional(),
  processedNotes: z.string().max(300).optional(),
})

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>
export type CreateRefundInput = z.infer<typeof createRefundSchema>
export type ProcessRefundInput = z.infer<typeof processRefundSchema>
