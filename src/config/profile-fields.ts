// Whitelist trường HV được tự sửa vs trường phải qua duyệt
// Nguồn chân lý duy nhất — dùng cho cả zod validation và UI

export const SELF_EDITABLE_FIELDS = [
  'occupation',
  'healthNotes',
  'emergencyContactName',
  'emergencyContactPhone',
] as const

export const APPROVAL_REQUIRED_FIELDS = [
  'fullName',
  'dob',
  'phone',
  'ward',
  'district',
  'province',
  'addressStreet',
  'idCardNumber',
] as const

export type SelfEditableField = (typeof SELF_EDITABLE_FIELDS)[number]
export type ApprovalRequiredField = (typeof APPROVAL_REQUIRED_FIELDS)[number]

export const FIELD_LABELS: Record<SelfEditableField | ApprovalRequiredField, string> = {
  occupation: 'Nghề nghiệp',
  healthNotes: 'Ghi chú sức khoẻ',
  emergencyContactName: 'Liên hệ khẩn — Tên',
  emergencyContactPhone: 'Liên hệ khẩn — SĐT',
  fullName: 'Họ và tên',
  dob: 'Ngày sinh',
  phone: 'Số điện thoại',
  ward: 'Phường/Xã',
  district: 'Quận/Huyện',
  province: 'Tỉnh/Thành phố',
  addressStreet: 'Địa chỉ chi tiết',
  idCardNumber: 'Số CCCD/CMND',
}

export function isSelfEditable(field: string): field is SelfEditableField {
  return (SELF_EDITABLE_FIELDS as readonly string[]).includes(field)
}

export function isApprovalRequired(field: string): field is ApprovalRequiredField {
  return (APPROVAL_REQUIRED_FIELDS as readonly string[]).includes(field)
}
