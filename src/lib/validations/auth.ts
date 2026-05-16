import { z } from 'zod'

const phoneRegex = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/

export const registerSchema = z.object({
  fullName: z.string().min(2, { message: 'Họ tên phải có ít nhất 2 ký tự' }).max(100),
  phone: z.string().regex(phoneRegex, { message: 'Số điện thoại không hợp lệ' }),
  password: z.string().min(8, { message: 'Mật khẩu phải ít nhất 8 ký tự' }).max(100),
  dob: z.string().refine(val => {
    const date = new Date(val)
    if (isNaN(date.getTime())) return false
    const age = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365)
    return age >= 5 && age <= 100
  }, { message: 'Ngày sinh không hợp lệ' }),
  gender: z.enum(['male', 'female', 'other']),
  email: z.string().email({ message: 'Email không hợp lệ' }),
  // Cấu trúc đơn vị hành chính mới (sau 01/07/2025): bỏ cấp huyện. Chỉ
  // Tỉnh/Thành phố (bắt buộc) + Phường/Xã (tuỳ chọn).
  ward: z.string().max(100).optional(),
  district: z.string().max(100).optional().nullable(),
  province: z.string().min(1, { message: 'Vui lòng chọn tỉnh/thành phố' }).max(100),
  photoConsent: z.boolean(),
  termsAcknowledged: z.boolean().refine(v => v === true, { message: 'Cần xác nhận điều khoản sử dụng' }),
})

export const forgotPasswordSchema = z.object({
  phone: z.string().regex(phoneRegex, { message: 'Số điện thoại không hợp lệ' }),
  fullNameHint: z.string().max(100).optional(),
})

export const resetPasswordSchema = z.object({
  requestId: z.string().uuid(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
