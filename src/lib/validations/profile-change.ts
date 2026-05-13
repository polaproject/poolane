import { z } from 'zod'
import { APPROVAL_REQUIRED_FIELDS, SELF_EDITABLE_FIELDS } from '@/config/profile-fields'

const phoneRegex = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/

// Self-edit: HV tự sửa các trường mềm
export const selfEditProfileSchema = z.object({
  occupation: z.string().max(100).optional().or(z.literal('')),
  healthNotes: z.string().max(500).optional().or(z.literal('')),
  emergencyContactName: z.string().max(100).optional().or(z.literal('')),
  emergencyContactPhone: z.string().max(20).optional().or(z.literal('')),
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Cần cung cấp ít nhất 1 trường để cập nhật' }
)

// Field-level validation cho từng trường định danh
const fieldValueValidators: Record<string, z.ZodTypeAny> = {
  fullName: z.string().min(2, { message: 'Họ tên phải có ít nhất 2 ký tự' }).max(100),
  phone: z.string().regex(phoneRegex, { message: 'Số điện thoại không hợp lệ' }),
  dob: z.string().refine(val => {
    const date = new Date(val)
    if (isNaN(date.getTime())) return false
    const age = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365)
    return age >= 5 && age <= 100
  }, { message: 'Ngày sinh không hợp lệ' }),
  ward: z.string().min(1, { message: 'Vui lòng chọn phường/xã' }).max(100),
  district: z.string().min(1, { message: 'Vui lòng chọn quận/huyện' }).max(100),
  province: z.string().min(1, { message: 'Vui lòng chọn tỉnh/thành phố' }).max(100),
  addressStreet: z.string().max(200),
  idCardNumber: z.string().regex(/^\d{9}$|^\d{12}$/, { message: 'Số CCCD/CMND không hợp lệ' }),
}

// Mỗi entry { old, new } cho 1 field
const fieldChangeEntry = z.object({
  old: z.union([z.string(), z.null()]),
  new: z.string(),
})

export const createProfileChangeRequestSchema = z.object({
  fieldChanges: z.record(z.string(), fieldChangeEntry)
    .refine(obj => Object.keys(obj).length > 0, { message: 'Cần ít nhất 1 trường để yêu cầu cập nhật' })
    .refine(
      obj => Object.keys(obj).every(k => (APPROVAL_REQUIRED_FIELDS as readonly string[]).includes(k)),
      { message: 'Có trường không thuộc danh sách cần duyệt' }
    )
    .superRefine((obj, ctx) => {
      for (const [field, entry] of Object.entries(obj)) {
        const validator = fieldValueValidators[field]
        if (validator) {
          const result = validator.safeParse(entry.new)
          if (!result.success) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [field, 'new'],
              message: result.error.issues[0]?.message ?? 'Giá trị không hợp lệ',
            })
          }
        }
      }
    }),
  reason: z.string().max(500).optional().or(z.literal('')),
})

export const processProfileChangeRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('approve'),
    notes: z.string().max(500).optional().or(z.literal('')),
  }),
  z.object({
    action: z.literal('reject'),
    notes: z.string().min(1, { message: 'Cần nhập lý do từ chối' }).max(500),
  }),
])

export const profileChangeRequestListQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type SelfEditProfileInput = z.infer<typeof selfEditProfileSchema>
export type CreateProfileChangeRequestInput = z.infer<typeof createProfileChangeRequestSchema>
export type ProcessProfileChangeRequestInput = z.infer<typeof processProfileChangeRequestSchema>

// Helper export for UI form
export { SELF_EDITABLE_FIELDS, APPROVAL_REQUIRED_FIELDS }
