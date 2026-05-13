# Pola Project — Hệ Thống Quản Lý Lớp Bơi

> **File này là nguồn chân lý duy nhất của dự án.** AI phải đọc trước khi làm bất cứ việc gì. Người dùng cập nhật mỗi khi có quyết định mới.

---

## MỤC LỤC

1. [Tổng Quan](#1-tổng-quan-dự-án)
2. [Brand & Identity](#2-brand--identity)
3. [Tech Stack](#3-tech-stack)
4. [Quy Ước Code & API](#4-quy-ước-code--api)
5. [Roles & Access Control](#5-roles--access-control)
6. [Database Schema](#6-database-schema)
7. [Business Rules](#7-business-rules-quan-trọng-nhất)
8. [Hệ Thống Đánh Giá](#8-hệ-thống-đánh-giá-kỹ-năng)
9. [Operational Workflows](#9-operational-workflows)
10. [Features by Module](#10-features-by-module)
11. [Development Roadmap](#11-development-roadmap)
12. [AI Collaboration Rules](#12-ai-collaboration-rules)
13. [Logging & Traceability](#13-logging--traceability)
14. [Debugging Strategy](#14-debugging-strategy)
15. [Security & Privacy](#15-security--privacy)
16. [Testing Strategy](#16-testing-strategy)
17. [Deployment](#17-deployment--operations)

---

## 1. Tổng Quan Dự Án

**Sản phẩm:** Hệ thống quản lý trung tâm dạy bơi — web app (responsive cho cả mobile và desktop).

**Người dùng hệ thống (3 roles):**
- **Admin** — Chủ lớp, kiêm giáo viên duy nhất hiện tại
- **Staff (Trợ lý)** — Hỗ trợ học viên, duyệt đăng ký, tạo nội dung
- **Student (Học viên)** — Người học, độ tuổi 16–40, chủ yếu người lớn

**Quy mô hiện tại:**
- 200+ học viên
- 1 hồ bơi
- 2 ca/ngày: Sáng 5:30–7:30, Chiều 18:00–20:00
- Sức chứa: Sáng tối đa 5, Chiều tối đa 7

**Mục tiêu hệ thống:**
- Thay thế hoàn toàn workflow Google Sheet + nhắn tin Zalo hiện tại
- Tự động hoá đăng ký, duyệt, điểm danh, thông báo, thanh toán
- Cung cấp hệ thống đánh giá kỹ năng chuẩn hoá
- Tạo trải nghiệm chuyên nghiệp cho học viên (web giới thiệu, theo dõi tiến độ, video bơi)

**Người build:** Owner (non-developer) làm việc với AI (Claude Code). AI viết toàn bộ code.

---

## 2. Brand & Identity

### Kiến Trúc Thương Hiệu

**Pola Project** là thương hiệu mẹ gồm 3 dự án con dạy 3 kỹ năng quan trọng nhất của con người:

```
POLA PROJECT (thương hiệu mẹ)
├── POOLANE — Bơi lội        ← Hệ thống đang build
├── POLANG  — Ngoại ngữ      (tương lai)
└── POLATA  — Phân tích dữ liệu (tương lai)
```

**Tên "Pola"** = viết tắt của Polaris — ngôi sao Bắc Đẩu, luôn đứng yên giữa bầu trời, dẫn đường cho người lênh đênh trên biển khơi tìm đúng hướng đi.

### Thông Tin Domain & Triển Khai

**Domain hiện có:** `polaproject.com` (mua qua Matbao, chưa trỏ DNS)
**Quyết định đã chốt:** `polaproject.com` dùng trực tiếp cho Poolane (lớp bơi) — không tách subdomain.

```
polaproject.com  →  Toàn bộ hệ thống Poolane
                    (landing + quản lý lớp bơi)
```

Khi Polang / Polata ra mắt → mua domain riêng cho từng project (polang.vn, polata.vn...). Lúc đó mới xây trang parent brand.

**Email gửi đi:** `support@polaproject.com` (cần setup Google Workspace)

### Brand Essence

**Triết lý:** *"Dạy bơi không chỉ để bơi"* — kết nối thân với tâm, xây dựng cộng đồng những người trưởng thành cùng sở thích, cùng mục tiêu giải toả áp lực cuộc sống.

**Poolane là nơi:** Chân thật, được quan tâm, ấm áp — nơi có người thầy đáng tin, người bạn thật sự, không khí nhẹ nhàng mở đầu cho một buổi tối bình yên.

**Không muốn:** Lời lẽ công nghiệp đại trà, không khí học tập căng thẳng, chỉ dạy-dạy-dạy mà không có kết nối con người.

### Visual Identity (Đang Xây Dựng)

**Màu sắc đã định hướng:**
```
Midnight Navy  #1C2B4A  — Bầu trời đêm, chiều sâu, chuyên nghiệp
Warm Cream     #F6F1EA  — Ấm áp, chân thật, không lạnh
Polar Gold     #C8A84B  — Ngôi sao Polaris, ánh sáng dẫn đường (accent)
Mist Teal      #5B8E9F  — Nước, màu phụ cho UI
```

**Typography đã định hướng:**
- Heading: Cormorant Garamond (tinh tế, có chiều sâu)
- Body + UI: Plus Jakarta Sans (hiện đại, ấm hơn Inter)

**Logo direction:** Icon + wordmark. Hướng: Ngôi sao Polaris phản chiếu trên mặt nước — đơn giản, hình học, chứa đựng câu chuyện.

**Tham chiếu thương hiệu:** Nike (tối giản, truyền cảm hứng) + Tiny Revolution (nhẹ nhàng, ấm áp, kết nối).

**Trạng thái:** ĐANG XÂY DỰNG — chưa có file thiết kế chính thức.

**Chế độ chọn giao diện:** Học viên có thể chọn 1 trong 3 theme khi dùng app:
- **Theme A — Đêm & Sao:** Navy #1C2B4A · Cream #F6F1EA · Gold #C8A84B *(mặc định)*
- **Theme B — Bình Minh:** Ocean #1A3F55 · Mist #EEF4F7 · Sunrise #E09850
- **Theme D — Night Pool:** Dark #080E18 · Glow #00E5C8 · Gold #C9A84B

Theme được lưu trong `user_preferences` table, áp dụng qua CSS variables trong `theme.config.ts`.

**Khi build UI:** Dùng Theme A làm mặc định. Sau khi có brand chính thức, cập nhật `theme.config.ts` là toàn bộ hệ thống áp dụng ngay.

**Đối tượng:** Người lớn 16–40 tuổi → phong cách **chuyên nghiệp nhưng ấm áp**, không đại trà, không lạnh lùng.

---

## 3. Tech Stack

| Layer | Công nghệ | Ghi chú |
|---|---|---|
| Frontend | **Next.js 14 (App Router)** | TypeScript strict mode bắt buộc |
| Styling | **Tailwind CSS + shadcn/ui** | Utility-first |
| Database | **PostgreSQL trên Supabase** | Singapore region |
| ORM | **Prisma** | Schema-first, type-safe |
| Auth | **Supabase Auth** | Phone + password (không OTP) |
| Storage (ảnh) | **Supabase Storage** | Profile photos, blog images, product photos |
| Storage (video) | **Google Drive (1TB enterprise đã có)** | Link nhúng, không lưu trên Supabase |
| Email | **Resend** | Free tier 3.000 email/tháng |
| Deployment | **Vercel** | Auto-deploy từ GitHub |
| Validation | **Zod** | Mọi form, mọi API input |
| Date/Time | **date-fns** | Timezone Asia/Ho_Chi_Minh |
| Charts | **Recharts** | Radar chart, line chart |
| Tables | **TanStack Table** | Pagination, filter, search |
| Notifications | **Web Push API + Resend** | In-app + email |

**Yêu cầu bắt buộc:**
- TypeScript `strict: true`
- ESLint + Prettier configured
- Tất cả env vars trong `.env.local`, không bao giờ commit
- Timezone mặc định: `Asia/Ho_Chi_Minh`
- Currency: VND, không có thập phân, format `1.300.000đ`
- Date format: `DD/MM/YYYY`
- Language: Tiếng Việt cho UI, English cho code

---

## 4. Quy Ước Code & API

### 4.1. API Response Format (BẮT BUỘC)

Mọi API route trả về cùng một format:

```typescript
// Success
{ data: T, error: null }

// Error
{ data: null, error: { code: string, message: string, details?: any } }
```

### 4.2. Validation Pattern

```typescript
// Mọi API route:
1. Parse body với Zod schema
2. Nếu fail → return 400 với error chi tiết
3. Validate role/permission
4. Nếu fail → return 403
5. Thực hiện business logic trong try/catch
6. Log error nếu có (xem section 13)
7. Return response chuẩn format
```

### 4.3. Error Handling

```typescript
// API routes:
try {
  // logic
} catch (error) {
  await logError({
    context: 'students.create',
    userId: user.id,
    error,
    inputData: body
  });
  return Response.json(
    { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
    { status: 500 }
  );
}

// UI:
- Mọi API call wrap trong try/catch
- Hiển thị toast notification thân thiện (tiếng Việt)
- KHÔNG bao giờ hiển thị raw error message từ server cho user
- Error boundary ở mọi page chính
```

### 4.4. File & Folder Structure

```
src/
├── app/
│   ├── (public)/         → Trang công khai, không cần login
│   │   ├── page.tsx      → Landing polaproject.com
│   │   ├── courses/      → Trang giới thiệu khoá
│   │   ├── blog/         → Blog public
│   │   └── faq/          → FAQ
│   ├── (auth)/           → Login, register, reset password
│   ├── (dashboard)/      → Sau đăng nhập
│   │   ├── admin/        → Admin only
│   │   ├── staff/        → Staff + Admin
│   │   ├── student/      → Học viên
│   │   └── shared/       → Cả 3 roles
│   └── api/              → API routes
├── components/
│   ├── ui/               → shadcn/ui primitives
│   ├── forms/            → Form components
│   ├── layouts/          → Page layouts
│   └── features/         → Feature-specific components
├── lib/
│   ├── supabase/         → Client + server
│   ├── prisma.ts
│   ├── auth.ts           → Role checks, requireAuth()
│   ├── audit.ts          → Audit log helper
│   ├── logger.ts         → Structured logging
│   ├── validations/      → Zod schemas (1 file/entity)
│   ├── email/            → Email templates + send
│   └── utils.ts
├── types/                → TypeScript types
└── config/
    ├── theme.config.ts   → Brand colors, fonts
    └── constants.ts      → Business constants
```

### 4.5. Naming Conventions

- **Components:** PascalCase — `StudentCard.tsx`
- **Utilities:** camelCase — `formatCurrency.ts`
- **Pages:** kebab-case theo Next.js — `weekly-registration/page.tsx`
- **Database tables:** snake_case — `class_sessions`
- **Database columns:** snake_case — `created_at`, `payment_method`
- **TypeScript types:** PascalCase — `StudentProfile`
- **Constants:** UPPER_SNAKE_CASE — `MAX_MORNING_CAPACITY`

### 4.6. Business Constants File

Đặt mọi con số nghiệp vụ vào `src/config/constants.ts` — không hard-code rải rác:

```typescript
export const CAPACITY = {
  MORNING_MAX: 5,
  MORNING_MIN: 3,
  EVENING_MAX: 7,
  EVENING_MIN: 2
};

export const COURSE_PRICES = {
  ECH: 1_600_000,
  SAI: 2_100_000,
  BUOM: 3_500_000
};

export const POOL_TICKET = {
  FIRST_PRICE: 1_300_000,
  SESSIONS_INCLUDED: 10,
  MAX_SESSIONS: 12,
  SUBSEQUENT_MIN_PRICE: 65_000,
  PER_SESSION_VALUE: 130_000,
  REFUND_RATE: 0.8,
  LOW_STOCK_ALERT: 2
};

export const REFUND_DEADLINE_DAYS = 30;

export const COURSE_REFUND_TIERS = [
  { sessions: 0, rate: 0.5 },
  { sessions: 2, rate: 0.4 },
  { sessions: 4, rate: 0.3 },
  { sessions: 6, rate: 0.2 },
  { sessions: 999, rate: 0.1 }
];

export const SESSION_TIMES = {
  MORNING: { start: '05:30', end: '07:30' },
  EVENING: { start: '18:00', end: '20:00' }
};

export const ASSESSMENT_CHECKPOINTS = [1, 3, 5, 7, 9, 10];

export const ABSENCE_ALERT_THRESHOLDS = {
  YELLOW_DAYS: 14,
  RED_DAYS: 21
};

export const EXTENSION_STAGES = {
  GREEN_MAX: 5,
  YELLOW_MAX: 10
  // 11+ = RED
};
```

---

## 5. Roles & Access Control

### 5.1. Roles

| Role | Mô tả |
|---|---|
| `admin` | Owner — quyền tuyệt đối, kiêm giáo viên |
| `staff` | Trợ lý — hỗ trợ học viên, duyệt đăng ký, tạo nội dung. KHÔNG xem được báo cáo tài chính chi tiết và doanh thu tổng |
| `student` | Học viên — chỉ xem dữ liệu cá nhân và content public |

### 5.2. Student Statuses (sub-state của role student)

| Status | Mô tả |
|---|---|
| `prospect` | Tiềm năng — đã tạo tài khoản, chưa đặt cọc |
| `enrolled` | Đã đặt cọc một khoá học |
| `active` | Đang trong khoá học có cấu trúc |
| `extension` | Đã qua buổi 10, đang ôn luyện |
| `completed` | Đã hoàn thành ít nhất 1 khoá |
| `inactive` | Vắng dài (≥ 3 tuần), chưa chính thức nghỉ |
| `refunded` | Đã hoàn tiền và rời lớp |

Một học viên có thể có nhiều enrollment ở các trạng thái khác nhau (đang học Sải + đã hoàn thành Ếch).

### 5.3. Access Control Rules

**Mọi route protected phải:**
1. Gọi `requireAuth()` ở top
2. Check role qua `requireRole(['admin', 'staff'])`
3. Nếu fail → redirect `/login` hoặc return 403

**Row Level Security (RLS) ở Supabase:**
- Bật RLS cho TẤT CẢ bảng
- Student chỉ SELECT được bản ghi của chính mình
- Staff SELECT/UPDATE được mọi bản ghi học viên, nhưng KHÔNG SELECT bảng `payments` (cột `amount`) và `revenue_reports`
- Admin: bypass RLS qua service_role key (chỉ dùng ở server-side)

**Source nguồn gốc account:**
- `online_signup` — tự tạo qua landing page
- `walk_in` — staff tạo tại bể
- `staff_created` — staff tạo cho học viên có sẵn

---

## 6. Database Schema

> Toàn bộ bảng có: `id` (UUID), `created_at`, `updated_at` (trừ bảng audit_log không có updated_at).

### 6.1. Users & Profiles

**`users`** — Mở rộng Supabase Auth
```
id, email, phone (unique), full_name, dob, gender,
ward, district, province, address_street (nullable),
emergency_contact_name (nullable), emergency_contact_phone (nullable),
id_card_number (nullable, encrypted), occupation (nullable),
health_notes (nullable),
role (enum: admin/staff/student),
account_source (enum: online_signup/walk_in/staff_created),
photo_consent_at, image_consent_marketing_at,
refund_policy_acknowledged_at, terms_acknowledged_at,
is_active, last_login_at
```

**`students`** — Thông tin riêng học viên
```
id, user_id (FK), student_code (unique, format: POLA-YYYY-XXXX),
status (enum trong section 5.2),
swimming_experience (text nullable),
learning_goal (text nullable),
marketing_source (text nullable),
last_attended_at (nullable),
notes_summary (cached field cho dashboard)
```

### 6.2. Courses & Enrollments

**`courses`** — Cố định 3 khoá
```
id, code (ECH/SAI/BUOM), name, price, sessions_count (=10),
description, is_active
```

**`enrollments`**
```
id, student_id, course_id,
payment_plan (enum: A_full/B_course_first/C_deposit),
deposit_amount, total_paid, payment_deadline,
status (enum: active/extension/completed/refunded/cancelled),
is_via_shop (boolean), voucher_code_used (nullable),
enrolled_at, started_at, graduation_date,
extension_sessions_used (default 0)
```

### 6.3. Pool Tickets

**`pool_tickets`**
```
id, student_id, ticket_type (enum: first/subsequent/single/weekly/daily/monthly),
total_sessions, max_sessions, sessions_used,
price_paid, purchased_at, expires_at (nullable),
is_active
```

### 6.4. Sessions & Schedule

**`class_sessions`** — Mỗi buổi học cụ thể
```
id, date, time_slot (enum: morning/evening),
capacity (5 or 7),
status (enum: scheduled/in_progress/completed/cancelled),
cancelled_reason (nullable), cancelled_by, cancelled_at,
notes
```

**`session_registrations`** — Học viên đăng ký buổi nào
```
id, session_id, student_id, course_id (nullable nếu là improvement session),
status (enum: pending/approved/rejected/waitlist/withdrawn),
rejected_reason (nullable: capacity_full/skill_mismatch/teacher_decision/other),
rejected_reason_text (nullable),
registered_at, decided_at, decided_by
```

**`attendance`** — Điểm danh thực tế
```
id, session_id, student_id, course_id (nullable),
status (enum: present/absent/walk_in),
marked_by, marked_at,
notes (nullable),
is_offline_sync (boolean) — đánh dấu nếu sync từ offline mode
```

### 6.5. Assessments

**`assessments`**
```
id, student_id, course_id, session_number (1-10+),
type (enum: initial/quick/detailed/graduation/improvement),
assessor_id, assessment_date, notes,
is_voice_note (boolean), voice_note_url (nullable)
```

**`assessment_scores`**
```
id, assessment_id, skill_key (slug: body_position/leg_kick/...),
score (1-5), note (nullable)
```

**`objective_metrics`**
```
id, assessment_id, metric_key (continuous_meters/time_25m/stroke_count),
value, unit
```

**`self_assessments`** — Học viên tự đánh giá
```
id, student_id, course_id, session_number,
scores_json, created_at
```

**`skill_goals`** — Mục tiêu cá nhân (#8 trong improvements)
```
id, student_id, goal_text, target_date,
status (active/achieved/abandoned)
```

**`next_session_focus`** — Giáo viên gắn kỹ năng cho buổi sau (U)
```
id, student_id, session_id, skill_keys (array), note
```

**`practice_logs`** — Nhật ký tự luyện tập (#4)
```
id, student_id, date, distance_meters, duration_minutes,
focus_skills, self_feeling, notes
```

### 6.6. Financial

**`payments`** — Mọi giao dịch tiền
```
id, student_id, amount, type (enum: course_fee/pool_ticket/shop/refund/adjustment),
reference_type, reference_id,
payment_method (enum: cash/bank_transfer/card/other),
reference_number (nullable),
recorded_by, recorded_at,
notes,
is_reversal (boolean) — true nếu là bút toán đảo
```

**`refund_requests`**
```
id, student_id, enrollment_id (nullable), pool_ticket_id (nullable),
include_course_refund (boolean), include_ticket_refund (boolean),
course_sessions_attended, course_refund_rate, course_refund_amount,
ticket_sessions_used, ticket_refund_amount,
total_refund_amount,
reason (enum: work/health/other), reason_text,
status (enum: pending/approved/transferred/rejected/cancelled),
requested_at, requested_by,
processed_at, processed_by,
transfer_reference
```

### 6.7. Shop

**`products`**
```
id, name, sku (unique), type (enum: course/improvement_pack/service/physical),
linked_course_id (nullable — for course products),
sessions_count (nullable — for improvement_pack),
price, cost,
stock_quantity (nullable for non-physical),
low_stock_threshold,
photos (json array of urls),
description, is_active
```

**`orders`**
```
id, student_id, total_amount, voucher_code (nullable), discount_amount,
final_amount, status (enum: pending/approved/paid/fulfilled/cancelled),
note_from_student, fulfillment_note,
created_at, approved_at, approved_by,
fulfilled_at, fulfilled_by,
payment_plan (enum: A_full/B_course_first/C_deposit — nullable, chỉ khi mua khoá)
```

**`order_items`**
```
id, order_id, product_id, quantity, unit_price, line_total
```

**`improvement_sessions`** — Pack buổi bơi lẻ cải thiện kỹ năng
```
id, student_id, sessions_purchased, sessions_used,
initial_assessment_id, target_skills (array),
created_at, expires_at (nullable)
```

### 6.8. Vouchers

**`vouchers`**
```
id, code (unique), description,
discount_type (enum: percent/fixed/free_pool_session),
discount_value,
applies_to (enum: any/course_only/shop_only),
max_uses, used_count,
valid_from, valid_until,
is_active
```

**`voucher_usages`**
```
id, voucher_id, student_id, order_id (nullable), enrollment_id (nullable), used_at
```

### 6.9. Content & Engagement

**`blog_posts`**
```
id, title, slug (unique), content (markdown), excerpt,
category (technique/safety/nutrition/student_story/news),
cover_image_url, author_id,
status (draft/published/scheduled),
published_at, scheduled_at, view_count
```

**`quizzes`**
```
id, title, description, course_id (nullable),
linked_skill (nullable), created_by, is_published
```

**`quiz_questions`**
```
id, quiz_id, question_text, type (multiple_choice/true_false/short_answer),
options (json), correct_answer, explanation, order_index
```

**`quiz_attempts`**
```
id, quiz_id, student_id, score, max_score,
answers (json), started_at, completed_at
```

**`events`** — Sự kiện đơn lẻ (minigame)
```
id, name, date, time_slot, description,
participant_count (post-event), highlights (json),
photos (array), created_by
```

**`challenges`** — Challenge hàng tháng
```
id, name, goal_value, unit (meters/sessions),
start_date, end_date, is_active
```

**`challenge_progress`**
```
id, challenge_id, student_id, current_value, last_updated
```

**`session_photos`**
```
id, session_id (nullable), event_id (nullable), photo_url, caption,
visible_to (enum: all_students/specific_students), uploaded_by, uploaded_at
```

**`video_links`** — Link Google Drive cho video bơi
```
id, student_id, session_id, drive_url, caption, created_by, created_at
```

### 6.10. Notifications & Communications

**`notifications`**
```
id, user_id, type (enum: approval/rejection/cancellation/absence/debt/birthday/event/badge/general),
title, body, action_url (nullable),
read_at, created_at,
metadata (json)
```

**`notification_preferences`**
```
id, user_id, type, in_app_enabled, email_enabled, push_enabled
```

### 6.11. Operations & Admin

**`student_notes`** — Ghi chú riêng tư của giáo viên (D)
```
id, student_id, note, is_private (true = chỉ admin/staff thấy),
created_by, created_at
```

**`profile_change_requests`**
```
id, student_id, field_changes (json: {field: {old, new}}),
status (pending/approved/rejected), 
requested_at, processed_at, processed_by, processed_notes
```

**`audit_log`** — Nhật ký hệ thống (xem section 13)
```
id, user_id, role, action, entity_type, entity_id,
before_data (json), after_data (json),
ip_address, user_agent, created_at
```

**`error_logs`** — Lỗi hệ thống tự ghi
```
id, context, user_id (nullable), error_message, stack_trace,
input_data (json, sanitized), severity (info/warn/error/critical),
resolved_at, resolved_by, created_at
```

**`faqs`**
```
id, question, answer, category, order_index, is_active
```

**`marketing_source_stats`** — Tracking nguồn (R)
```
id, source_label, month, new_signups, conversions, revenue
```

### 6.12. Indexes Bắt Buộc

```sql
-- Tăng tốc các query phổ biến
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_last_attended ON students(last_attended_at);
CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_student ON attendance(student_id, marked_at);
CREATE INDEX idx_session_reg_session ON session_registrations(session_id, status);
CREATE INDEX idx_session_reg_student ON session_registrations(student_id, registered_at);
CREATE INDEX idx_payments_student ON payments(student_id, recorded_at);
CREATE INDEX idx_pool_tickets_student ON pool_tickets(student_id, is_active);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id, created_at);
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at);
```

---

## 7. Business Rules (QUAN TRỌNG NHẤT)

### 7.1. Học Phí Khoá Học

| Khoá | Mã | Học phí | Số buổi |
|---|---|---|---|
| Bơi Ếch | ECH | 1.600.000đ | 10 |
| Bơi Sải | SAI | 2.100.000đ | 10 |
| Bơi Bướm | BUOM | 3.500.000đ | 10 |

- **Học viên có thể đăng ký 2 khoá song song.**
- **Mỗi buổi học chỉ học MỘT kỹ năng.** Nếu học viên đăng ký 2 khoá và muốn vào cùng 1 buổi, hệ thống cảnh báo phải chọn 1 khoá.

### 7.2. Phương Án Thanh Toán Học Phí

| Phương án | Cọc trước | Đóng đủ |
|---|---|---|
| **A** — Đóng toàn bộ | 100% học phí + vé bơi | Khi đăng ký |
| **B** — Học phí trước, vé sau | 100% học phí | Vé bơi tại buổi 1 |
| **C** — Cọc 30% | 30% học phí + 100% vé bơi | Học phí còn lại CHẬM NHẤT trước hoặc tại buổi 2 |

**Quy tắc:**
- Học viên không đóng đủ đến buổi 3 → tự động chuyển trạng thái nợ quá hạn, không được duyệt đăng ký buổi mới
- Hệ thống tự nhắc 1 ngày trước hạn đóng nốt

### 7.3. Vé Bơi

| Loại | Giá | Đặc điểm |
|---|---|---|
| **Lần đầu** | 1.300.000đ | 10 buổi (tối đa 12 — giáo viên tự quyết khi cho thêm). Đã bao gồm đạo cụ + tiện ích hồ bơi |
| **Lần 2 trở đi** | Tự mua, từ 65k/buổi | Nhiều loại: lượt, tuần, ngày, tháng. Hệ thống chỉ ghi nhận "đang có vé hợp lệ" hay không |

**Quy tắc:**
- Khi vé còn ≤ 2 buổi → thông báo cảnh báo cho học viên
- Sau khi dùng hết vé lần đầu → học viên tự mua vé bên ngoài, staff đánh dấu "Đã có vé" trong hệ thống

### 7.4. Sức Chứa & Đăng Ký Buổi Học

| Ca | Giờ | Sức chứa tối đa | Tối thiểu (trigger mời thêm) |
|---|---|---|---|
| Sáng | 5:30 – 7:30 | **5** | **3** |
| Chiều | 18:00 – 20:00 | **7** | **2** |

**Workflow đăng ký:**
1. Học viên đăng ký buổi muốn học (qua app, bất kỳ lúc nào trong tuần)
2. Staff thấy đăng ký trong queue, có đầy đủ context:
   - Tên, ảnh, kỹ năng hiện tại (điểm trung bình), lần học cuối
   - Trung bình kỹ năng của nhóm đã đăng ký ca đó
   - Trạng thái thanh toán
   - Vé còn bao nhiêu buổi
3. Staff duyệt hoặc từ chối. **Khi từ chối phải chọn lý do** (capacity_full/skill_mismatch/teacher_decision/other) — học viên thấy lý do trong thông báo
4. Học viên nhận push notification ngay khi có quyết định
5. Khi ca đầy → đăng ký mới vào waitlist tự động, STAFF VẪN LÀ NGƯỜI DUYỆT CUỐI (không tự động promote)
6. Khi ca dưới mức tối thiểu → hệ thống gợi ý staff gửi lời mời

**Walk-in:**
- Học viên đến bể không đăng ký trước → staff thêm tại chỗ qua nút "Thêm học viên phát sinh"
- Nếu chưa có tài khoản → tạo hồ sơ nháp (tên + SĐT), nguồn = `walk_in`, status = `prospect`
- Walk-in tính vào sức chứa ca (cảnh báo nếu vượt)

### 7.5. Chính Sách Hoàn Tiền

**Hoàn học phí khoá học (theo bậc):**

| Số buổi đã học | Hoàn lại |
|---|---|
| 0 buổi | 50% |
| 1–2 buổi | 40% |
| 3–4 buổi | 30% |
| 5–6 buổi | 20% |
| 7+ buổi | 10% |

**Hoàn vé bơi lần đầu:**
```
Hoàn = Số buổi chưa dùng × 130.000đ × 80%
```
Buổi bonus (11, 12) KHÔNG tính.

**Quy tắc chung:**
- Học viên có thể chọn hoàn cả hai hoặc chỉ một
- **Trường hợp B (hoàn học phí, giữ vé bơi):** Học viên không còn trong khoá có cấu trúc, nhưng vé còn lại vẫn dùng để bơi tự do. Tính vào sức chứa ca bình thường (cần xác nhận lại với owner khi triển khai)
- **Thời hạn yêu cầu hoàn:** 30 ngày kể từ buổi học cuối cùng
- Sau 30 ngày → nút yêu cầu hoàn tự động khoá
- Chính sách hoàn tiền hiển thị TRƯỚC KHI thanh toán, học viên tick xác nhận đã đọc

### 7.6. Giai Đoạn Ôn Luyện (sau buổi 10 chưa đạt)

| Số buổi ôn | Trạng thái | Hành động hệ thống |
|---|---|---|
| 1–5 | 🟢 Xanh | Theo dõi bình thường, focus kỹ năng yếu |
| 6–10 | 🟡 Vàng | Cảnh báo staff: cần chú ý |
| 11+ | 🔴 Đỏ | Gợi ý đánh giá lại toàn diện hoặc trao đổi |

**Quy tắc:**
- Chỉ tính phí **vé bơi** trong giai đoạn ôn luyện, không tính học phí mới
- Hệ thống chỉ hiển thị các kỹ năng dưới ngưỡng tốt nghiệp khi đánh giá
- Giáo viên có thể trigger "đánh giá tốt nghiệp" bất kỳ buổi nào

### 7.7. Tiêu Chí Tốt Nghiệp Khoá

- Tất cả 8 kỹ năng cốt lõi ≥ 3/5
- Kỹ năng phối hợp + thở ≥ 4/5
- Bơi liên tục ≥ 25m đúng kiểu bơi
- Giáo viên xác nhận chính thức

### 7.8. Pulse Check (Auto Weekly)

Mỗi sáng thứ 2, hệ thống tự tạo danh sách:

- 🔴 **Cần follow-up** — vắng > 21 ngày
- 🟡 **Nhắc nhở** — vắng 14–21 ngày
- 🟢 **Sắp hết vé** — vé còn ≤ 2 buổi

Mỗi mục có **template tin nhắn soạn sẵn** — staff chỉ chỉnh sửa nhẹ rồi gửi.

### 7.9. Shop

**4 loại sản phẩm xử lý khác nhau:**

| Loại | Tồn kho | Khi mua tạo gì |
|---|---|---|
| `course` | Không | Enrollment mới (cùng luồng A/B/C) |
| `improvement_pack` | Không | Improvement sessions record + trigger initial assessment |
| `service` | Không | Đơn cần lên lịch sau khi mua |
| `physical` | Có | Trừ tồn kho khi duyệt đơn, học viên nhận tại bể |

**Workflow:**
1. Học viên thêm vào giỏ → đặt đơn → status `pending`
2. Staff/Admin duyệt → status `approved` → thông báo học viên
3. Học viên thanh toán → status `paid`
4. Hoàn tất (giao hàng/lên lịch dịch vụ) → status `fulfilled`

**Đổi/trả:**
- Đạo cụ vật lý chưa dùng đổi được trong 7 ngày
- Khoá học và dịch vụ áp chính sách hoàn tiền chuẩn

### 7.10. Combo 3 Khoá

- Học viên đăng ký cả Ếch + Sải + Bướm cùng lúc → được giảm giá (mức giảm TBD)
- Áp dụng badge đặc biệt "Full Swimmer"
- Có thể được ưu tiên đăng ký buổi học (cần xác nhận với owner)

### 7.11. Voucher / Mã Giảm Giá

- Admin tạo mã, có thể giới hạn số lần dùng và thời hạn
- 3 loại: % học phí, số tiền cố định, tặng buổi vé miễn phí
- Áp dụng tại bước checkout (Shop) hoặc khi enroll

### 7.12. Lịch Nghỉ Lễ / Hồ Bơi Bảo Trì

**Quy tắc thực tế hiện tại:** Owner xử lý thủ công — staff huỷ ca bằng tính năng huỷ ca khẩn cấp (B). Không có lịch nghỉ định kỳ trong hệ thống.

### 7.13. Huỷ Buổi Học Khẩn Cấp

Staff/Admin có nút "Huỷ ca" với:
- Lý do (bảo trì hồ / thời tiết / giáo viên bệnh / khác)
- Push notification ngay cho mọi học viên đã đăng ký
- **Hoàn lại buổi vé tự động** — cộng thêm 1 buổi vào vé hiện tại

---

## 8. Hệ Thống Đánh Giá Kỹ Năng

### 8.1. Thang Điểm 1–5 (áp dụng mọi kỹ năng)

| Điểm | Tên mức | Mô tả |
|---|---|---|
| 1 | Chưa thực hiện được | Không thực hiện dù có hỗ trợ |
| 2 | Đang hình thành | Thực hiện khi giáo viên hướng dẫn trực tiếp |
| 3 | Có thể tự làm | Tự thực hiện, còn sai kỹ thuật rõ ràng |
| 4 | Khá tốt | Đúng kỹ thuật, còn lỗi nhỏ |
| 5 | Thành thục | Chuẩn, ổn định, tự nhiên |

### 8.2. Kỹ Năng Theo Khoá

**Bơi Ếch (8 kỹ năng):**
1. Tư thế thân người
2. Đạp chân ếch
3. Kéo tay
4. Thở
5. Lướt nước (glide)
6. Phối hợp tay–chân–thở
7. Quay đầu hồ
8. Sức bền

**Bơi Sải (9 kỹ năng):**
1. Tư thế & xoay hông
2. Đập chân
3. Vào tay (entry)
4. Kéo nước (high elbow catch)
5. Phục hồi tay
6. Thở nghiêng
7. Thở 2 bên (bilateral)
8. Quay đầu hồ
9. Sức bền & tốc độ

**Bơi Bướm (8 kỹ năng):**
1. Sóng người (undulation)
2. Đạp chân cá heo
3. Vào tay
4. Kéo nước
5. Phục hồi tay
6. Thở
7. Nhịp điệu
8. Sức bền

### 8.3. Chỉ Số Khách Quan (mọi khoá)

- Số mét bơi liên tục không nghỉ
- Thời gian 25m (từ buổi 4 trở đi)
- Số nhịp/chiều hồ (stroke count)

### 8.4. Mốc Đánh Giá Trong 10 Buổi

| Buổi | Loại đánh giá |
|---|---|
| 1 | Initial (baseline toàn bộ) |
| 3 | Quick (chỉ số khách quan) |
| 5 | Detailed (toàn bộ, so sánh với buổi 1) |
| 7 | Quick + điều chỉnh mục tiêu |
| 9 | Detailed (toàn bộ, quyết định tốt nghiệp) |
| 10 | Graduation (thi tốt nghiệp thực tế) |

### 8.5. Chế Độ Đánh Giá

| | Quick Mode | Detailed Mode |
|---|---|---|
| **Khi nào** | Buổi thường, check-in | Buổi 5 + 9 (đánh giá chính thức) |
| **Thời gian** | 60–90 giây/HV | 3–5 phút/HV |
| **Nội dung** | Pre-fill điểm cũ, chỉ tap khi có thay đổi | Điểm đầy đủ + ghi chú + chỉ số khách quan |
| **Voice note** | Tuỳ chọn | Có |

### 8.6. UI Đặc Biệt Cho Đánh Giá

- **Pre-fill từ buổi trước** — giáo viên chỉ chỉnh khi có thay đổi
- **Kỹ năng yếu (≤2)** highlight cảnh báo
- **Nút lớn (1–5)** dễ bấm khi tay ướt
- **Bàn phím chỉ xuất hiện** khi tap mic hoặc tap field ghi chú
- **Đánh giá nhóm nhanh** — áp 1 thay đổi cho cả lớp, sau đó chỉnh lệch
- **Chỉ số khách quan** trên màn hình riêng (có thể skip nếu không đo)

### 8.7. Visualizations Bắt Buộc

- **Radar chart 8 kỹ năng** — so sánh các buổi đánh giá
- **Line chart chỉ số khách quan** — qua thời gian
- **Heatmap lớp** — kỹ năng yếu nhất của cả lớp (cho giáo viên)
- **Progress velocity** — so sánh tốc độ tiến bộ vs trung bình

### 8.8. Tự Đánh Giá Của Học Viên (#7)

- Học viên tự cho điểm trước khi giáo viên chấm (buổi 5 và 9)
- Hiển thị độ lệch giữa tự đánh giá và giáo viên chấm
- Mục đích: học viên nhận ra điểm mù bản thân

### 8.9. Đánh Giá Buổi Bơi Lẻ Cải Thiện Kỹ Năng

- Buổi đầu: Initial assessment xác định kỹ năng yếu
- Mỗi buổi sau: Quick assessment chỉ những kỹ năng mục tiêu
- Không có graduation criteria — học viên tự quyết khi nào dừng

---

## 9. Operational Workflows

### 9.1. Onboarding Học Viên Mới

**Luồng 1 — Tự đăng ký online:**
```
Học viên thấy link polaproject.com (từ social media / được gửi)
→ Xem trang Khoá học (public, không cần login)
→ Bấm "Đăng ký tìm hiểu"
→ Điền form (BẮT BUỘC: tên, SĐT, email, DOB, gender, address phường/quận/tỉnh)
→ Tick xác nhận: chính sách bảo mật + đồng ý hình ảnh
→ Tạo mật khẩu
→ Tài khoản tạo → status `prospect`, source `online_signup`
→ Staff nhận notification → liên hệ tư vấn
→ Học viên đặt cọc → status `enrolled`
```

**Luồng 2 — Walk-in mới:**
```
Người mới đến bể
→ Staff mở app, tab "Thêm học viên phát sinh"
→ Nhập tên + SĐT → tạo hồ sơ nháp, source `walk_in`
→ Sau buổi: học viên hoàn thiện thông tin qua link gửi SMS/Zalo
```

### 9.2. Đăng Ký Buổi Học Hàng Tuần

```
Học viên mở app → tab "Đăng ký buổi học"
→ Chọn buổi muốn đi (lịch tuần hiển thị)
→ Submit → status `pending`
→ Staff nhận notification trong app
→ Staff xem queue duyệt, mỗi card có đầy đủ context (xem 7.4)
→ Staff Duyệt / Từ chối (với lý do)
→ Học viên nhận push notification kết quả
→ Tên xuất hiện trên timetable nếu được duyệt
```

### 9.3. Điểm Danh

```
Giáo viên mở app trước/trong buổi học
→ Chọn buổi hôm nay
→ Thấy danh sách học viên đã duyệt
→ Tap "Có mặt" cho từng người (mặc định ban đầu là chưa đánh dấu)
→ Có thể thêm walk-in qua nút riêng
→ Submit → trạng thái buổi → `in_progress` rồi `completed`
→ Vé bơi tự trừ 1 buổi cho mỗi học viên có mặt
→ Học viên vắng không trừ vé
→ Nếu offline → lưu local, sync khi có mạng
```

### 9.4. Đánh Giá Sau Buổi Học

```
Giáo viên bấm "Đánh giá" sau khi điểm danh xong
→ Chọn chế độ Quick / Detailed (mặc định Quick)
→ Lướt qua từng học viên, tap điểm thay đổi
→ Tuỳ chọn: voice note hoặc gõ ghi chú
→ Tuỳ chọn: gắn "Kỹ năng buổi sau cần chú ý"
→ Submit → cập nhật assessment_scores, gửi notification cho học viên có kết quả mới
```

### 9.5. Thanh Toán Học Phí

**Tại thời điểm đặt cọc/đóng tiền:**
```
Staff nhận tiền (cash/transfer) → Mở app
→ Vào hồ sơ học viên → tab Tài chính
→ Bấm "Ghi nhận thanh toán"
→ Chọn: type (course_fee/pool_ticket), amount, method
→ Nếu chuyển khoản: nhập reference number
→ Submit → audit log + cập nhật trạng thái enrollment
→ Học viên nhận biên lai qua email tự động
```

### 9.6. Mua Hàng Trên Shop

```
Học viên duyệt Shop → thêm vào giỏ → checkout
→ Nhập voucher (nếu có)
→ Chọn payment plan (nếu mua khoá)
→ Submit → status `pending`
→ Staff/Admin duyệt → cập nhật stock nếu cần
→ Học viên nhận thông báo + hướng dẫn thanh toán
→ Staff ghi nhận thanh toán → status `paid`
→ Khi giao hàng/lên lịch dịch vụ → status `fulfilled`
```

### 9.7. Yêu Cầu Hoàn Tiền

```
Học viên hoặc Staff/Admin tạo yêu cầu
→ Hệ thống auto-tính theo chính sách 7.5
→ Hiển thị breakdown chi tiết để xác nhận
→ Học viên hoặc staff submit
→ Admin nhận notification → review
→ Admin Duyệt → status `approved`
→ Admin chuyển tiền thực tế (ngoài hệ thống)
→ Quay lại app → đánh dấu `transferred` + nhập reference
→ Học viên nhận thông báo + biên lai hoàn tiền
→ Enrollment status → `refunded`
→ Audit log đầy đủ
```

### 9.8. Yêu Cầu Cập Nhật Thông Tin Cá Nhân

```
Học viên vào hồ sơ → bấm "Yêu cầu cập nhật"
→ Điền các trường muốn đổi
→ Submit → tạo profile_change_request, status `pending`
→ Staff nhận notification → xem diff cũ vs mới
→ Staff duyệt → áp dụng thay đổi + audit log
→ Hoặc từ chối với lý do → học viên nhận thông báo
```

### 9.9. Huỷ Ca Khẩn Cấp

```
Staff/Admin bấm "Huỷ ca [ngày] [ca]"
→ Chọn lý do
→ Confirm → buổi học status `cancelled`
→ Push notification cho mọi học viên đã đăng ký
→ Cộng lại 1 buổi vé cho từng người (chỉ nếu họ đã được duyệt)
→ Audit log
```

### 9.10. Sinh Nhật Học Viên

```
Cron job chạy lúc 6:00 sáng mỗi ngày
→ Query students có DOB = today
→ Tạo notification chúc mừng tự động
→ Gửi email với template đẹp
→ Audit log
```

---

## 10. Features by Module

### 10.1. Module Auth & Onboarding
- Đăng ký bằng SĐT + mật khẩu
- Đăng nhập
- Reset mật khẩu qua email
- Phát hiện tài khoản trùng SĐT
- Tick xác nhận: chính sách bảo mật, đồng ý hình ảnh, chính sách hoàn tiền
- Onboarding flow lần đầu đăng nhập (3 màn hình giới thiệu)

### 10.2. Module Student Management
- CRUD hồ sơ học viên
- Liên kết với enrollment, pool_tickets
- Yêu cầu cập nhật thông tin (qua approval)
- Ghi chú riêng tư của giáo viên (private)
- Lịch sử thanh toán cá nhân
- Photo upload (qua Supabase Storage)
- Walk-in quick create

### 10.3. Module Courses & Enrollment
- 3 khoá cố định (ECH/SAI/BUOM)
- Enrollment với 3 phương án thanh toán
- Multi-enrollment (học 2 khoá song song)
- Combo package (giảm giá khi đăng ký cả 3)
- Theo dõi tiến độ khoá (sessions completed)
- Giai đoạn ôn luyện sau buổi 10

### 10.4. Module Pool Ticket
- Vé lần đầu 1.3M
- Counter buổi đã dùng / còn lại
- Cảnh báo khi còn ≤ 2 buổi
- Đánh dấu "có vé bên ngoài" cho lần 2 trở đi

### 10.5. Module Weekly Registration & Approval
- Học viên đăng ký buổi
- Queue duyệt cho staff với full context
- Approve/reject với lý do
- Capacity enforcement (5/7)
- Waitlist tự động (staff vẫn duyệt cuối)
- Gợi ý mời thêm khi dưới mức tối thiểu
- Walk-in addition

### 10.6. Module Attendance
- App-based marking
- Offline mode + auto-sync
- Walk-in marking
- Auto-trừ vé bơi
- Auto-thông báo phụ huynh/học viên khi vắng

### 10.7. Module Assessment
- 8/9 kỹ năng theo khoá
- Thang điểm 1–5 với mô tả chuẩn
- Quick + Detailed modes
- Pre-fill từ buổi trước
- Voice note via Web Speech API
- Đánh giá nhóm nhanh
- Chỉ số khách quan
- Tự đánh giá của học viên (buổi 5, 9)
- Radar chart so sánh các buổi
- Heatmap kỹ năng yếu của lớp
- Progress velocity
- Next session focus (U)
- Gợi ý bài tập tự luyện (T)

### 10.8. Module Financial
- Ghi nhận thanh toán (cash/transfer)
- Theo dõi nợ + cảnh báo
- Email biên lai PDF
- Quản lý voucher/discount
- Refund workflow đầy đủ
- Báo cáo doanh thu (admin only)
- Xuất Excel

### 10.9. Module Shop
- 4 loại sản phẩm
- Quản lý tồn kho đơn giản
- Ảnh sản phẩm
- Giỏ hàng + checkout
- Duyệt đơn của staff
- Áp voucher

### 10.10. Module Communication
- In-app notification center
- Push notification (Web Push API)
- Email cho các sự kiện quan trọng
- Broadcast announcement (toàn lớp/ca cụ thể)
- Học viên gửi ghi chú cho giáo viên trước buổi
- Sinh nhật tự động
- Pulse Check với pre-written messages

### 10.11. Module Content
- Blog với 5 danh mục
- Quiz (manual + CSV import)
- Quiz tự gợi ý dựa trên kỹ năng yếu
- Video Drive link
- FAQ page
- Class photo album
- Chương trình theo chủ đề (30-day challenges...)

### 10.12. Module Events & Engagement
- Sự kiện đơn lẻ (minigame)
- Challenge hàng tháng với leaderboard ẩn danh
- Auto-badge khi đạt mốc
- Chia sẻ thành tích (achievement card)
- Mục tiêu cá nhân của học viên
- Nhật ký tự luyện tập

### 10.13. Module Admin Dashboard
- Real-time overview
- Pulse Check
- Báo cáo daily/weekly/monthly
- Thống kê giờ cao điểm
- Phân tích nguồn marketing
- So sánh hiệu quả giảng dạy theo khoá
- Audit log viewer
- Data export (Excel + JSON)

### 10.14. Module Public Landing
- Trang chính (Hero + features)
- Trang Khoá học (3 khoá chi tiết)
- Trang Phương pháp đánh giá
- Blog public
- FAQ
- SEO tối ưu cho từ khoá "học bơi [địa phương]"
- Đặt lịch tư vấn

---

## 11. Development Roadmap

> Mỗi phase = 1 session Claude Code. Cuối mỗi phase = MVP có thể test thật.

### Phase 1 — Foundation
- Setup Next.js + TypeScript + Tailwind + shadcn/ui
- Setup Supabase + Prisma + schema chính
- Setup Vercel + GitHub
- Auth: SĐT + password
- 3 roles routing
- Dashboard shell
- Trang công khai sơ bộ (placeholder)
- **MVP:** Đăng nhập được, redirect đúng role

### Phase 2 — Student & Enrollment
- CRUD học viên (với form đầy đủ)
- Address dropdown (phường/quận/tỉnh VN)
- Account duplicate detection
- Profile change request
- Liên kết course enrollment
- Pool ticket management
- Walk-in quick create
- **MVP:** Có dữ liệu học viên thật để chạy

### Phase 3 — Schedule & Attendance ⚡ CÓ THỂ DÙNG THẬT
- Tạo session theo lịch hàng ngày
- Weekly registration cho học viên
- Approval queue cho staff với full context
- Approve/reject + reasons
- Capacity enforcement
- Waitlist
- Attendance marking app-based
- Offline mode + sync
- Auto-trừ vé
- Notifications: approval result, absence
- Huỷ ca khẩn cấp
- **MVP:** Thay thế Google Sheet hoàn toàn

### Phase 4 — Financial ⚡ VẬN HÀNH ĐẦY ĐỦ
- 3 payment plans tracking
- Ghi nhận thanh toán
- Nợ + cảnh báo
- Email biên lai
- Vouchers
- Refund workflow đầy đủ
- Báo cáo doanh thu cơ bản
- **MVP:** Quản lý toàn bộ dòng tiền

### Phase 5 — Assessment Core
- 8/9 kỹ năng theo khoá
- Quick + Detailed modes
- Pre-fill, voice note
- Chỉ số khách quan
- Tự đánh giá học viên
- Radar chart + line chart
- Graduation flow
- Extension period
- **MVP:** Đánh giá kỹ năng đỉnh cao

### Phase 6 — Admin Dashboard & Analytics
- Real-time overview
- Pulse Check + pre-written messages
- Daily/weekly/monthly reports
- Excel export
- Heatmap kỹ năng lớp
- Thống kê giờ cao điểm
- So sánh hiệu quả giảng dạy
- Marketing source analytics
- Audit log viewer
- **MVP:** Admin kiểm soát toàn bộ

### Phase 7 — Communication & Engagement
- Notification center đầy đủ
- Push notifications
- Email templates
- Broadcast
- Học viên gửi ghi chú giáo viên
- Sinh nhật tự động
- Phản hồi sau buổi (Quick feedback 😊/😐/😟)
- **MVP:** Vòng tương tác đầy đủ

### Phase 8 — Teacher Tools
- Kế hoạch giảng dạy theo lớp
- Thư viện bài tập chuẩn hoá
- Thống kê cá nhân giáo viên + retention rate
- Next session focus
- Gợi ý bài tập tự luyện cho học viên
- **MVP:** Chuẩn hoá chất lượng dạy học

### Phase 9 — Student Portal Advanced
- Skill map trực quan
- Mục tiêu cá nhân + progress
- Nhật ký tự luyện tập
- Thư viện kỹ thuật cá nhân hoá
- Bảng thành tích lớp ẩn danh
- Tái đăng ký khoá tiếp theo
- Chia sẻ thành tích (achievement card)
- **MVP:** Học viên gắn kết hơn

### Phase 10 — Shop & Payments Online
- Shop với 4 loại sản phẩm
- Quản lý tồn kho
- Ảnh sản phẩm
- Giỏ hàng + checkout
- Voucher integration
- Improvement sessions (buổi bơi lẻ)
- Tích hợp MoMo / VNPay (nếu kịp)
- **MVP:** Shop hoạt động + thanh toán online

### Phase 11 — Content & Quiz
- Blog đầy đủ + categories
- Quiz manual + CSV import
- Quiz linked với skill (gợi ý theo điểm yếu)
- FAQ
- Class photo album
- Events + Monthly challenges
- Chương trình theo chủ đề (30-day...)
- Trang công khai hoàn chỉnh + SEO
- **MVP:** Content engine sống động

### Phase 12 — AI & Advanced
- Dropout prediction
- AI gợi ý lộ trình cá nhân
- So sánh kỹ thuật qua video
- Lớp lý thuyết online (nếu có)
- Hệ thống referral
- **MVP:** Hệ thống thông minh đỉnh cao

---

## 12. AI Collaboration Rules

> Đây là phần AI BẮT BUỘC tuân thủ khi build với người dùng non-developer.

### 12.1. Nguyên Tắc Tối Thượng

1. **Một tính năng một lần** — KHÔNG bao giờ build nhiều tính năng cùng lúc
2. **Test trước khi commit** — User test trên browser xong mới commit
3. **Commit sau mỗi tính năng hoàn chỉnh** — không để dồn
4. **Đọc CLAUDE.md trước mọi session** — không phỏng đoán business rules
5. **Cập nhật CLAUDE.md khi có quyết định mới** — đề xuất với user cách bổ sung

### 12.2. Cách Mô Tả & Hiểu Yêu Cầu

**AI luôn:**
- Hỏi lại trước khi giả định, nếu yêu cầu ambiguous
- Mô tả lại bằng từ ngữ riêng để user xác nhận hiểu đúng
- Liệt kê các edge case sẽ xử lý (capacity full, network error, invalid input...)
- Đề xuất alternative khi cách user mô tả có vấn đề

**AI không bao giờ:**
- Tự ý thêm tính năng không yêu cầu
- Tự ý bỏ qua phần khó
- Hard-code business rules — luôn dùng constants

### 12.3. Quy Tắc Code

1. **TypeScript strict** — không có `any` trừ trường hợp thật sự cần
2. **Zod validation** — mọi input từ user, mọi API request
3. **Error handling** — mọi async function trong try/catch
4. **Logging** — mọi error + mọi audit-worthy action (xem section 13)
5. **Server components** mặc định, `'use client'` chỉ khi cần
6. **Server actions** ưu tiên hơn API routes khi có thể
7. **Constants** — không hard-code số/chuỗi nghiệp vụ
8. **No inline RLS bypass** — chỉ dùng service_role ở server-side, có comment giải thích
9. **Migration tracking** — mọi schema change qua Prisma migration

### 12.4. Quy Trình Khi Có Lỗi Báo Cáo

```
User paste error message
        ↓
AI hỏi rõ: lỗi xảy ra khi nào, làm thao tác gì
        ↓
AI tìm source root, KHÔNG patch tạm
        ↓
AI giải thích nguyên nhân bằng ngôn ngữ thường (không thuật ngữ)
        ↓
AI fix + thêm test case hoặc validation để không tái lỗi
        ↓
AI cập nhật error_logs nếu chưa có
        ↓
User test xong → commit
```

### 12.5. Khi Nào Cần Refactor

AI tự đề xuất refactor khi:
- Cùng logic xuất hiện ở 3+ chỗ
- File > 300 dòng
- Function > 50 dòng
- Tên biến/hàm không còn phản ánh đúng chức năng
- Có conflict pattern với phần code khác

Không tự ý refactor mà không hỏi user trước.

### 12.6. Khi Nào Dừng Để Dọn Dẹp

Dấu hiệu codebase cần dọn:
- Sửa A → xuất hiện B
- Đề xuất workaround thay vì fix root
- Cùng tính năng implement 2 cách khác nhau
- Test fail mà không hiểu lý do

→ AI đề xuất user: dừng tính năng mới, dành 1 session "Code Review & Refactor".

### 12.7. Cập Nhật CLAUDE.md

Sau mỗi session, AI hỏi user:
> "Có quyết định nghiệp vụ hoặc convention mới cần update CLAUDE.md không?"

Nếu có → AI tự edit + show diff trước khi save.

---

## 13. Logging & Traceability

> **MỤC TIÊU:** Mỗi lỗi xảy ra phải truy xuất được trong 60 giây.

### 13.1. 3 Tầng Logging

**Tầng 1 — Audit Log** (bảng `audit_log`)
Mọi hành động THAY ĐỔI dữ liệu QUAN TRỌNG đều ghi:
- Tạo/sửa/xoá học viên
- Duyệt/từ chối đăng ký
- Điểm danh
- Ghi nhận thanh toán
- Tạo/cập nhật assessment
- Hoàn tiền
- Thay đổi role/status
- Áp dụng voucher
- Mọi order operation

```typescript
await audit({
  userId,
  action: 'session_registration.approve',
  entityType: 'session_registration',
  entityId,
  before: { status: 'pending' },
  after: { status: 'approved', approvedBy: userId, approvedAt: now() }
});
```

**Tầng 2 — Error Log** (bảng `error_logs`)
Mọi lỗi server-side:
```typescript
await logError({
  context: 'enrollments.create',
  userId: currentUser?.id,
  inputData: { courseId, paymentPlan }, // sanitized
  error: err,
  severity: 'error'
});
```

**Tầng 3 — Console / Vercel Logs**
Structured logging cho debug:
```typescript
log.info('[enrollments.create] Starting', { studentId, courseId });
log.warn('[capacity] Session full', { sessionId, count: 5 });
log.error('[payment] Failed to record', { studentId, error });
```

### 13.2. Format Bắt Buộc Cho Log

```
[context_in_brackets] short_message
{ key_data: value, ... }
```

Ví dụ:
```
[session_reg.approve] Approved registration
{ regId: "abc", sessionId: "def", studentId: "ghi", staffId: "jkl" }
```

### 13.3. Error Message Cho User vs Developer

**Cho user (UI toast):**
- Tiếng Việt, thân thiện
- Không có thuật ngữ kỹ thuật
- Có hành động đề xuất nếu được

```
"Không thể đăng ký buổi này. Ca đã đủ chỗ — bạn đang ở vị trí chờ số 2."
```

**Cho developer (logs):**
- Tiếng Anh hoặc Việt đều được, miễn rõ ràng
- Đầy đủ context để reproduce
- Stack trace giữ nguyên

```
[session_reg.approve] FAILED: Capacity exceeded
{ sessionId: "...", currentApproved: 5, capacity: 5, attemptedStudentId: "..." }
Stack: at approveRegistration (src/api/registrations/route.ts:42)
```

### 13.4. Quy Tắc Bắt Buộc

1. **Mỗi API route** có log start + log end (success/fail)
2. **Mỗi error throw** kèm context có ý nghĩa
3. **Không bao giờ catch silently** — luôn log
4. **Không log secrets** — sanitize password, token, CCCD
5. **PII trong logs** — chỉ ID, không log full info trừ khi thật cần
6. **Audit log không xoá** — append-only

### 13.5. Audit Log Viewer (Admin)

UI hiển thị:
- Filter theo: user, action type, entity, date range
- Show before/after diff
- Export ra CSV

### 13.6. Khi Vận Hành Có Lỗi

User flow để báo lỗi:
1. Vào Vercel Dashboard → Project → Logs tab
2. Filter theo thời gian xảy ra lỗi
3. Tìm dòng `[context] FAILED` hoặc severity `error`
4. Copy toàn bộ log block (bao gồm structured data + stack)
5. Paste cho AI: "Lỗi này xảy ra khi tôi [làm gì]"

---

## 14. Debugging Strategy

### 14.1. Cấp Độ Lỗi & Cách Xử Lý

| Severity | Ví dụ | Hành động |
|---|---|---|
| `info` | User login | Chỉ log, không cần xử lý |
| `warn` | Capacity sắp đầy, voucher hết hạn | Log + có thể hiển thị warning UI |
| `error` | API call fail, validation fail | Log + toast user + AI fix |
| `critical` | Database down, payment double-charge | Log + email admin ngay + AI fix khẩn cấp |

### 14.2. Common Issues Playbook

**Issue:** Học viên báo "Tôi đăng ký mà không thấy gì cả"
→ Check: `session_registrations` table by student_id
→ Check: notifications table — có gửi không?
→ Check: error_logs filter context = 'session_reg'

**Issue:** Điểm danh không lưu
→ Check: offline mode có active không (IndexedDB)
→ Check: network có ổn không
→ Check: error_logs filter context = 'attendance'

**Issue:** Học phí tính sai
→ Check: audit_log filter entity = 'enrollment', entity_id
→ So sánh before/after data
→ Reconcile với payments table

**Issue:** Vé bơi không trừ đúng
→ Check: pool_tickets.sessions_used vs số attendance
→ Check: audit_log với entity = 'pool_ticket'

### 14.3. Reconciliation Reports

Hệ thống tự chạy daily reconciliation:
- Tổng thu hôm nay (payments table) — so sánh với báo cáo doanh thu
- Số buổi đã dùng vé — so với attendance count
- Capacity tuân thủ — không buổi nào vượt quy định
- Enrollment status nhất quán với payments

Nếu phát hiện không khớp → email admin + log critical.

### 14.4. Health Check Endpoint

`GET /api/health`:
```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "auth": "ok",
    "storage": "ok",
    "email": "ok"
  },
  "timestamp": "..."
}
```

Vercel monitor endpoint này → nếu fail → alert admin.

---

## 15. Security & Privacy

### 15.1. Tuân Thủ Pháp Lý Việt Nam

**Nghị định 13/2023/NĐ-CP — Bảo vệ dữ liệu cá nhân:**
- Trang chính sách bảo mật public tại `/privacy`
- Học viên tick xác nhận khi đăng ký, lưu timestamp
- Right to access: học viên xem được toàn bộ dữ liệu của mình
- Right to delete: học viên yêu cầu xoá (qua admin, có quy trình)
- Data retention: dữ liệu học viên không hoạt động > 2 năm có thể archive

### 15.2. Đồng Ý Hình Ảnh/Video

2 mức consent tách biệt:
- **Học tập nội bộ** (bắt buộc khi đăng ký) — cho phép lớp ghi hình kỹ thuật để dạy
- **Marketing** (tuỳ chọn) — cho phép sử dụng trên mạng xã hội

Cả 2 lưu timestamp xác nhận trong `users` table.

### 15.3. Secrets Management

- `.env.local` — local development, không commit
- Vercel Environment Variables — production
- KHÔNG BAO GIỜ commit secret vào git
- KHÔNG BAO GIỜ paste secret vào chat với AI
- `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng server-side

### 15.4. RBAC Enforcement

3 tầng:
1. **UI** — ẩn tính năng không có quyền
2. **API** — `requireRole()` ở mọi protected route
3. **Database** — RLS policies ở Supabase

Mọi route phải có check ở TẦNG 2. UI và DB là defense in depth.

### 15.5. Sensitive Data Handling

- CCCD — encrypted at rest (Supabase column encryption)
- Mật khẩu — Supabase Auth tự hash (bcrypt)
- Số điện thoại — không encrypt nhưng có RLS

### 15.6. Rate Limiting

- Login: 5 lần fail / 15 phút / IP
- Registration: 3 account / SĐT / 24h
- API chung: 100 req / phút / user

### 15.7. CORS & CSRF

- CORS: chỉ allow `polaproject.com` ở production
- CSRF: Next.js mặc định protect, dùng server actions tận dụng

---

## 16. Testing Strategy

### 16.1. Cho Non-Developer

**Không cần viết automated test** — thay vào đó:

1. **Acceptance Checklist** mỗi tính năng
2. **Seed data script** để test thật
3. **Vercel Preview Deployment** để test trước khi production

### 16.2. Seed Data Bắt Buộc

`prisma/seed.ts` tạo:
- 1 admin, 2 staff
- 20 students với đa dạng status (prospect, enrolled, active, extension, completed, inactive)
- 5 enrollments active, 2 completed, 1 in extension, 1 refunded
- 10 active pool tickets, một số sắp hết
- 30 sessions trong 2 tuần (mix sáng/chiều)
- Sample attendance records, assessments
- 5 payments, 1 refund request
- 5 blog posts, 2 quizzes
- 8 shop products (mix 4 loại)
- 3 vouchers active
- Sample notifications

Chạy `npm run seed` → có data đầy đủ để test.

### 16.3. Acceptance Test Checklist Mỗi Phase

Format:
```
[ ] Test case 1: Description
    Steps: 1, 2, 3
    Expected: ...
    Verify in: UI / Supabase dashboard / Vercel logs
```

AI tạo checklist sau khi build xong, user tự check trên browser.

### 16.4. Manual Test Scenarios Quan Trọng

**Registration Flow:**
- [ ] Học viên mới tự đăng ký → tạo account thành công
- [ ] Trùng SĐT → bị block với thông báo rõ ràng
- [ ] Form thiếu trường bắt buộc → báo lỗi cụ thể
- [ ] Address dropdown load đúng dữ liệu

**Approval Flow:**
- [ ] Học viên đăng ký buổi → staff thấy trong queue
- [ ] Staff approve → học viên nhận notification
- [ ] Staff reject với lý do → học viên thấy lý do
- [ ] Ca đầy → đăng ký mới vào waitlist
- [ ] Walk-in thêm tại bể → tăng count đúng

**Financial Flow:**
- [ ] Ghi nhận thanh toán phương án A → enrollment status đúng
- [ ] Ghi nhận thanh toán phương án C → thấy pending balance + deadline
- [ ] Tạo refund request → calculation đúng
- [ ] Admin approve refund → audit log đầy đủ

**Assessment Flow:**
- [ ] Quick mode hoàn tất < 90s/HV
- [ ] Pre-fill từ buổi trước hoạt động
- [ ] Voice note record + lưu link
- [ ] Radar chart hiển thị đúng

### 16.5. Production Smoke Test (sau mỗi deploy)

1. Login với 1 admin, 1 staff, 1 student
2. Tạo 1 đăng ký mới + duyệt
3. Ghi nhận 1 thanh toán
4. Đánh giá 1 học viên
5. Check Vercel logs có error không

---

## 17. Deployment & Operations

### 17.1. Environment

| Environment | Purpose | URL |
|---|---|---|
| Local | Development | localhost:3000 |
| Preview | Test trước deploy | *.vercel.app (auto từ PR) |
| Production | Live | polaproject.com |

### 17.2. Environment Variables (.env.example)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database direct (Prisma)
DATABASE_URL=

# Email
RESEND_API_KEY=
EMAIL_FROM=support@polaproject.com

# App
NEXT_PUBLIC_APP_URL=https://polaproject.com
NEXT_PUBLIC_SCHOOL_NAME=Pola Project

# Vietnam locale
TZ=Asia/Ho_Chi_Minh
```

### 17.3. Domain DNS (Matbao → Vercel)

Trong trang quản lý Matbao, thêm:
```
Type: A     Name: @     Value: 76.76.21.21
Type: CNAME Name: www   Value: cname.vercel-dns.com
```

Trong Vercel: Add domain `polaproject.com` + `www.polaproject.com`.

### 17.4. Backup & Recovery

- **Supabase Pro daily backup** — 7 days retention
- **Manual export hàng tuần** — admin tự download JSON full
- **Vercel git-based** — toàn bộ code có lịch sử trên GitHub

### 17.5. Monitoring

- **Vercel Analytics** — page views, performance
- **Vercel Logs** — runtime errors
- **Supabase Dashboard** — DB usage, slow queries
- **Custom Health Check** — `/api/health` ping

### 17.6. Chi Phí Hàng Tháng

| Giai đoạn | Chi phí | Note |
|---|---|---|
| Development | $0 | Free tiers |
| Launch (Phase 4) | $25 ≈ 625k VND | Supabase Pro |
| Tăng trưởng (>300 HV) | $45 ≈ 1.1M VND | + Resend Starter |
| Scale lớn | $65+ ≈ 1.6M VND | + Vercel Pro |

### 17.7. Disaster Recovery

**Scenario: Database mất dữ liệu**
1. Supabase support khôi phục từ backup (within 1 day)
2. Nếu cần: import từ manual JSON export gần nhất

**Scenario: Vercel down**
1. Cảnh báo admin
2. Thông báo học viên qua Zalo OA (backup channel)
3. Vercel SLA 99.99%, hiếm xảy ra

**Scenario: Domain expire**
- Lịch nhắc gia hạn Matbao 30 ngày trước
- Backup: trỏ tạm về Vercel subdomain

---

## PHỤ LỤC: TODO / TBD

Những điều CHƯA chốt, cần quyết định trước khi build:

- [ ] Brand identity: logo chính thức (màu + font đã định hướng, cần file thiết kế)
- [ ] Combo 3 khoá: mức giảm giá cụ thể (%)
- [ ] Trường hợp B hoàn tiền (giữ vé bơi): học viên có tính vào sức chứa ca không?
- [ ] Combo 3 khoá: có ưu tiên đăng ký buổi không?
- [ ] Danh sách cụ thể ~20 sản phẩm/dịch vụ trong Shop
- [ ] Email template chi tiết (welcome, invoice, absence, birthday, ...)
- [ ] Google Workspace cho `support@polaproject.com` — owner cần đăng ký
- [ ] Tích hợp MoMo/VNPay — có làm Phase 10 không hay sau

---

## PHỤ LỤC: GLOSSARY

| Thuật ngữ | Nghĩa |
|---|---|
| **Buổi** | Một session học cụ thể tại một ngày + ca |
| **Khoá** | Một course 10 buổi (Ếch/Sải/Bướm) |
| **Vé bơi** | Phí vào hồ, tách biệt học phí |
| **Tiềm năng** | Status học viên tạo tài khoản nhưng chưa đặt cọc |
| **Ôn luyện** | Sau buổi 10 chưa đạt, học thêm chỉ trả vé |
| **Walk-in** | Học viên đến bể không đăng ký trước |
| **Pulse Check** | Báo cáo tự động hàng tuần các học viên cần follow-up |
| **MVP** | Phiên bản tối thiểu có thể dùng được |
| **Audit log** | Nhật ký hệ thống ghi mọi hành động quan trọng |
| **RLS** | Row Level Security của Supabase |

---

**Phiên bản:** 1.0
**Cập nhật cuối:** Khi bắt đầu Phase 1
**Maintainer:** Owner + AI

> Mọi quyết định nghiệp vụ phải được phản ánh ở đây. Code đi theo file này, không ngược lại.
