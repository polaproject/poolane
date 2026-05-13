import { z } from 'zod'

export const createSessionSchema = z.object({
  date: z.string().refine(v => !isNaN(Date.parse(v)), 'Ngày không hợp lệ'),
  timeSlot: z.enum(['morning', 'evening'], {
    errorMap: () => ({ message: 'Chọn ca sáng hoặc chiều' })
  }),
  notes: z.string().max(500).optional(),
})

export const registerSessionSchema = z.object({
  sessionId: z.string().uuid(),
  courseId: z.string().uuid().optional(),
})

export const approveRegistrationSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectedReason: z.enum(['capacity_full', 'skill_mismatch', 'teacher_decision', 'other']).optional(),
  rejectedReasonText: z.string().max(300).optional(),
})

export const markAttendanceSchema = z.object({
  records: z.array(z.object({
    studentId: z.string().uuid(),
    status: z.enum(['present', 'absent', 'walk_in']),
    notes: z.string().max(200).optional(),
  }))
})

export const cancelSessionSchema = z.object({
  reason: z.string().min(5, 'Vui lòng nhập lý do huỷ'),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type RegisterSessionInput = z.infer<typeof registerSessionSchema>
export type ApproveRegistrationInput = z.infer<typeof approveRegistrationSchema>
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>
