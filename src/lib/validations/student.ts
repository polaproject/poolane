import { z } from 'zod'

// Validation cho số điện thoại Việt Nam
const phoneRegex = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/

export const createStudentSchema = z.object({
  // Bắt buộc
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(100),
  phone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  dob: z.string().refine(val => {
    const date = new Date(val)
    const age = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365)
    return age >= 5 && age <= 100
  }, 'Ngày sinh không hợp lệ'),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Vui lòng chọn giới tính' })
  }),
  ward: z.string().min(1, 'Vui lòng chọn phường/xã'),
  district: z.string().min(1, 'Vui lòng chọn quận/huyện'),
  province: z.string().min(1, 'Vui lòng chọn tỉnh/thành phố'),

  // Tuỳ chọn
  addressStreet: z.string().max(200).optional().or(z.literal('')),
  emergencyContactName: z.string().max(100).optional().or(z.literal('')),
  emergencyContactPhone: z.string().regex(phoneRegex).optional().or(z.literal('')),
  occupation: z.string().max(100).optional().or(z.literal('')),
  healthNotes: z.string().max(500).optional().or(z.literal('')),
  swimmingExperience: z.string().max(500).optional().or(z.literal('')),
  learningGoal: z.string().max(500).optional().or(z.literal('')),
  marketingSource: z.string().max(100).optional().or(z.literal('')),

  // Consents — bắt buộc tick
  photoConsent: z.boolean().refine(v => v === true, 'Cần đồng ý điều khoản hình ảnh'),
  imageConsentMarketing: z.boolean().optional().default(false),
  refundPolicyAcknowledged: z.boolean().refine(v => v === true, 'Cần xác nhận đã đọc chính sách hoàn tiền'),
  termsAcknowledged: z.boolean().refine(v => v === true, 'Cần xác nhận điều khoản sử dụng'),
})

export const updateStudentSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  dob: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  ward: z.string().min(1).optional(),
  district: z.string().min(1).optional(),
  province: z.string().min(1).optional(),
  addressStreet: z.string().max(200).optional().or(z.literal('')),
  emergencyContactName: z.string().max(100).optional().or(z.literal('')),
  emergencyContactPhone: z.string().max(20).optional().or(z.literal('')),
  occupation: z.string().max(100).optional().or(z.literal('')),
  healthNotes: z.string().max(500).optional().or(z.literal('')),
  swimmingExperience: z.string().max(500).optional().or(z.literal('')),
  learningGoal: z.string().max(500).optional().or(z.literal('')),
  marketingSource: z.string().max(100).optional().or(z.literal('')),
  status: z.enum(['prospect', 'enrolled', 'active', 'extension', 'completed', 'inactive', 'refunded']).optional(),
})

export const studentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['prospect', 'enrolled', 'active', 'extension', 'completed', 'inactive', 'refunded']).optional(),
  sortBy: z.enum(['fullName', 'createdAt', 'lastAttendedAt', 'studentCode']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
export type StudentListQuery = z.infer<typeof studentListQuerySchema>
