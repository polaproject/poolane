import { z } from 'zod'

export const PRODUCT_TYPES = ['course', 'improvement_pack', 'service', 'physical'] as const
export type ProductType = (typeof PRODUCT_TYPES)[number]

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  course: 'Khoá học',
  improvement_pack: 'Pack buổi cải thiện',
  service: 'Dịch vụ',
  physical: 'Đồ vật lý',
}

const baseSchema = z.object({
  name: z.string().min(2, { message: 'Tên sản phẩm phải có ít nhất 2 ký tự' }).max(100),
  sku: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/, { message: 'SKU chỉ chứa chữ HOA, số, _ hoặc -' }),
  type: z.enum(PRODUCT_TYPES),
  price: z.number().int().positive({ message: 'Giá phải lớn hơn 0' }),
  cost: z.number().int().min(0).optional().nullable(),
  description: z.string().max(2000).optional().or(z.literal('')),
  photos: z.array(z.string().url()).optional(),
  // Type-specific fields
  linkedCourseId: z.string().uuid().optional().nullable(),
  sessionsCount: z.number().int().min(1).max(99).optional().nullable(),
  stockQuantity: z.number().int().min(0).optional().nullable(),
  lowStockThreshold: z.number().int().min(1).max(100).optional().nullable(),
})

// Conditional validation theo type
function refineByType(data: z.infer<typeof baseSchema>, ctx: z.RefinementCtx) {
  if (data.type === 'course' && !data.linkedCourseId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['linkedCourseId'],
      message: 'Sản phẩm loại "Khoá học" phải liên kết với 1 khoá có sẵn',
    })
  }
  if (data.type === 'improvement_pack' && !data.sessionsCount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sessionsCount'],
      message: 'Pack buổi cải thiện phải có số buổi',
    })
  }
  if (data.type === 'physical') {
    if (data.stockQuantity == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['stockQuantity'],
        message: 'Đồ vật lý phải có số lượng tồn kho',
      })
    }
  }
}

export const createProductSchema = baseSchema.superRefine(refineByType)
export const updateProductSchema = baseSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  type: z.enum(PRODUCT_TYPES).optional(),
  isActive: z.enum(['true', 'false']).optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductListQuery = z.infer<typeof productListQuerySchema>
