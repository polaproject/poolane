// TypeScript types cho toàn bộ hệ thống Poolane
// Dùng cho API responses, UI props, và form data

// ─── API Response Format ───────────────────────────────
export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string; details?: unknown } }

// ─── Users ────────────────────────────────────────────
export type UserRole = 'admin' | 'staff' | 'student'

export type UserDTO = {
  id: string
  email: string
  phone: string | null
  fullName: string
  role: UserRole
  isActive: boolean
  createdAt: Date
}

// ─── Students ─────────────────────────────────────────
export type StudentStatus =
  | 'prospect'
  | 'enrolled'
  | 'active'
  | 'extension'
  | 'completed'
  | 'inactive'
  | 'refunded'

export type StudentDTO = {
  id: string
  userId: string
  studentCode: string
  status: StudentStatus
  // User fields (joined)
  fullName: string
  phone: string | null
  email: string
  dob: Date | null
  gender: string | null
  ward: string | null
  district: string | null
  province: string | null
  addressStreet: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  occupation: string | null
  healthNotes: string | null
  // Student-specific
  swimmingExperience: string | null
  learningGoal: string | null
  marketingSource: string | null
  lastAttendedAt: Date | null
  createdAt: Date
}

export type StudentListItem = Pick<
  StudentDTO,
  | 'id'
  | 'studentCode'
  | 'fullName'
  | 'phone'
  | 'status'
  | 'lastAttendedAt'
  | 'createdAt'
> & {
  activeEnrollmentsCount: number
  poolTicketSessionsLeft: number | null
}

export type CreateStudentInput = {
  // Bắt buộc
  fullName: string
  phone: string
  email: string
  dob: string        // ISO date string
  gender: string
  ward: string
  district: string
  province: string
  // Tuỳ chọn
  addressStreet?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  occupation?: string
  healthNotes?: string
  swimmingExperience?: string
  learningGoal?: string
  marketingSource?: string
  // Consents
  photoConsent: boolean
  imageConsentMarketing: boolean
  refundPolicyAcknowledged: boolean
  termsAcknowledged: boolean
}

export type UpdateStudentInput = Partial<Omit<CreateStudentInput, 'phone' | 'email'>>

// ─── Courses ───────────────────────────────────────────
export type CourseCode = 'ECH' | 'SAI' | 'BUOM'

export type CourseDTO = {
  id: string
  code: CourseCode
  name: string
  price: number
  sessionsCount: number
  description: string | null
  isActive: boolean
}

// ─── Enrollments ──────────────────────────────────────
export type PaymentPlan = 'A_full' | 'B_course_first' | 'C_deposit'
export type EnrollmentStatus = 'active' | 'extension' | 'completed' | 'refunded' | 'cancelled'

export type EnrollmentDTO = {
  id: string
  studentId: string
  courseId: string
  courseName: string
  courseCode: CourseCode
  paymentPlan: PaymentPlan
  depositAmount: number
  totalPaid: number
  totalFee: number
  remainingAmount: number
  paymentDeadline: Date | null
  status: EnrollmentStatus
  extensionSessionsUsed: number
  enrolledAt: Date
  startedAt: Date | null
  graduationDate: Date | null
}

export type CreateEnrollmentInput = {
  studentId: string
  courseId: string
  paymentPlan: PaymentPlan
  depositAmount?: number    // Required for C_deposit
}

// ─── Pool Tickets ─────────────────────────────────────
export type TicketType = 'first' | 'subsequent' | 'single' | 'weekly' | 'daily' | 'monthly'

export type PoolTicketDTO = {
  id: string
  studentId: string
  ticketType: TicketType
  totalSessions: number
  maxSessions: number
  sessionsUsed: number
  sessionsRemaining: number
  pricePaid: number
  isActive: boolean
  purchasedAt: Date
  expiresAt: Date | null
  isLowStock: boolean   // sessionsRemaining <= 2
}

export type CreatePoolTicketInput = {
  studentId: string
  ticketType: TicketType
  pricePaid: number
  totalSessions?: number   // Default 10 for first ticket
}

// ─── Student Notes ─────────────────────────────────────
export type StudentNoteDTO = {
  id: string
  studentId: string
  note: string
  isPrivate: boolean
  createdBy: string
  createdByName: string
  createdAt: Date
}

// ─── Profile Change Requests ───────────────────────────
export type ProfileChangeRequestDTO = {
  id: string
  studentId: string
  studentName: string
  fieldChanges: Record<string, { old: unknown; new: unknown }>
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: Date
  processedAt: Date | null
  processedNotes: string | null
}

// ─── Pagination ────────────────────────────────────────
export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type PaginationParams = {
  page?: number
  pageSize?: number
  search?: string
}
