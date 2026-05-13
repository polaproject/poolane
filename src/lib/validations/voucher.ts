import { z } from 'zod'

export const DISCOUNT_TYPES = ['percent', 'fixed', 'free_pool_session'] as const
export const APPLIES_TO = ['any', 'course_only', 'shop_only'] as const

export const createVoucherSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9_-]+$/, { message: 'Code chỉ chứa chữ HOA, số, _ hoặc -' }),
  description: z.string().max(300).optional().or(z.literal('')),
  discountType: z.enum(DISCOUNT_TYPES),
  discountValue: z.number().int().min(0),
  appliesTo: z.enum(APPLIES_TO).default('any'),
  maxUses: z.number().int().min(1).optional().nullable(),
  validFrom: z.string().optional().or(z.literal('')),
  validUntil: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.discountType === 'percent' && data.discountValue > 100) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountValue'], message: 'Phần trăm tối đa 100' })
  }
  if (data.discountType === 'fixed' && data.discountValue <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountValue'], message: 'Số tiền giảm phải > 0' })
  }
})

export const updateVoucherSchema = z.object({
  description: z.string().max(300).optional().or(z.literal('')),
  discountValue: z.number().int().min(0).optional(),
  maxUses: z.number().int().min(1).optional().nullable(),
  validFrom: z.string().optional().or(z.literal('')).nullable(),
  validUntil: z.string().optional().or(z.literal('')).nullable(),
  isActive: z.boolean().optional(),
})

export type CreateVoucherInput = z.infer<typeof createVoucherSchema>
