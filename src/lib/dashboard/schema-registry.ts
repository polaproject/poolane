/**
 * Schema Registry — liệt kê các bảng + cột owner có thể pivot.
 * Phase 17 MVP: seed 10 bảng cốt lõi (~80% nhu cầu phân tích).
 *
 * Mở rộng sau: auto-gen từ Prisma schema qua scripts/gen-schema-registry.mjs
 */

import type { AggregationOp, ColumnFormat } from './types'

export type ColumnDataType = 'string' | 'number' | 'date' | 'enum' | 'boolean' | 'json'

export interface ColumnMeta {
  name: string                              // 'status' — actual DB column (snake_case)
  vietnameseName: string                    // 'Trạng thái' — UI label
  type: ColumnDataType
  enumValues?: Array<{ value: string; label: string }>
  description: string
  isPII?: boolean
  defaultAggregation?: AggregationOp
  defaultFormat?: ColumnFormat
  /** Đánh dấu column là date/timestamp dùng để filter time range */
  isTimeField?: boolean
}

export interface RelationMeta {
  fromColumn: string                         // 'student_id'
  toTable: string                            // 'students'
  toColumn: string                           // 'id'
  type: 'belongs_to' | 'has_many'
  description: string
}

export interface TableMeta {
  name: string                               // 'students' — Postgres table name
  vietnameseName: string                     // 'Học viên'
  category: 'core' | 'finance' | 'content' | 'ops' | 'system'
  description: string
  columns: ColumnMeta[]
  relations: RelationMeta[]
}

export const SCHEMA_REGISTRY: TableMeta[] = [
  {
    name: 'users',
    vietnameseName: 'Tài khoản',
    category: 'core',
    description: 'Bảng tài khoản người dùng (admin/staff/student). Mỗi user có thể là HV hoặc nhân viên.',
    columns: [
      { name: 'id', vietnameseName: 'ID', type: 'string', description: 'Mã định danh duy nhất', defaultAggregation: 'count_distinct' },
      { name: 'role', vietnameseName: 'Vai trò', type: 'enum', description: 'Vai trò tài khoản trong hệ thống',
        enumValues: [
          { value: 'admin', label: 'Quản trị viên' },
          { value: 'staff', label: 'Trợ lý' },
          { value: 'student', label: 'Học viên' },
        ] },
      { name: 'account_source', vietnameseName: 'Nguồn tạo', type: 'enum', description: 'Kênh tạo tài khoản',
        enumValues: [
          { value: 'online_signup', label: 'Tự đăng ký online' },
          { value: 'walk_in', label: 'Walk-in tại bể' },
          { value: 'staff_created', label: 'Staff tạo giúp' },
        ] },
      { name: 'gender', vietnameseName: 'Giới tính', type: 'string', description: 'Nam / Nữ / Khác' },
      { name: 'province', vietnameseName: 'Tỉnh/Thành', type: 'string', description: 'Tỉnh thành cư trú' },
      { name: 'dob', vietnameseName: 'Ngày sinh', type: 'date', description: 'Ngày sinh — dùng tính độ tuổi' },
      { name: 'is_active', vietnameseName: 'Còn hoạt động', type: 'boolean', description: 'Tài khoản có còn active không' },
      { name: 'last_login_at', vietnameseName: 'Đăng nhập gần nhất', type: 'date', description: 'Thời điểm đăng nhập gần đây nhất', isTimeField: true },
      { name: 'created_at', vietnameseName: 'Ngày tạo', type: 'date', description: 'Thời điểm tạo tài khoản', isTimeField: true },
    ],
    relations: [],
  },
  {
    name: 'students',
    vietnameseName: 'Học viên',
    category: 'core',
    description: 'Thông tin riêng học viên: status, target, kỹ năng. Mỗi student liên kết 1 user.',
    columns: [
      { name: 'id', vietnameseName: 'ID', type: 'string', description: 'Mã student', defaultAggregation: 'count_distinct' },
      { name: 'user_id', vietnameseName: 'User ID', type: 'string', description: 'FK đến users' },
      { name: 'student_code', vietnameseName: 'Mã HV', type: 'string', description: 'Format POLA-YYYY-XXXX' },
      { name: 'status', vietnameseName: 'Trạng thái', type: 'enum', description: 'Trạng thái HV trong hệ thống',
        enumValues: [
          { value: 'prospect', label: 'Tiềm năng' },
          { value: 'enrolled', label: 'Đã đặt cọc' },
          { value: 'active', label: 'Đang học' },
          { value: 'extension', label: 'Ôn luyện' },
          { value: 'completed', label: 'Đã hoàn thành' },
          { value: 'inactive', label: 'Vắng dài' },
          { value: 'refunded', label: 'Đã hoàn tiền' },
        ] },
      { name: 'last_attended_at', vietnameseName: 'Buổi học cuối', type: 'date', description: 'Buổi học gần nhất HV tham gia', isTimeField: true },
      { name: 'marketing_source', vietnameseName: 'Nguồn marketing', type: 'string', description: 'HV biết đến trung tâm qua kênh nào' },
      { name: 'created_at', vietnameseName: 'Ngày tạo', type: 'date', description: 'Thời điểm tạo hồ sơ HV', isTimeField: true },
    ],
    relations: [
      { fromColumn: 'user_id', toTable: 'users', toColumn: 'id', type: 'belongs_to', description: 'HV này là tài khoản nào' },
    ],
  },
  {
    name: 'courses',
    vietnameseName: 'Khoá học',
    category: 'core',
    description: '3 khoá cố định: Ếch (ECH), Sải (SAI), Bướm (BUOM).',
    columns: [
      { name: 'id', vietnameseName: 'ID', type: 'string', description: 'Mã khoá', defaultAggregation: 'count_distinct' },
      { name: 'code', vietnameseName: 'Mã', type: 'enum', description: 'Mã viết tắt khoá',
        enumValues: [
          { value: 'ECH', label: 'Bơi Ếch' },
          { value: 'SAI', label: 'Bơi Sải' },
          { value: 'BUOM', label: 'Bơi Bướm' },
        ] },
      { name: 'name', vietnameseName: 'Tên', type: 'string', description: 'Tên đầy đủ' },
      { name: 'price', vietnameseName: 'Học phí', type: 'number', description: 'Học phí 10 buổi (VND)', defaultAggregation: 'sum',
        defaultFormat: { type: 'currency' } },
      { name: 'sessions_count', vietnameseName: 'Số buổi', type: 'number', description: 'Số buổi học chính (mặc định 10)' },
      { name: 'is_active', vietnameseName: 'Còn mở', type: 'boolean', description: 'Có đang nhận HV mới không' },
    ],
    relations: [],
  },
  {
    name: 'enrollments',
    vietnameseName: 'Đăng ký khoá',
    category: 'core',
    description: 'Mỗi enrollment = 1 HV đăng ký 1 khoá. HV có thể có nhiều enrollment.',
    columns: [
      { name: 'id', vietnameseName: 'ID', type: 'string', description: 'Mã enrollment', defaultAggregation: 'count_distinct' },
      { name: 'student_id', vietnameseName: 'HV ID', type: 'string', description: 'FK students' },
      { name: 'course_id', vietnameseName: 'Khoá ID', type: 'string', description: 'FK courses' },
      { name: 'payment_plan', vietnameseName: 'Phương án thanh toán', type: 'enum', description: 'A/B/C',
        enumValues: [
          { value: 'A_full', label: 'A - Đóng toàn bộ' },
          { value: 'B_course_first', label: 'B - Học phí trước' },
          { value: 'C_deposit', label: 'C - Cọc 30%' },
        ] },
      { name: 'status', vietnameseName: 'Trạng thái', type: 'enum', description: 'Trạng thái enrollment',
        enumValues: [
          { value: 'active', label: 'Đang học' },
          { value: 'extension', label: 'Ôn luyện' },
          { value: 'completed', label: 'Hoàn thành' },
          { value: 'refunded', label: 'Đã hoàn tiền' },
          { value: 'cancelled', label: 'Đã huỷ' },
        ] },
      { name: 'deposit_amount', vietnameseName: 'Tiền cọc', type: 'number', description: 'Số tiền đã đặt cọc', defaultAggregation: 'sum', defaultFormat: { type: 'currency' } },
      { name: 'total_paid', vietnameseName: 'Đã đóng', type: 'number', description: 'Tổng tiền HV đã đóng cho enrollment này', defaultAggregation: 'sum', defaultFormat: { type: 'currency' } },
      { name: 'extension_sessions_used', vietnameseName: 'Buổi ôn đã dùng', type: 'number', description: 'Số buổi ôn luyện đã dùng (sau buổi 10)', defaultAggregation: 'sum' },
      { name: 'enrolled_at', vietnameseName: 'Ngày đăng ký', type: 'date', description: 'Thời điểm tạo enrollment', isTimeField: true },
      { name: 'started_at', vietnameseName: 'Ngày bắt đầu học', type: 'date', description: 'Buổi 1', isTimeField: true },
      { name: 'graduation_date', vietnameseName: 'Ngày tốt nghiệp', type: 'date', description: 'Hoàn thành khoá', isTimeField: true },
    ],
    relations: [
      { fromColumn: 'student_id', toTable: 'students', toColumn: 'id', type: 'belongs_to', description: 'Enrollment thuộc HV nào' },
      { fromColumn: 'course_id', toTable: 'courses', toColumn: 'id', type: 'belongs_to', description: 'Khoá học' },
    ],
  },
  {
    name: 'class_sessions',
    vietnameseName: 'Buổi học',
    category: 'ops',
    description: 'Mỗi class_session = 1 ngày × ca cụ thể (sáng/chiều). Lịch tuần.',
    columns: [
      { name: 'id', vietnameseName: 'ID', type: 'string', description: 'Mã buổi học', defaultAggregation: 'count_distinct' },
      { name: 'date', vietnameseName: 'Ngày', type: 'date', description: 'Ngày diễn ra buổi học', isTimeField: true },
      { name: 'time_slot', vietnameseName: 'Ca', type: 'enum', description: 'Sáng (5:30-7:30) hoặc Chiều (18:00-20:00)',
        enumValues: [
          { value: 'morning', label: 'Sáng' },
          { value: 'evening', label: 'Chiều' },
        ] },
      { name: 'capacity', vietnameseName: 'Sức chứa', type: 'number', description: '5 (sáng) hoặc 7 (chiều)' },
      { name: 'status', vietnameseName: 'Trạng thái', type: 'enum', description: 'Trạng thái buổi',
        enumValues: [
          { value: 'scheduled', label: 'Đã lên lịch' },
          { value: 'in_progress', label: 'Đang diễn ra' },
          { value: 'completed', label: 'Đã xong' },
          { value: 'cancelled', label: 'Đã huỷ' },
        ] },
    ],
    relations: [],
  },
  {
    name: 'attendance',
    vietnameseName: 'Điểm danh',
    category: 'ops',
    description: 'Mỗi record = 1 HV điểm danh ở 1 buổi. Có thể là present, absent, walk_in.',
    columns: [
      { name: 'id', vietnameseName: 'ID', type: 'string', description: 'Mã attendance', defaultAggregation: 'count_distinct' },
      { name: 'session_id', vietnameseName: 'Buổi ID', type: 'string', description: 'FK class_sessions' },
      { name: 'student_id', vietnameseName: 'HV ID', type: 'string', description: 'FK students' },
      { name: 'status', vietnameseName: 'Trạng thái', type: 'enum', description: 'Có mặt / vắng / walk-in',
        enumValues: [
          { value: 'present', label: 'Có mặt' },
          { value: 'absent', label: 'Vắng' },
          { value: 'walk_in', label: 'Walk-in' },
        ] },
      { name: 'marked_at', vietnameseName: 'Giờ điểm danh', type: 'date', description: 'Thời điểm điểm danh', isTimeField: true },
    ],
    relations: [
      { fromColumn: 'session_id', toTable: 'class_sessions', toColumn: 'id', type: 'belongs_to', description: 'Buổi học' },
      { fromColumn: 'student_id', toTable: 'students', toColumn: 'id', type: 'belongs_to', description: 'Học viên' },
    ],
  },
  {
    name: 'payments',
    vietnameseName: 'Thanh toán',
    category: 'finance',
    description: 'Mọi giao dịch tiền: học phí, vé bơi, đơn shop, hoàn tiền. Reference linh hoạt.',
    columns: [
      { name: 'id', vietnameseName: 'ID', type: 'string', description: 'Mã giao dịch', defaultAggregation: 'count_distinct' },
      { name: 'student_id', vietnameseName: 'HV ID', type: 'string', description: 'FK students' },
      { name: 'amount', vietnameseName: 'Số tiền', type: 'number', description: 'Số tiền giao dịch (VND, có thể âm nếu hoàn tiền)', defaultAggregation: 'sum', defaultFormat: { type: 'currency' } },
      { name: 'type', vietnameseName: 'Loại', type: 'enum', description: 'Loại giao dịch',
        enumValues: [
          { value: 'course_fee', label: 'Học phí' },
          { value: 'pool_ticket', label: 'Vé bơi' },
          { value: 'shop', label: 'Đơn shop' },
          { value: 'refund', label: 'Hoàn tiền' },
          { value: 'adjustment', label: 'Điều chỉnh' },
        ] },
      { name: 'payment_method', vietnameseName: 'Phương thức', type: 'enum', description: 'Cash/transfer/card',
        enumValues: [
          { value: 'cash', label: 'Tiền mặt' },
          { value: 'bank_transfer', label: 'Chuyển khoản' },
          { value: 'card', label: 'Thẻ' },
          { value: 'other', label: 'Khác' },
        ] },
      { name: 'is_reversal', vietnameseName: 'Bút toán đảo', type: 'boolean', description: 'True nếu là giao dịch huỷ/đảo' },
      { name: 'recorded_at', vietnameseName: 'Thời điểm', type: 'date', description: 'Thời điểm ghi nhận thanh toán', isTimeField: true },
    ],
    relations: [
      { fromColumn: 'student_id', toTable: 'students', toColumn: 'id', type: 'belongs_to', description: 'HV thanh toán' },
    ],
  },
  {
    name: 'orders',
    vietnameseName: 'Đơn hàng shop',
    category: 'finance',
    description: 'Đơn hàng từ shop (khoá / pack cải thiện / dịch vụ / đồ vật lý).',
    columns: [
      { name: 'id', vietnameseName: 'ID', type: 'string', description: 'Mã đơn hàng', defaultAggregation: 'count_distinct' },
      { name: 'student_id', vietnameseName: 'HV ID', type: 'string', description: 'FK students' },
      { name: 'total_amount', vietnameseName: 'Tổng tiền', type: 'number', description: 'Tổng tiền trước giảm', defaultAggregation: 'sum', defaultFormat: { type: 'currency' } },
      { name: 'discount_amount', vietnameseName: 'Giảm giá', type: 'number', description: 'Số tiền giảm từ voucher', defaultAggregation: 'sum', defaultFormat: { type: 'currency' } },
      { name: 'final_amount', vietnameseName: 'Thực thu', type: 'number', description: 'Tổng tiền thực HV phải đóng', defaultAggregation: 'sum', defaultFormat: { type: 'currency' } },
      { name: 'status', vietnameseName: 'Trạng thái', type: 'enum', description: 'Trạng thái đơn',
        enumValues: [
          { value: 'pending', label: 'Chờ duyệt' },
          { value: 'approved', label: 'Đã duyệt' },
          { value: 'paid', label: 'Đã thanh toán' },
          { value: 'fulfilled', label: 'Đã hoàn tất' },
          { value: 'cancelled', label: 'Đã huỷ' },
        ] },
      { name: 'created_at', vietnameseName: 'Ngày đặt', type: 'date', description: 'Thời điểm tạo đơn', isTimeField: true },
      { name: 'fulfilled_at', vietnameseName: 'Ngày hoàn tất', type: 'date', description: 'Thời điểm hoàn tất đơn', isTimeField: true },
    ],
    relations: [
      { fromColumn: 'student_id', toTable: 'students', toColumn: 'id', type: 'belongs_to', description: 'HV đặt đơn' },
    ],
  },
  {
    name: 'pool_tickets',
    vietnameseName: 'Vé bơi',
    category: 'finance',
    description: 'Vé bơi của HV. Lần đầu 1.3M = 10 buổi, các lần sau tự mua.',
    columns: [
      { name: 'id', vietnameseName: 'ID', type: 'string', description: 'Mã vé', defaultAggregation: 'count_distinct' },
      { name: 'student_id', vietnameseName: 'HV ID', type: 'string', description: 'FK students' },
      { name: 'ticket_type', vietnameseName: 'Loại vé', type: 'enum', description: 'Vé lần đầu hoặc lần sau',
        enumValues: [
          { value: 'first', label: 'Lần đầu (1.3M)' },
          { value: 'subsequent', label: 'Lần 2 trở đi' },
          { value: 'single', label: 'Lượt' },
          { value: 'weekly', label: 'Tuần' },
          { value: 'daily', label: 'Ngày' },
          { value: 'monthly', label: 'Tháng' },
        ] },
      { name: 'sessions_used', vietnameseName: 'Đã dùng', type: 'number', description: 'Số buổi đã dùng', defaultAggregation: 'sum' },
      { name: 'total_sessions', vietnameseName: 'Tổng buổi', type: 'number', description: 'Số buổi tổng cộng', defaultAggregation: 'sum' },
      { name: 'price_paid', vietnameseName: 'Giá đã trả', type: 'number', description: 'Số tiền HV đã trả cho vé này', defaultAggregation: 'sum', defaultFormat: { type: 'currency' } },
      { name: 'is_active', vietnameseName: 'Còn hiệu lực', type: 'boolean', description: 'Vé còn dùng được không' },
      { name: 'purchased_at', vietnameseName: 'Ngày mua', type: 'date', description: 'Thời điểm mua vé', isTimeField: true },
    ],
    relations: [
      { fromColumn: 'student_id', toTable: 'students', toColumn: 'id', type: 'belongs_to', description: 'HV sở hữu vé' },
    ],
  },
  {
    name: 'assessments',
    vietnameseName: 'Đánh giá kỹ năng',
    category: 'core',
    description: 'Mỗi assessment = 1 lần đánh giá kỹ năng HV (initial/quick/detailed/graduation).',
    columns: [
      { name: 'id', vietnameseName: 'ID', type: 'string', description: 'Mã đánh giá', defaultAggregation: 'count_distinct' },
      { name: 'student_id', vietnameseName: 'HV ID', type: 'string', description: 'FK students' },
      { name: 'course_id', vietnameseName: 'Khoá ID', type: 'string', description: 'FK courses' },
      { name: 'session_number', vietnameseName: 'Số buổi', type: 'number', description: 'Đánh giá ở buổi thứ mấy (1-10+)' },
      { name: 'type', vietnameseName: 'Loại đánh giá', type: 'enum', description: 'Initial/quick/detailed/graduation',
        enumValues: [
          { value: 'initial', label: 'Ban đầu' },
          { value: 'quick', label: 'Nhanh' },
          { value: 'detailed', label: 'Chi tiết' },
          { value: 'graduation', label: 'Tốt nghiệp' },
          { value: 'improvement', label: 'Cải thiện' },
        ] },
      { name: 'assessment_date', vietnameseName: 'Ngày đánh giá', type: 'date', description: 'Thời điểm đánh giá', isTimeField: true },
    ],
    relations: [
      { fromColumn: 'student_id', toTable: 'students', toColumn: 'id', type: 'belongs_to', description: 'HV được đánh giá' },
      { fromColumn: 'course_id', toTable: 'courses', toColumn: 'id', type: 'belongs_to', description: 'Khoá học' },
    ],
  },
]

export function getTableMeta(tableName: string): TableMeta | undefined {
  return SCHEMA_REGISTRY.find(t => t.name === tableName)
}

export function getColumnMeta(tableName: string, columnName: string): ColumnMeta | undefined {
  return getTableMeta(tableName)?.columns.find(c => c.name === columnName)
}

/**
 * BFS join graph search: tìm chuỗi join từ rootTable đến targetTable.
 * Trả về null nếu không có đường nối qua relations trong registry.
 */
export function findJoinPath(rootTable: string, targetTable: string, maxDepth = 3): string[] | null {
  if (rootTable === targetTable) return [rootTable]
  const visited = new Set<string>([rootTable])
  const queue: Array<{ table: string; path: string[] }> = [{ table: rootTable, path: [rootTable] }]

  while (queue.length > 0) {
    const { table, path } = queue.shift()!
    if (path.length > maxDepth + 1) continue
    const meta = getTableMeta(table)
    if (!meta) continue

    // Tìm relations đi ra
    for (const rel of meta.relations) {
      if (!visited.has(rel.toTable)) {
        const newPath = [...path, rel.toTable]
        if (rel.toTable === targetTable) return newPath
        visited.add(rel.toTable)
        queue.push({ table: rel.toTable, path: newPath })
      }
    }
    // Tìm relations đi vào (table khác belongs_to mình)
    for (const otherTable of SCHEMA_REGISTRY) {
      for (const rel of otherTable.relations) {
        if (rel.toTable === table && !visited.has(otherTable.name)) {
          const newPath = [...path, otherTable.name]
          if (otherTable.name === targetTable) return newPath
          visited.add(otherTable.name)
          queue.push({ table: otherTable.name, path: newPath })
        }
      }
    }
  }
  return null
}
