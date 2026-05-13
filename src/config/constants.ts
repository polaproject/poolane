// Business constants — tất cả số nghiệp vụ tập trung tại đây
// Không hard-code rải rác trong code

export const CAPACITY = {
  MORNING_MAX: 5,
  MORNING_MIN: 3,
  EVENING_MAX: 7,
  EVENING_MIN: 2,
} as const

export const SESSION_TIMES = {
  MORNING: { start: '05:30', end: '07:30', label: 'Sáng' },
  EVENING: { start: '18:00', end: '20:00', label: 'Chiều' },
} as const

export const COURSE_PRICES = {
  ECH: 1_600_000,
  SAI: 2_100_000,
  BUOM: 3_500_000,
} as const

export const COURSE_NAMES = {
  ECH: 'Bơi Ếch',
  SAI: 'Bơi Sải',
  BUOM: 'Bơi Bướm',
} as const

export const COURSE_SESSIONS = {
  ECH: 10,
  SAI: 10,
  BUOM: 10,
} as const

export const POOL_TICKET = {
  FIRST_PRICE: 1_300_000,
  SESSIONS_INCLUDED: 10,
  MAX_SESSIONS: 12,           // Giáo viên có thể cho thêm 2 buổi
  SUBSEQUENT_MIN_PRICE: 65_000,
  PER_SESSION_VALUE: 130_000, // 1_300_000 / 10
  REFUND_RATE: 0.8,           // Hoàn 80% giá trị buổi chưa dùng
  LOW_STOCK_ALERT: 2,         // Cảnh báo khi còn ≤ 2 buổi
} as const

export const PAYMENT_DEPOSIT_RATE = 0.3 // 30% đặt cọc phương án C

export const REFUND_DEADLINE_DAYS = 30 // Hạn yêu cầu hoàn tiền

// Chính sách hoàn học phí theo số buổi đã học
// sessions: số buổi đã học TỐI THIỂU để áp mức này
export const COURSE_REFUND_TIERS = [
  { minSessions: 0,  maxSessions: 0,  rate: 0.5 }, // Chưa học: 50%
  { minSessions: 1,  maxSessions: 2,  rate: 0.4 }, // 1-2 buổi: 40%
  { minSessions: 3,  maxSessions: 4,  rate: 0.3 }, // 3-4 buổi: 30%
  { minSessions: 5,  maxSessions: 6,  rate: 0.2 }, // 5-6 buổi: 20%
  { minSessions: 7,  maxSessions: 999, rate: 0.1 }, // 7+ buổi: 10%
] as const

export const ASSESSMENT_CHECKPOINTS = [1, 3, 5, 7, 9, 10] as const

export const ASSESSMENT_SCALE = {
  MIN: 1,
  MAX: 5,
  GRADUATION_MIN: 3,         // Mọi kỹ năng phải ≥ 3
  KEY_SKILLS_MIN: 4,         // Kỹ năng phối hợp + thở phải ≥ 4
  CONTINUOUS_METERS_MIN: 25, // Bơi liên tục ≥ 25m
} as const

export const EXTENSION_STAGES = {
  GREEN_MAX: 5,   // 1-5 buổi: bình thường
  YELLOW_MAX: 10, // 6-10 buổi: cần chú ý
  // 11+: cần can thiệp
} as const

export const ABSENCE_ALERT_THRESHOLDS = {
  YELLOW_DAYS: 14, // Vắng 14-21 ngày → cảnh báo vàng
  RED_DAYS: 21,    // Vắng > 21 ngày → cảnh báo đỏ
} as const

// Kỹ năng theo khoá học
export const COURSE_SKILLS = {
  ECH: [
    { key: 'body_position', label: 'Tư thế thân người' },
    { key: 'leg_kick', label: 'Đạp chân ếch' },
    { key: 'arm_pull', label: 'Kéo tay' },
    { key: 'breathing', label: 'Thở' },
    { key: 'glide', label: 'Lướt nước (Glide)' },
    { key: 'coordination', label: 'Phối hợp tay–chân–thở' },
    { key: 'turn', label: 'Quay đầu hồ' },
    { key: 'endurance', label: 'Sức bền' },
  ],
  SAI: [
    { key: 'body_rotation', label: 'Tư thế & xoay hông' },
    { key: 'flutter_kick', label: 'Đập chân' },
    { key: 'entry', label: 'Vào tay (Entry)' },
    { key: 'high_elbow_catch', label: 'Kéo nước (High Elbow Catch)' },
    { key: 'arm_recovery', label: 'Phục hồi tay' },
    { key: 'side_breathing', label: 'Thở nghiêng' },
    { key: 'bilateral_breathing', label: 'Thở 2 bên (Bilateral)' },
    { key: 'turn', label: 'Quay đầu hồ' },
    { key: 'endurance_speed', label: 'Sức bền & tốc độ' },
  ],
  BUOM: [
    { key: 'undulation', label: 'Sóng người (Undulation)' },
    { key: 'dolphin_kick', label: 'Đạp chân cá heo' },
    { key: 'entry', label: 'Vào tay' },
    { key: 'pull', label: 'Kéo nước' },
    { key: 'arm_recovery', label: 'Phục hồi tay' },
    { key: 'breathing', label: 'Thở' },
    { key: 'rhythm', label: 'Nhịp điệu' },
    { key: 'endurance', label: 'Sức bền' },
  ],
} as const

// Kỹ năng quan trọng cần ≥ 4 để tốt nghiệp
export const KEY_SKILLS_FOR_GRADUATION = {
  ECH: ['coordination', 'breathing'],
  SAI: ['coordination', 'side_breathing'],
  BUOM: ['rhythm', 'breathing'],
} as const

export const SCALE_DESCRIPTIONS = {
  1: 'Chưa thực hiện được',
  2: 'Đang hình thành',
  3: 'Có thể tự làm',
  4: 'Khá tốt',
  5: 'Thành thục',
} as const

export const CURRENCY = 'VND'
export const TIMEZONE = 'Asia/Ho_Chi_Minh'
export const DATE_FORMAT = 'dd/MM/yyyy'
export const DATETIME_FORMAT = 'HH:mm dd/MM/yyyy'
