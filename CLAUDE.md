# Pola Project — Hệ Thống Quản Lý Lớp Bơi

> **File này là nguồn chân lý duy nhất của dự án.** AI phải đọc trước khi làm bất cứ việc gì. Người dùng cập nhật mỗi khi có quyết định mới.

---

## ⚠️ QUY TẮC BẮT BUỘC TRƯỚC KHI COMMIT

> AI KHÔNG ĐƯỢC commit một tính năng cho đến khi **TẤT CẢ** các hạng mục trong Definition of Done bên dưới đều được đánh dấu hoàn thành.

### Definition of Done — Cho Mỗi Module/Tính Năng

Mỗi khi user yêu cầu build một tính năng, AI **bắt buộc** phải build ĐẦY ĐỦ tất cả các lớp sau:

```
LAYER 1 — API (Backend)
  [ ] GET list endpoint (với pagination, filter)
  [ ] POST create endpoint (với Zod validation)
  [ ] GET detail by ID endpoint
  [ ] PATCH update endpoint
  [ ] DELETE/deactivate endpoint (nếu applicable)
  [ ] Audit log cho mọi write operation
  [ ] Error handling + logError() trên mọi catch

LAYER 2 — UI Admin (Quản trị)
  [ ] Trang danh sách (với search, filter, pagination)
  [ ] Form tạo mới (modal hoặc page riêng)
  [ ] Form chỉnh sửa
  [ ] Xem chi tiết
  [ ] Xoá/deactivate với confirmation

LAYER 3 — UI Staff (Nếu role staff cần dùng)
  [ ] Trang/view tương ứng với quyền staff

LAYER 4 — UI Student/User (Nếu học viên cần dùng)
  [ ] Trang/view cho học viên

LAYER 5 — Tích hợp hệ thống
  [ ] Notification gửi đến user liên quan khi có action
  [ ] Cập nhật seed.ts nếu cần test data
  [ ] Link/button điều hướng từ các trang liên quan
  [ ] Navigation sidebar được cập nhật nếu cần

LAYER 6 — Validation & Security
  [ ] Zod schema cho mọi input
  [ ] requireRole() đúng cho mọi API route
  [ ] Client-side validation khớp với server-side
```

### Ví Dụ Áp Dụng — Module "Shop"

| Layer | Hạng mục | Trạng thái |
|---|---|---|
| API | GET/POST products | ✅ |
| API | GET/POST/PATCH orders | ✅ |
| Admin UI | Danh sách đơn hàng + duyệt | ✅ |
| **Admin UI** | **Thêm/sửa/xoá sản phẩm** | ❌ **THIẾU** |
| Student UI | Giỏ hàng + đặt hàng | ✅ |
| Tích hợp | Notification khi duyệt đơn | ✅ |

→ Module Shop **CHƯA DONE** vì thiếu Admin UI quản lý sản phẩm.

---

## 📊 COMPLETENESS MAP — Trạng Thái Thực Tế

### Module: Authentication & Users
| Hạng mục | Status |
|---|---|
| Login/logout | ✅ |
| Middleware route protection | ✅ |
| Role-based routing | ✅ |
| Đăng ký tài khoản (học viên tự tạo) | ✅ `/register` với welcome email |
| Reset mật khẩu | ✅ `/forgot-password` → admin xử lý qua `/admin/password-resets`, gen temp password 1-time-display |
| Public landing pages | ✅ `/`, `/courses`, `/faq`, `/privacy` (NĐ 13/2023) |

### Module: Học Viên (Students)
| Hạng mục | Status |
|---|---|
| Admin: danh sách + filter + search | ✅ |
| Admin: tạo học viên | ✅ |
| Admin: chi tiết + sửa | ✅ |
| Admin: đăng ký khoá học | ✅ |
| Admin: tạo vé bơi | ✅ |
| Staff: xem danh sách | ✅ `/staff/students` read-only, ẩn tài chính |
| Student: xem hồ sơ bản thân | ✅ `/student/profile` |
| Student: tự sửa trường mềm | ✅ `/student/profile/edit-soft` (occupation, healthNotes, emergency) |
| Student: yêu cầu cập nhật trường định danh | ✅ `/student/profile/request-change` |
| Admin/Staff: duyệt yêu cầu cập nhật | ✅ `/admin/profile-requests` |
| Avatar upload (Supabase Storage) | ✅ `PhotoUploader` + bucket `poolane-public` (cần user tạo bucket lần đầu) |

### Module: Lịch Học & Điểm Danh
| Hạng mục | Status |
|---|---|
| Admin: lịch tuần | ✅ Redesigned — hiển thị HV inline (không cần click) |
| Admin: chi tiết buổi học | ✅ `/admin/schedule/sessions/[id]` với 4 section pending/approved/waitlist/khác |
| Admin: tạo buổi học | ✅ |
| Staff: duyệt đăng ký | ✅ |
| Staff: điểm danh | ✅ |
| Student: đăng ký buổi | ✅ |
| Student: xem lịch của mình | ✅ `/student/my-schedule` (30 ngày + attendance result) |
| Huỷ ca + hoàn vé tự động | ✅ |

### Module: Tài Chính
| Hạng mục | Status |
|---|---|
| Admin: finance dashboard | ✅ |
| Admin: ghi nhận thanh toán | ✅ (component) |
| Admin: danh sách hoàn tiền | ✅ `/admin/finance/refunds` với tab status + summary |
| Admin: tạo yêu cầu hoàn tiền | ✅ `/admin/finance/refunds/new` (preview tự tính) |
| Admin: duyệt + đánh dấu đã chuyển | ✅ `/admin/finance/refunds/[id]` |
| Student: xem lịch sử thanh toán | ✅ `/student/payments` với 3 summary card + transactions list |
| Student: xem khoản cần đóng | ✅ Banner đầu `/student/payments` liệt kê enrollment debt + nút thanh toán |
| Export Excel doanh thu | ✅ `/admin/reports` với 3 sheet (Tổng quan / Chi tiết / Theo loại) |
| Reconciliation báo cáo | ✅ `/admin/reports` check 4 mục mỗi ngày |
| **VietQR thanh toán** | ✅ Shop + enrollment đều có QR pay page, admin xác nhận thủ công |
| **Sepay webhook tự động** | ✅ Code sẵn (cần `SEPAY_API_KEY` env), unmatched UI tại `/admin/finance/unmatched` |
| Voucher CRUD | ✅ `/admin/vouchers`, 3 loại discount (percent/fixed/free pool session), tracking VoucherUsage |
| Improvement pack auto-create | ✅ Khi đơn shop `improvement_pack` được paid → tự tạo `ImprovementSessionPack` |

### Module: Đánh Giá Kỹ Năng
| Hạng mục | Status |
|---|---|
| Staff: form đánh giá quick/detailed | ✅ |
| Staff: pre-fill từ buổi trước | ✅ |
| Student: xem tiến độ + radar chart | ✅ |
| Admin: heatmap kỹ năng yếu lớp | ✅ `/admin/skill-heatmap` với selector ECH/SAI/BUOM |
| Tự đánh giá của học viên (buổi 5,9) | ✅ `/student/self-assessment/[courseId]/[sessionNumber]` |
| Hiệu quả giảng dạy theo giáo viên | ✅ `/admin/teacher-metrics` |
| Kế hoạch bài học (LessonPlan) | ✅ `/staff/lesson-plan/[sessionId]` |
| Thư viện bài tập (Exercise) | ✅ `/admin/exercises` + `/student/exercises` |
| Practice assignment (gán bài tập) | ✅ `/student/exercises/my` |

### Module: Shop
| Hạng mục | Status |
|---|---|
| Student: duyệt + đặt hàng | ✅ với search + 5 filter tabs + thumbnail ảnh |
| Student: xem đơn hàng của mình | ✅ `/student/shop/orders` |
| Student: thanh toán qua VietQR | ✅ `/student/shop/orders/[id]/pay` |
| Admin: duyệt/xử lý đơn hàng | ✅ tab pending/approved/paid/fulfilled/cancelled |
| Admin: xác nhận đã nhận tiền (manual) | ✅ button trên `/admin/shop/orders` |
| Admin: thêm/sửa/ngừng bán sản phẩm | ✅ `/admin/shop/products` (4 loại với conditional fields + photo upload) |
| Seed sản phẩm mẫu | ✅ 9 sản phẩm — `npx dotenv -e .env.local -- npx tsx prisma/seed-products.ts` |

### Module: Thông Báo & Communication
| Hạng mục | Status |
|---|---|
| Notification center (xem + đánh dấu đọc) | ✅ `/shared/notifications` |
| Admin: broadcast toàn lớp | ✅ `/admin/broadcast` |
| Push notification (Web Push API) | ✅ Infrastructure: `sw.js`, `PushSubscribeButton`, `/api/push/subscribe`, `manifest.json` (cần `VAPID_PUBLIC/PRIVATE_KEY` env để dùng thật) |
| Email gửi tự động (Resend) | ✅ 5 templates + sendEmail wrapper. Tích vào: register (welcome), payment record (receipt), refund transfer (confirmation), cron birthday/absence |
| **Chat real-time (Phase 19-25)** | ✅ Any-to-any DM + group chat ≤20 người. Polling 3s khi popover open, 10s list, 60s FAB badge. FAB thứ 3 (`MessagesFab`) + popover anchored. Full pages `/{admin,staff,student}/messages`. Rate limit 5 msg/10s cho student (admin/staff exempt). Symmetric CheckCheck read receipt. **Không** tạo notification cho chat (badge riêng đủ rồi). |

### Module: Blog & Nội Dung
| Hạng mục | Status |
|---|---|
| Public blog listing + detail | ✅ Với PublicHeader/Footer + cover image |
| API tạo bài viết | ✅ |
| Admin: UI tạo/sửa bài viết | ✅ `/admin/blog` + `/admin/blog/new` + `/admin/blog/[id]/edit` (Markdown editor, auto-slug có dấu Việt, cover upload) |
| Quiz API | ✅ |
| Student: UI làm quiz | ✅ `/student/quiz/[id]` với 3 loại câu hỏi + giải thích sau khi sai |
| Admin: UI tạo quiz | ✅ `/admin/quizzes/new` với dynamic question editor |
| Events UI | ✅ `/admin/events` + `/student/events` |
| Challenges UI | ✅ `/student/challenges` với progress bar |
| Video Drive links | ✅ `/staff/videos` admin add, `/student/videos` iframe embed Drive preview |
| Class photo album | ✅ `/admin/photos` upload + `/student/photos` gallery |
| FAQ public | ✅ `/faq` (8 entries seed) |

### Module: AI & Analytics
| Hạng mục | Status |
|---|---|
| AI dropout prediction + UI | ✅ |
| Staff stats (thống kê giảng dạy) | ✅ |
| Export Excel báo cáo | ✅ `/api/reports/revenue` (3 sheet) |
| Reconciliation report hàng ngày | ✅ `/api/reports/reconciliation` + cron job |
| Cron jobs (4 jobs) | ✅ `vercel.json` + `/api/cron/{birthday,pulse-check,reconciliation,absence-reminder}` (cần `CRON_SECRET` env) |

### Module: UI/UX
| Hạng mục | Status |
|---|---|
| Sidebar navigation | ✅ 8 nhóm có thể expand/collapse + Việt hoá + localStorage state |
| **True Dark/Light Mode (Phase 9)** | ✅ Đổi từ "2 brand color" (Theme A/B) sang true dark/light mode. `theme-dark` (navy/gold cho đêm muộn) + `theme-light` (lavender/peach cho ban ngày). ThemeSwitcher dùng Sun/Moon icons + label "Sáng/Tối". Adaptive tokens (`--surface`, `--nav-bg`, `--hero-bg`) đổi giá trị theo mode. Sidebar + hero adapt theo theme. Dashboard root wrap `.ambient-bg` đồng nhất với public. LocalStorage migrate `A→dark, B→light` tự động |
| **Apple Liquid Glass throughout (Phase 10)** | ✅ Apple iOS 26 / macOS 26 design language xuyên suốt. Token system: `--lens-{light,medium,heavy}` (blur+saturate+brightness), `--glass-tint-{1,2,3}`, `--specular-color`, `--radius-glass-{xs..2xl}`. Utility classes: `.glass-card`, `.glass-button`, `.glass-input`, `.glass-table-row`, `.card-tilt`. Mọi card + sidebar + button + input → semi-transparent backdrop-blur + specular streak animation (11s/lần). Sidebar specular streak 18s. Table body rows alternating tint + hover specular flash. `<TiltCard>` component + `useTilt()` hook cho 3D micro-tilt hero cards. 2 migration scripts: `migrate-glass.mjs` (264 file `bg-white` → `glass-card`), `migrate-glass-tables.mjs` (11 admin tables). Lighthouse final: **perf 88, a11y 100, bp 100**. |
| **Sidebar Fixed + Color Harmony (Phase 11)** | ✅ Sidebar `lg:fixed` (đứng yên khi cuộn page) + main `lg:ml-64` offset. Migration script `migrate-theme-harmony.mjs` thay 1474 hard-code `text-ink/N`, `border-ink/N`, `ring-ink/N`, `divide-ink/N`, `hover:bg-ink/N` thành `text-foreground/N` (adaptive). 30 buttons `bg-accent text-foreground` → `bg-accent text-ink` (CTA gold luôn cần dark text). `--foreground` token đổi từ static `var(--ink)` → adaptive (paper trong dark, ink trong light). Lighthouse: **perf 77-90, a11y 100, bp 100**. |
| **Design system foundation (Phase 1)** | ✅ Tokens (ink/paper/accent/mist/glass/shadow), 5 primitive mới (Chip/PageHeader/GlassPanel/StatCard/FloatingCard), glass utilities (`.glass-panel`/`.glass-pill`/`.ambient-bg`/`.heading-display`/`.eyebrow`), Cormorant italic display |
| **~70 trang redesign** | ✅ Public 6 + Student 24 + Admin 28 + Staff 10 — tất cả áp design language mới (hero dark ambient + italic display + Chip variants + soft glass) |
| 12 admin form pages | ✅ (Phase 7C) Redesign với PageHeader + ambient-bg pattern: students/new + [id]/enroll/ticket, sessions/new, shop/products/new + [id], vouchers/new+edit, blog/new+edit, quizzes/new, events/new, exercises/new+edit |
| Token cleanup (Phase 7B) | ✅ ~1000 replacements qua `scripts/migrate-tokens.mjs` — thay `bg-[#1C2B4A]`/`text-red-X`/`rounded-2xl` thành token (`bg-ink-soft`/`text-danger`/`rounded-card-lg`). Còn lại 19 hex (SVG fills, email templates — legitimate) |
| Auth pages polish | ⚠️ Pending (Phase 6): login/register/forgot-password chưa redesign theo design system mới (đã migrate token nhưng chưa thay layout) |
| Mobile audit (tables overflow + grid breakpoints + touch targets 44px) | ✅ 29 files fix |
| Focus rings (a11y keyboard navigation) | ✅ `:focus-visible` outline qua accent token |
| Skip-to-main-content link | ✅ (Phase 7A) DashboardShell + Public layout có "Bỏ qua điều hướng" link |
| Loading states (skeleton) | ✅ 11 critical pages có `loading.tsx` (admin/schedule + reports + broadcast thêm Phase 7A) |
| Error boundaries | ✅ 1 root + 4 per-page + 2 layout-level (public, auth thêm Phase 7A) |
| Button loading state | ✅ (Phase 7A) `<Button loading>` prop tự render Loader2 spinner + `aria-busy` |
| ConfirmDialog component | ✅ (Phase 7A) `<ConfirmDialog>` dùng @base-ui/react/alert-dialog thay 4 chỗ `window.confirm()` (blog, exercises, password-resets, assignments) |
| Image alt text fix | ✅ 6 files |
| EmptyState component | ✅ Adoption rộng rãi sau Phase 1 (toàn bộ student/admin/staff lists) |
| PWA manifest + icons | ✅ `manifest.json` + icon 192/512 + apple-touch + theme color |
| Mobile responsive audit thực thiết bị | ⚠️ Đã pass devtools, chưa test iPhone/Android thật |
| QA Lighthouse + a11y 2 trang public (Phase 7) | ✅ Landing 89/100/100, Courses 89/100/100 (sau cả 4 sub-phase). Đã fix: link aria-label, eyebrow contrast (`.eyebrow` opacity 0.85), manifest 307 redirect, alt text. Báo cáo: [qa/phase7/REPORT.md](qa/phase7/REPORT.md) |
| **VisionOS overhaul (Phase 8)** | ✅ Motion infrastructure (`motion` v12 + LazyMotion + CSS spring tokens + 8 keyframes mới), Animated ambient (dual-layer sway), Multi-tier glass (layer 1/2/3 + hover glow), Polaris brand motion (PolarisStar component + StarField particle field), Wave SVG divider + ripple hook, Page cinematic (ScrollReveal + Stagger components), Theme A↔B smooth fade (cinema 800ms). Lighthouse sau overhaul: 80-90 perf / 100 a11y / 100 bp. Respect `prefers-reduced-motion`. |
| QA 3 trang protected (student/admin dashboard + schedule) | ⚠️ Pending — owner chạy thủ công qua Chrome DevTools Lighthouse panel (cần login session) — hướng dẫn trong `qa/phase7/REPORT.md` |
| Screenshot diff theme A↔B (5 trang × 2) | ⚠️ Pending — owner chạy thủ công, lưu vào `qa/phase7/screenshots/` |

---

## 🔴 DANH SÁCH ƯU TIÊN — Việc Cần Làm Tiếp

Theo thứ tự quan trọng (đã hoàn thành redesign sâu, giờ unblock infra để go-live):

1. **Deploy Vercel** + trỏ domain poolane.vn (cần Vercel + Matbao access) — prerequisite cho mọi infra dưới
2. **Setup Sepay** (user đã ký hợp đồng) — code sẵn sàng, cần `SEPAY_API_KEY` env + cấu hình webhook `https://poolane.vn/api/webhooks/sepay` trên dashboard Sepay. Xem `SETUP-AFTER-WAKE.md`
3. **Setup Resend** → verify domain `poolane.vn` (MX/TXT trên Matbao) + `RESEND_API_KEY` → email biên lai/welcome/refund gửi thật
4. **Setup Supabase Storage bucket** `poolane-public` (tạo trên Supabase dashboard, public read) → photo upload hoạt động
5. **Gen VAPID keys** (`npx web-push generate-vapid-keys`) + env → push notifications hoạt động
6. **Phase 6 — Auth polish** (login/register/forgot-password): redesign theo design system mới (split layout brand artwork + form, micro-copy ấm áp, glass technique)
7. **Phase 7 — UX/UI Polish toàn diện**: ✅ 4 sub-phase xong. Public Lighthouse 89/100/100 cả 2 trang.
8. **Phase 8 — VisionOS overhaul**: ✅ 8 sub-phase xong (motion foundation + animated ambient + multi-tier glass + Polaris brand motion + Wave SVG + page cinematic + button spring + LazyMotion perf optimization). Lighthouse perf giảm xuống 80-90 (chấp nhận với motion-heavy hero), a11y/bp giữ 100.
9. **Phase 9 — True Dark/Light Mode**: ✅ 7 sub-phase (nav bug fix longest-match + hover bump, token rebuild với adaptive `--surface/--nav-bg/--hero-bg`, ThemeSwitcher Sun/Moon + Sáng/Tối, adaptive sidebar + hero, dashboard ambient-bg wrap). Theme A/B rename → `theme-dark/theme-light`. Cards không còn hard-code `#FFFFFF`. localStorage auto-migrate. Build pass, perf 70-76 (motion-heavy hero acceptable), a11y/bp 100.
10. **Phase 10 — Apple Liquid Glass throughout**: ✅ 12 sub-phase. Xuyên suốt design language Apple iOS 26 / macOS 26. Lens tokens (blur+saturate+brightness), glass tints adaptive, specular streak animation 11s, concentric radius scale. Sidebar + mọi card + button + input glass + lensing. Table body rows glass-table-row alternating tint. TiltCard component cho 3D micro-tilt. 2 migration scripts (264 + 11 replacements). Lighthouse **perf 88, a11y 100, bp 100** — đạt mọi ngưỡng SSOT.
11. **Phase 11 — Sidebar Fixed + Color Harmony**: ✅ Sidebar `lg:fixed lg:ml-64` đứng yên khi cuộn. Mass migration 1474 replacements/135 files: `text-ink/N` → `text-foreground/N`, `bg-accent text-foreground` → `bg-accent text-ink` (30 CTA buttons giữ dark text trên gold). `--foreground` token đổi adaptive. Cards trong dark mode không còn chữ "chìm". Hero bands không còn "block đen choáng" trên light mode. Lighthouse a11y 100/bp 100.
12. **Phase 12 — Liquid Glass Reset (family.co reference)**: ✅ Reset design layer Phase 8-11 → family.co pastel Liquid Glass. Token system `.lqg-*` ở `:root` (light) + `html.lqg-dark` (dark deep purple-grey `#0E0D14`). 5 primitives mới ở `src/components/ui/glass/`: `AmbientMesh`, `GlassCard`, `GlassButton`, `GlassInput`, `RefinedNumber`. Smart CSS-level unification: `.glass-card`/`.glass-button`/`.glass-input`/`.pola-nav` đổi sang LQG tokens → 264 usages auto-inherit family.co palette. Sandbox demo tại `/sandbox/liquid-glass`. Auto-fix 2 critical security. Lighthouse landing 89/100/100 sau a11y bump.
13. **Phase 12.X — Sidebar fixed bug fix**: ✅ Root cause `.pola-nav { position: relative }` (Phase 10) silently override `.pola-sidebar { position: fixed }` qua CSS cascade. 5 fix attempts trước thất bại vì patch symptoms. Cuối cùng đào built CSS bundle (`grep -oE "\.pola-nav\s*{[^}]*}" .next/static/chunks/*.css`) tìm ra. Notion-style layout: `.pola-shell { padding-left: 16rem }` + `.pola-sidebar { position: fixed }`. Bài học → CLAUDE.md section 14.5.
14. **Phase 12.1 — Form input auto-glass + Debugging Strategy docs**: ✅ Auto-glass cho `input-blog`/`input-pola` aliases qua base CSS rules. Tài liệu hoá Visual/CSS Bug Debugging Workflow ở section 14.5 (5-step procedure + 2 rules).
15. **Phase 13 — Typography Discipline**: ✅ Italic Cormorant từ 204 lần dùng SAI → chỉ 1 (philosophy blockquote). Migration script `migrate-typography.mjs` context-aware (skip blockquote/greeting/blog/quote pattern) → 116 replacements/55 files. 2 utility class mới: `.lqg-headline` (sans bold 600 cho headings) + `.lqg-numeric-sans` (sans tabular 700 cho stats/currency, 7 size variants). Primitives update: `RefinedNumber` default `variant='sans'`, `PageHeader` cả 2 nhánh dùng `.lqg-headline`, `StatCard` value dùng `.lqg-numeric-sans`. Rule mới: italic CHỈ cho quote/citation, blog body, greeting message.
16. **Phase 13.1 — Specular streak cleanup**: ✅ Phase 10 over-applied vệt sáng specular qua `.glass-card` (264 chỗ) + sidebar `.pola-nav` (18s loop) → "vương vãi" khắp app. Scope lại CSS chỉ cho `.glass-button` + `.glass-pill` (element nhỏ) + opt-in `.glass-shimmer`. Default `GlassPanel.shimmer = false`, `GlassCard.specular = false`. Sidebar specular tắt. `PublicHeader` bỏ class `lqg-specular`. 4 commit: `c36ac91`, `7b540d9`.
17. **Phase 13.2 — Default light + mobile login**: ✅ ThemeProvider default `'dark'` → `'light'`. Bump localStorage key `poolane-theme` → `poolane-theme-v2` để force migrate user cũ (dark có visual bugs, không muốn user mắc kẹt). Bỏ legacy A/B migration. PublicHeader login button bỏ `hidden sm:inline-flex` → show mobile (compact px-2.5 text-xs). 2 commit: `105869c`, `e831be5`.
18. **Phase 14 — Dark mode contrast boost**: ✅ Fix 4 BLOCKERS + 5 SHOULD-FIX qua CSS layer override trong `globals.css`. RadarChart hard-coded `rgba(28,43,74,...)` + `#1C2B4A` → `currentColor` adapt theme. Append 80 dòng CSS scope `.theme-dark`/`.lqg-dark` boost opacity utilities: border `/8` → 18%, `/15` → 32%; ring `/8` → 18%, `/15` → 32%; text `/30` → 55%, `/50` → 68%; bg/divide tương tự. Tailwind `@custom-variant dark` mở rộng recognize `.theme-dark + .lqg-dark + .dark` (trước chỉ `.dark` → mọi `dark:` variant trong code không hoạt động). 3 commit: `d9f6d64`, `0cc4ad2`, `326b10d`.
19. **Phase 15 — AI polish (rule-based)**: ✅ Dropout prediction + recommendation decision tree (priority/action/template per HV), `src/lib/ai/skill-comments.ts` rule engine cho `/student/progress` (overall + improvements + weaknesses + encouragement + graduation %). KHÔNG dùng LLM (Claude API). Lý do: scale 200 HV đủ insight, cost saving. Commit: `f24ecd4`.
20. **Phase 15.1 — STRICT payment validation**: ✅ `confirmOrderTransfer()` check `input.amount === order.finalAmount` khi `source=='sepay'`. Mismatch → `AMOUNT_MISMATCH` error → unmatched + notify admin. Manual confirm (admin click `/admin/shop/orders` "Xác nhận đã nhận tiền") bypass strict (admin đã verify sao kê). Enrollment KHÔNG strict (partial pay OK cho plan B/C). Commit: `476edcc`.
21. **Phase 15.2 — Test account protection + Data integrity**: ✅ Demo accounts (`0900000088` student + `0900000099` staff, pass `PoolaneDemo@123`) chạy luồng thật (no bypass logic). API DELETE block với 403 `DEMO_ACCOUNT_PROTECTED`. Daily cron 5:30 sáng VN `/api/cron/ensure-test-account` tự re-create nếu missing. Query-layer filter: `getDemoStudentIds()` helper trong `src/lib/demo-account.ts` cached 60s, exclude khỏi 7 analytics queries (admin/dashboard, reports/revenue, ai/dropout-risk, skill-heatmap, cron/{pulse-check, reconciliation, absence-reminder}). Audit log KHÔNG filter (debug đầy đủ). Commits: `35bb3ee`, `b9a896f`.
22. **Phase 15.3 — UX micro-fixes**: ✅ Password reveal toggle (GlassInput prop `revealable`), session restore button (`/api/sessions/[id]/restore` + UI), admin tương tác duyệt HV trực tiếp tại `/admin/schedule/sessions/[id]` (RegistrationActionRow client component), ProductForm router.push same-URL bug fix (stay on page + setSubmitting(false) cho mode='edit'). Commits: `2b3373b`, `6a3d914`, `a5b5f6a`, `144840d`.
23. **Phase 16 — Quiet luxury UI**: ✅ Xoá HOÀN TOÀN code (không chỉ disable): `glow` + `withReflection` props (PolarisStar), `shimmer` + `specular` props (GlassPanel/GlassCard), 4 keyframes (`liquid-specular`, `lqg-specular-anim`, `pola-glass-shimmer`, `pola-glow-pulse`), 4 utility classes (`.motion-glow`, `.glass-shimmer`, `.lqg-specular`, `.motion-glass-shimmer`), 2 CSS vars (`--specular-color`, `--specular-angle`), `waterLinePath` + `reflectionPath` từ theme.config.ts. **68 decoration blur blob `<div>` xoá khỏi 61 file** (mass migration script). **12 loading.tsx skeleton xoá** (Next.js convention, owner muốn instant navigate). Apple Liquid Glass framework giữ (frosted bg + blur + border + hover) — chỉ bỏ animation loop. Net: -148 lines code, +30 lines comment. Commits: `c36ac91`, `7b540d9`, `dd6eb32`, `ef6b632`, `b7edf23`, `e162d32`, `0f83195`.
24. **Phase 16.1 — Code clean discipline**: ✅ Lint 0 errors + 0 warnings (từ 44 problems). ESLint config: ignore `qa/`/`scripts/`/`prisma/`, disable `react-hooks/set-state-in-effect` + `react-hooks/purity` (React 19 strict overkill cho client component fetch pattern + Server Component Date.now() acceptable), accept `_` prefix unused convention. Fix actual: 4 unescaped quotes (`"` → `&ldquo;`/`&rdquo;`), `Date.now()` impure → extract `const sevenDaysAgo`, 10+ unused imports, `useMemo` wrap `groups`+`bottomItems` trong DashboardShell. Commit: `a78662e`.
25. **Phase 16.2 — Bỏ theme transition cinematic fade**: ✅ Xoá `transition: background-color/color` 800ms từ `.ambient-bg`, `html, body`, `.lqg-body`. Theme switch (Sun/Moon) bây giờ instant. Lý do: cảm giác lag, app focus mode không cần animation. Commit: `cad4ee3`.
26. **Phase 17 — Floating Action System (Bell + Quick Add FAB)**: ✅ 2 FAB stacked dọc bottom-right desktop+mobile. **NotificationFab** (Bell) — badge 99+, poll 60s pause khi tab hidden, click item mark-read + navigate actionUrl. **QuickAddFab** (`+`) — popover menu items per role (admin 4 / staff 3 / student 3, tần suất cao nhất). FAB style: `bg-ink dark:bg-paper` + `bg-accent text-ink` solid (contrast cao). `side="left"` popover (tránh che FAB phía trên). Single-popover state ở `FloatingActions` (chỉ 1 mở 1 lúc). Cart-bar push-up: `data-shop-cart-bar` MutationObserver detect → đẩy FAB lên cart.height + 12. Hide khi mobile sidebar mở (`hidden={sidebarOpen}`). Z-index: FAB z-40, Popover.Positioner z-[60], popup z-50. Xoá Bell mobile header + sidebar item "Thông báo" student. Commits: `c29108f`, `2d7f219`, `b47651b`.
27. **Phase 17 — Notification deep-link audit + actionUrl backfill**: ✅ Trang `/shared/notifications` items giờ clickable navigate `actionUrl` (wrap `<button>`, icon `ArrowRight →`). AUDIT toàn bộ `prisma.notification.create`: 12 creator thiếu actionUrl — thêm (assessments → `/student/progress`, payments → `/student/payments`, sessions cancel/restore/registrations → `/student/my-schedule`, shop orders → conditional approve/list, momo webhook → `/student/payments`, etc). Script `prisma/backfill-notification-action-urls.ts` rule-based match title → 16 rules + special case "Đơn hàng được duyệt" lookup metadata.orderId → deep-link `/student/shop/orders/{id}/pay`. Production DB chạy 1 lần → 10/10 noti có actionUrl. Commits: `8255e2d`, `5af27ac`.
28. **Phase 17 — Hydration fix: Chip asButton nested**: ✅ Lỗi "button cannot be descendant of button" trong 14 chỗ (`<button><Chip asButton>` × 2 + `<Link><Chip asButton>` × 12). Fix: bỏ outer button → Chip asButton onClick trực tiếp; bỏ `asButton` khi parent là Link/a → Chip render span. Files: admin/shop/orders, admin/password-resets, admin/finance/{unmatched,refunds}, admin/profile-requests, admin/exercises, admin/students, admin/shop/products, admin/skill-heatmap, staff/students, student/exercises, public/blog. Commit: `3573b1c`.
29. **Phase 17.1 — Schedule inline approve/reject** (deprecated bởi 17.5): ✅ Owner click HV pending → expand inline 3 button (Duyệt/Từ chối/Huỷ) → PATCH API + router.refresh. Default reject reason `teacher_decision`. Owner sau muốn multi-select → refactor sang 17.5. Commit: `8516797`.
30. **Phase 17.2 — Withdraw action (approved → withdrawn)**: ✅ Mở rộng `approveRegistrationSchema.action` enum thêm `withdraw`. API validate status='approved' trước rút. Notification type='cancellation', title 'Bạn đã được rút khỏi buổi học', body kèm ngày + slot. Approved row click expand → 3 button (Cho nghỉ buổi / Xem hồ sơ / Huỷ). Commit: `b2119ab`.
31. **Phase 17.2 — Theme FOUC fix**: ✅ Inline blocking `<script>` trong `<head>` root layout — đọc localStorage `poolane-theme-v2` SYNC trước first paint, add class `theme-light`/`theme-dark` + `lqg-dark` + `data-theme` attr. Storage key đồng bộ với ThemeProvider. Tránh flash dark→light khi hard refresh. Cũng fix sidebar expansion FOUC qua `useIsomorphicLayoutEffect` (useLayoutEffect client + useEffect SSR fallback) cho `pola.sidebarExpanded` localStorage read. Commits: `3ee3d42`, `b915b29`.
32. **Phase 17.2 — Hero-block adaptive bg + text-paper override**: ✅ Bug: 61 page dùng `.hero-block` với `text-paper/55` eyebrow — nhưng `.hero-block { background: transparent }` (Phase 9 legacy) → text cream@55% trên nền cream-paper light mode → invisible. Fix single CSS thay vì sửa 61 file: `.hero-block { background: var(--hero-bg); color: var(--hero-fg) }` + override 7 opacity variants (text-paper, /40, /45, /55, /60, /65, /70, /80) qua `color-mix(in srgb, var(--hero-fg) N%, transparent)` trong scope `.hero-block`. Light: ink purple @ 55% trên peach gradient — readable. Dark: cream @ 55% trên navy — readable. Commit: `990c4ab`.
33. **Phase 17.3 — Admin Settings system (dynamic config)**: ✅ DB table `SystemSetting (key, value Json, updatedAt, updatedBy)`. API `GET /api/admin/settings` + `PATCH` (zod per-key schema validation). Page `/admin/settings` 5 tab (Chip-style):  
   - **Thao tác nhanh**: catalog `QUICK_ADD_CATALOG` (14 items × roles) + per-role pick max 5 + reorder ↑↓  
   - **Lọc thông báo**: 9 notification types checkbox (empty = show all)  
   - **Sidebar**: rename labels per group key (vd `banhang` → "Doanh thu") + reorder ChevronUp/Down  
   - **Định dạng số**: amount style (`vn_full` `1.300.000đ` / `vn_compact` `1,3M` / `no_symbol` / `us`), percent decimals (0/1/2), thousand separator (`.` VN / `,` US) — defaults cho widget builder  
   - **Bộ màu**: placeholder ("Sáng/Tối qua ThemeSwitcher")  
   `lib/settings.ts` exports `SettingsMap`, `SETTING_DEFAULTS`, `getSetting<K>(key)`, `getAllSettings()`. FAB + DashboardShell fetch `/api/settings` (public) + `/api/admin/settings` (admin) → wire sidebar labels, quick add items, notif filter. Pattern: lift dynamic config từ hardcode → DB. Sidebar item "Thiết lập" trong group "Hệ thống". Commits: nhiều — xem `6a96359` series.
34. **Phase 17.3 — Sidebar restructure**: ✅ Admin: gộp 3 item nhóm cũ "Phân tích" (AI / Heatmap / Hiệu quả giảng dạy) vào "Tổng quan" → xoá nhóm "Phân tích" (8 → 7 groups). Đổi tên "Cửa hàng" → **"Bán hàng"** + thêm item "Cửa hàng" (preview) trỏ `/admin/shop`. Item "Sản phẩm" icon Package thay ShoppingBag (đỡ nhầm với group icon). Thêm group mới "Hệ thống" chứa "Thiết lập". Commits: `6a96359`, `8a41a72`.
35. **Phase 17.3 — Shop preview Shopee-style + reorder**: ✅ Schema `Product.displayOrder Int @default(0)` + index. Init script `prisma/init-display-order.ts` gán 10, 20, 30... step 10 cho dễ insert middle. API `GET /api/shop/products` orderBy displayOrder ASC. NEW `PATCH /api/shop/products/reorder` swap với neighbor via $transaction (atomic, audit log, admin only). NEW page `/admin/shop` (preview grid 2/3/4 col mobile/tablet/desktop) với badge `#1, #2...` góc trên phải, 2 nút ↑↓ overlay góc trên trái, badge "ĐÃ TẮT" khi inactive, "Hết hàng" khi out-of-stock. Optimistic UI: setItems trước, rollback nếu API fail. Student `/student/shop` cũng convert sang grid layout match preview. Commit: `6a96359`.
36. **Phase 17.4 — Schedule multi-select bulk action**: ✅ Replace inline expand pattern (Phase 17.1) bằng checkbox-based selection cross-session. Schema action enum thêm `restore` (withdrawn → approved). New components: `ScheduleGrid.tsx` (client wrapper quản lý `selectedIds: Set<string>` + regLookup + counts memo + handle bulk Promise.all PATCH), `SelectionActionBar.tsx` (sticky top, 4 button: Duyệt / Không duyệt / Cho nghỉ / Cho đi học lại với count per status), `InteractiveSessionCard.tsx` (rewrite: checkbox button per row, render 3 nhóm approved/pending/withdrawn visual khác nhau). Query include `'withdrawn'` (trước chỉ approved/pending/waitlist). Action-status matrix: pending→approve→approved, pending→reject→rejected, approved→withdraw→withdrawn, **withdrawn→restore→approved**. Bỏ container hover lift `glass-card-hover`. Commit: `8a41a72`.
37. **Phase 17.4 — Dashboard Builder Power BI style**: ✅ **Pivot fix**: `pointerWithin` → `closestCenter` (zones stack dọc, closestCenter ít ambiguous), stable DraggableChip key `${zone}:${field.table}.${field.column}:${i}` (bỏ phantom reuse khi field move zone), if-else if cho handleDragEnd remove section (mutual exclusive defensive), drop zone isOver `ring-2 ring-accent bg-accent/15 shadow-soft`. **Canvas free-form**: install `react-grid-layout@^1.5.0` (v2 đổi API hoàn toàn — bỏ WidthProvider HOC → hooks pattern; downgrade về v1.5 stable). DashboardViewClient replace static grid bằng `<ResponsiveGridLayout>` (cols lg=12 md=10 sm=6 xs=4, rowHeight=60, margin 12px), draggableHandle `.widget-drag-handle`, draggableCancel `.widget-actions`, compactType vertical. NEW API `PATCH /api/admin/dashboards/[id]/layout` batch update positions via transaction + audit log. Default widget position `{x:0, y:9999, w:6, h:5}` (compactType đẩy về vị trí khả dụng). Visual: dotted grid bg `.dashboard-canvas` qua radial-gradient theme-aware, hover-reveal resize handle (custom chevron qua CSS border), placeholder dashed accent ring khi drag. Commits: `e973d63`, `4f3418a` (hotfix `prisma.widget` → `prisma.dashboardWidget` model name).
38. **Phase 17.4 — Notification popover polish**: ✅ Owner feedback: (1) cursor pointer hover, (2) noti không biến mất sau click, (3) viewport 4 items có scroll, (4) "Đánh dấu đọc tất cả" button. ROOT CAUSE biến mất: logic cũ `preview = (unread.length > 0 ? unread : filtered).slice(0, 7)` — khi còn unread, list CHỈ show unread → noti vừa đọc bị filter out → "biến mất". FIX: luôn show `filtered` (sort unread đầu, read sau), slice 20 (DOM limit), scroll area `max-h-[304px]` (~4 items × 76px). Unread visual: `bg-accent/8 ring-1 ring-accent/15 + dot accent + bold`. Read: `opacity 55% + dimmer` — vẫn ở list, phân biệt với unread. Mark-all-read button header phải khi `unreadCount > 0`, optimistic UI + Promise.all PATCH. Commit: `b47651b`.
39. **Phase 18 — Register polish + Sprint 1 schedule UX (launch prep)**: ✅ Trang register là first impression khi owner thông báo lớp + ưu đãi 2 buổi miễn phí. 6 thay đổi:
   - **Border input visible** — scope `[data-auth-page] .lqg-input` border-color 22% text-primary (trước ~6%)
   - **Ngày sinh dd/mm/yyyy masked** — `src/components/forms/DateInput.tsx` NEW: tự format gõ (15011990 → 15/01/1990), validate 31/02 reject, emit ISO. Bỏ native `<input type="date">` (locale inconsistent)
   - **Giới tính cùng height Date** (lqg-input-md 42px)
   - **Email required + helper text on focus** — schema `z.email()`, "💡 Sử dụng để nhận hoá đơn..."
   - **Photo consent OPTIONAL + (i) tooltip** — `src/components/ui/InfoTooltip.tsx` NEW Popover @base-ui/react với content thuyết phục
   - **Address 2 cấp mới (đơn vị hành chính 01/07/2025)** — `src/components/forms/VnAddressSelect.tsx` NEW cascading Tỉnh + Phường/Xã từ provinces.open-api.vn (free, no key). Bỏ Quận/Huyện. Flatten wards từ all districts. Cache sessionStorage. DB district=null cho HV mới
   - Sprint 1 schedule UX: SLA badge "Thường duyệt ~X giờ" (cache 1h), waitlist position, ConfirmDialog confirmation step trước register, "Tìm buổi khác" CTA cho rejected/withdrawn, hero debt card student dashboard.
   Commit: `19a75a1`.
40. **Phase 18.1 — Modal portal + Huỷ đơn + Shop polish + iOS Safari**: ✅ Modal "Xác nhận chuyển khoản" bị clip trong order card. ROOT CAUSE: `.lqg-card-hover` dùng `will-change: transform` → CSS spec scope `position: fixed` vào parent stacking context. FIX: refactor `ConfirmTransferButton` sang `@base-ui/react/dialog` với Portal → render document.body. Áp tương tự shop ProductDetailModal (photo gallery + description + qty stepper + multi-photo badge). Cart price contrast `text-accent` → `text-paper`. NEW nút "Huỷ đơn" cho admin duyệt nhầm: status `approved` → `cancelled` + restore stock physical. Sidebar bottom user info wrap button trigger AccountSettingsDialog. **iOS 16.3 Safari fix**: HV iPhone 11 không ấn được Login/Register button. WebKit bug #237876 — touch events fail trên child khi parent có `backdrop-filter` (fix ở 16.4+). NEW `(auth)/layout.tsx` wrap `data-auth-page` + CSS override tắt `backdrop-filter` cho auth `.lqg-card-*`. **Sidebar opacity** bump 78%→94% (`--lqg-bg-elevated`). Commits: `3a98ffc`, `e7d4768`, `05b4bc3`, `7fc577f`.
41. **Phase 18.2 — PoolTicket auto-create từ shop order + backfill**: ✅ HV Hoàng Thị Huyền Trang mua 3× "Vé bơi 01 Lượt" qua shop, paid, nhưng `/student/schedule` hiện "Chưa có vé". ROOT CAUSE: `confirmOrderTransfer()` chỉ handle `improvement_pack` + `physical`. Product "Vé bơi" type=`service` → bị skip. Fix:
   - ProductType enum thêm `pool_ticket` (Prisma `db push` lên prod Supabase)
   - Helper `src/lib/payments/pool-ticket-from-order.ts` NEW: subtype detect SKU prefix `TICKET-FIRST/SINGLE/WEEKLY/DAILY/MONTHLY`, fallback name regex `/^(vé|thẻ)\s+bơi/i` cho data cũ. 'First' guard 1 ticket lifetime.
   - Wire vào `shared-confirm.ts` + admin pay action
   - Backfill: `prisma/backfill-pool-tickets.ts` + API `POST /api/admin/backfill-pool-tickets` + button "🎫 Quét vé thiếu" trong `/admin/shop/orders` hero. Idempotent dedupe theo `studentId + pricePaid + ±1 day` (tránh conflict với manual create — không dùng subtype vì manual=single, auto-detect=subsequent dễ trùng).
   Commits: `637b363`, `bea7c1b`, `e1b86b8`.
42. **Phase 18.3 — Registration schema mismatch fix**: ✅ BUG: mọi HV đăng ký buổi học đều fail "Thông tin không hợp lệ". ROOT CAUSE: `registerSessionSchema` yêu cầu `sessionId` UUID trong body nhưng client chỉ gửi `{studentId, courseId}` (sessionId nằm trong URL params). Zod safeParse fail → 400. Fix: bỏ `sessionId` khỏi schema (đã có trong URL `/api/sessions/[id]/registrations`), thêm `studentId` optional + `courseId` nullable. Commit: `79dc606`. **BÀI HỌC**: schema body validation phải đồng nhất với client payload — không yêu cầu field đã có ở URL params.
43. **Phase 18.4 — Registration API ticket validation (defense-in-depth)**: ✅ Trước phase UI disable button khi noTicket, nhưng admin/staff bypass UI hoặc race condition có thể tạo registration cho HV không vé. Thêm 2 check trong POST `/api/sessions/[id]/registrations`: `NO_TICKET` (400) nếu không poolTicket active, `TICKET_EXHAUSTED` (400) nếu sessionsLeft ≤ 0. End-to-end simulation HV Hoàng Thị Huyền Trang: pass → admin schedule hiện đúng "Hoàng Thị Huyền Trang (approved) · ECH". Commit: `0b7a777`.
44. **Phase 18.5 — Multi-ticket aggregate UI + breakdown**: ✅ BUG: HV có 2 active tickets (manual first 12 + auto-created single 3) → UI hiện "Vé còn 3" thay 15. ROOT CAUSE: 6 chỗ query `poolTickets` với `take: 1, orderBy desc` → chỉ lấy thằng mới nhất, ignore vé first cũ.
   NEW `src/lib/ticket-aggregate.ts`: `getTicketAggregate()` gộp sessions across ALL active, `getTicketBreakdown()` format `["Vé lần đầu 12/12", "Vé lẻ 3/3"]`. Trả primaryTicket (oldest active) + isLow/isOutOfTicket/isNoTicket counts.
   Update 6 files (student schedule, dashboard, admin/staff student detail, API registrations queue, admin schedule session detail). UI render breakdown subline khi ≥2 vé. Attendance API KHÔNG đổi (deduct newest-first → linear UX). Commit: `c99102c`.
45. **Phase 18.6 — HV self-service avatar + change password**: ✅ Schema `User.avatarUrl String?` migration. NEW `AvatarUploader.tsx` (PhotoUploader wrap, max=1, variant=single), `ChangePasswordDialog.tsx`. NEW API `PATCH /api/users/avatar` + `POST /api/auth/change-password`. Section "Tài khoản & Bảo mật" trên `/student/profile`. Avatar hiển thị: hero profile + mobile header AvatarPopoverButton + sidebar bottom (desktop). AuthUser interface thêm avatarUrl. Commit: `3ccd61f`.
46. **Phase 18.7 — Avatar system-wide display**: ✅ Owner: avatar phải có giá trị toàn hệ thống. Audit + wire:
   - NEW `src/components/ui/Avatar.tsx` reusable (size xs/sm/md/lg/xl, variant default/hero/mist/accent/ink, initialsStyle first/both)
   - 4 Prisma query thêm `avatarUrl`: admin/students list, admin/dashboard recentStudents, staff/students, admin/schedule/sessions/[id]
   - 6 location render: admin/staff list + detail hero, admin dashboard widget, admin schedule session detail RegistrationActionRow
   - Schedule grid mini-initials (h-5 w-5) KHÔNG đổi (quá nhỏ)
   - Admin/staff: click avatar (sidebar bottom desktop hoặc mobile header) → mở `AccountSettingsDialog` (NEW — avatar + password trong 1 modal cho mọi role, vì admin/staff không có `/profile` page)
   Commits: `957783f`, `08a50f9`.
47. **Phase 18.8 — RLS bypass via Prisma trong getCurrentUser**: ✅ BUG: HV upload avatar → hero profile đúng nhưng sidebar/header vẫn show initial. ROOT CAUSE: table `users` có RLS enabled (`relrowsecurity=true`) nhưng **0 policy** → Postgres deny mọi query cho non-superuser. `getCurrentUser` dùng Supabase JS với user JWT → bị chặn → fallback JWT metadata (không có avatarUrl) → null. Prisma không ảnh hưởng vì dùng admin DB connection. Fix: đổi `getCurrentUser` từ Supabase JS query sang Prisma. Vừa consistent codebase vừa bypass RLS. Commit: `df53ba4`. **BÀI HỌC**: trên Supabase tables có RLS bật + 0 policy = deny all → server-side queries phải dùng admin connection (Prisma trực tiếp hoặc service_role client).
48. **Phase 18.9 — Schedule week view 5 cải tiến**: ✅ Owner báo:
   - "Hôm nay" lúc có lúc không → pill nav xô lệch
   - Avatar HV không hiện trên session card
   - Giờ "5:30/18:00" lặp với header row
   - Tên HV wrap nhiều dòng + checkbox thừa
   - Selection action bar dòng riêng xô lệch grid
   Fix:
   - Tách "Hôm nay" khỏi pill, luôn render + disabled khi current
   - Query `user.avatarUrl`, render img 24px row (fallback 2-letter)
   - Bỏ slotLabel, thay chevron → chip border "Chi tiết →"
   - Row toàn bộ là button (no checkbox), click toggle, Shift+click range, ring-2 accent selected, tên truncate
   - NEW `ScheduleSelectionContext.tsx` + `ScheduleHeaderControls.tsx`: Context share state. Header toggle nav buttons / action bar cùng row position
   - DELETE `SelectionActionBar.tsx`
   Commit: `6b8a767`.
49. **Phase 18.10 + 18.13 — Shop e-commerce UX overhaul**: ✅ CTA "Đặt hàng" dark text trên dark cart bar khó đọc + inline +/- bị FAB che + không match Shopee/Tiki:
   - **Card grid**: bỏ inline stepper. LUÔN 1 button "+ Thêm vào giỏ" (bg-ink) hoặc "Đã thêm (N) · Thêm 1" (bg-success/15). Badge qty `N` góc trên trái ảnh (bg-accent ring-paper shadow-cta)
   - **NEW `CartDrawer.tsx`** bottom sheet (Dialog @base-ui/react translate-y-full anim): list items thumbnail 56px + tên + giá + stepper -/+/Trash, note input, button "Đặt hàng" bg-accent shadow-cta h-12 bold
   - **Cart bar bottom strip**: tap → mở drawer. NEW helper `removeAllFromCart(id)`
   - **Vị trí (Phase 18.13)**: ngang hàng FAB+ thay `bottom-0` (overlap bottom-nav). `bottom-[5.25rem]` (= 64+20) + `pr-[5.25rem]` (= 20+52+12 chừa FAB). FloatingActions bỏ MutationObserver cart-detect-push
   - **Shop API**: `soldCount` per product (groupBy orderItem WHERE order.status IN ('paid','fulfilled') _sum.quantity). Display `· Đã bán N` cạnh type chip
   Commits: `c83beaa`, `7721fa2`, `9500015`.
50. **Phase 18.11 — Avatar editor: "Sửa" popover + crop dialog**: ✅ Thay 2 button "Đổi ảnh" + "Xoá" bằng 1 button "Sửa" → popover 2 option Cập nhật/Xoá. Cập nhật mở crop dialog (Instagram/Facebook style):
   - Install `react-easy-crop@^5.5.7` (~10KB gzip, battle-tested)
   - NEW `src/lib/image-crop.ts`: `getCroppedBlob(src, area)` → square JPEG 90% max 512px qua canvas
   - NEW `AvatarCropDialog.tsx`: Cropper `aspect=1 cropShape="round" showGrid=false objectFit="cover"`. ResizeObserver đo container → `cropSize = containerWidth - 8` → vòng tròn nearly full vuông. Zoom slider 1.0-3.0 + 2 button. Outside circle = darkened tự render
   - REWRITE `AvatarUploader.tsx`: vertical (circle + button "✏️ Sửa"). Popover: "Cập nhật" (Upload icon) → file picker → crop; "Xoá ảnh" (Trash danger) LUÔN render — disabled khi không có avatar
   Commits: `70cffcb`, `dcc6333`.
51. **Phase 18.12 — RequestChangeForm validation upgrade**: ✅ Per-field smart inputs cho `/student/profile/request-change`:
   - `dob` → `<DateInput>` (Phase 18 masked) + validate ISO + age 5-100
   - `phone` → `inputMode="numeric"` + strip whitespace + regex VN
   - `idCardNumber` → filter `/\D/g` + maxLength 12 + validate 9/12 số
   - `ward + province` → group dùng `<VnAddressSelect>` khi user tick. District giữ text input (legacy — đơn vị hành chính mới bỏ cấp huyện)
   Submit handler validate type-specific per field. Commit: `74bbf9b`.
52. **Phase 18.X — Misc fixes during session**:
   - **TZ timezone fix**: NEW `src/instrumentation.ts` set `process.env.TZ = 'Asia/Ho_Chi_Minh'` cho Node.js runtime. **Vercel cấm TZ env var qua dashboard** ("reserved name"). HV Phạm Minh Anh đặt đơn 16:59 chiều VN nhưng dashboard hiện 09:59 UTC → fix → đúng VN. Commit: `33d9736`.
   - **Sidebar mobile-only**: bỏ ThemeSwitcher + "Cá nhân" group + user info bottom CHỈ mobile (`lg:hidden`/`hidden lg:block`). Desktop giữ nguyên. Nút "Đăng xuất" rõ ràng mobile. Commit: `81d6823`.
   - **Home button cố định sidebar**: link top-level "Trang chủ" trên đầu nav (mọi role) → tránh chôn trong "Tổng quan" group. Commit: `e7dc7bf`.
   - **Schedule banner "Vé bơi" → shop**: thay "Liên hệ Zalo" bằng CTA "🛍️ Mua vé bơi" → `/student/shop`. Commit: `7ab141d`.
   - **AvatarFOUC fix**: Phase 18.7 owner gửi screenshot avatar không sync mobile/desktop sidebar → trace ra RLS issue (Phase 18.8). Tốn 2 round-trip để xác định gốc rễ.

53. **Phase 19 — Chat real-time MVP (1-staff-1-student rigid)**: ✅ Initial chat schema `Conversation { staffUserId, studentId, @@unique }` + ChatMessage. Polling 3s. FAB thứ 3 (`MessagesFab`). Pages student/admin/staff messages. Bị thay bởi Phase 20.

54. **Phase 20 — Chat redesign any-to-any + groups**: ✅ Schema mới participants-based:
    - `Conversation { name?, isGroup, createdBy, lastMessageAt, lastMessagePreview, isResolved }` — bỏ FK Staff/Student
    - `ConversationParticipant` — M2M junction (`conversationId, userId, lastReadAt, leftAt, role, isMuted`)
    - `ChatMessage` giữ nguyên (giữ `senderRole` denormalized cho audit)
    - **Bất kỳ user nào nhắn được bất kỳ user nào** (open access)
    - Group ≤ 20 người, **name bắt buộc**
    - Rate limit 5 msg/10s cho student qua `src/lib/rate-limit.ts` (sliding window, admin/staff exempt, no Redis)
    - DM idempotency: tạo DM lần 2 cùng cặp → trả existing convId
    - `UserPicker.tsx` multi-select chips (replace StudentPicker)
    - `/api/users/search` open access endpoint
    - Cleanup script `prisma/cleanup-chat-phase20.ts` chạy 1 lần xóa data legacy
    - E2E verified: DM/group create, rate limit 429, idempotency, group name required. Commit: `8cbc96d`.

55. **Phase 21 — Schedule cột rộng + Vietnamese name shortening**: ✅ `min-w-[1050px]` → `min-w-[1450px]` (cột từ 143→200px). NEW `src/lib/format-name.ts` với `shortenVietnameseName(fullName, maxLength=20)` — rule: viết tắt họ (từ đầu) còn 2 chữ, giữ nguyên tên đệm + tên chính. `Nguyễn Ngọc Hoàng Việt` → `Ng Ngọc Hoàng Việt`. Hỗ trợ progressive abbreviation cho tên 5+ từ. Wrap `reg.student.fullName` qua function. `title` attribute giữ tên đầy đủ cho hover. Commit: `e2ea5c6`.

56. **Phase 22 — Chat UX polish (6 mobile fixes)**: ✅
    - **#1 Bỏ notification broadcast cho chat** — chat có badge unread riêng, tránh chồng noise
    - **#2 Bỏ status text "Đã gửi"/"Đã xem"** — chỉ giữ tick icons per-message
    - **#3 Time alignment opposite edge**: incoming → time sát mép PHẢI, outgoing → time + tick sát mép TRÁI (bubble bên còn lại)
    - **#4 Dedup time same-minute** (bỏ ở Phase 24 sau)
    - **#5 Background scroll fix**: `scrollIntoView({block:nearest})` thay bằng `el.scrollTop = el.scrollHeight` (không propagate ra ancestor)
    - **#6 Popup overlap header**: `h-[min(480px,calc(100vh-15rem))]` + `collisionPadding={60}` cho Popover.Positioner. Commit: `ff04b89`.
    - **Phase 22.1 follow-up**: defensive `try/catch + logError` cho 3 messages pages. Empty state text mới "Bấm Mới để bắt đầu nhắn tin với bất cứ ai, hoặc tạo nhóm để cùng 'rủ rê' bơi lội". Commit: `20fd57c`.

57. **Phase 23 — Chat thống nhất giữa roles + mobile responsive**: ✅
    - **Bỏ asymmetric tick**: trước đây `showDoubleTick = currentUserRole === 'student'` (chỉ HV thấy admin đã đọc). Owner muốn thống nhất → cả 2 bên thấy CheckCheck khi đối phương đọc.
    - **Outgoing bubble luôn sát lề phải**: bug khi `showMeta=false` (dedup hide time) → bubble không có `ml-auto` → nằm sai. Fix: thêm `ml-auto` vào bubble wrapper.
    - **MessagesClient mobile responsive**: full page bị squash do split-pane (w-72=288px chiếm 76% mobile viewport). Fix:
      - Left pane: `w-full sm:w-72` + `hidden sm:flex` khi `activeId`
      - Right pane: `hidden sm:flex` khi `!activeId`
      - Back button `ArrowLeft` (sm:hidden) trong chat header → setActiveId(null)
      - Bỏ auto-select first conv → user click chủ động
    - **UserPicker opacity**: `glass-card` (55%) → `glass-panel` (94%) ngang notification popover. Commits: `e664c76`, `2283b55`.
    - **Phase 23.1 textarea padding**: `.lqg-input` base không có horizontal padding. Thêm `px-3` cho textarea (text không sát viền cam). Commit: `128a5d4`.
    - **Phase 23.2 duplicate message race fix**: 2 nguyên nhân — (1) polling fetch trùng với POST response → dedupe by id Set; (2) double Enter spam → `useRef sendingRef` thay state stale check. Commit: `eddc411`.

58. **Phase 24 — Hiển thị time MỌI tin (bỏ dedup)**: ✅ Trade-off: lặp "11:23 · 11:23 · 11:23" nhưng UX rõ ràng hơn — read receipt per-message hiển thị đúng (trước: chỉ tin cuối chuỗi có tick → 2 tin đầu không biết trạng thái). Khớp WhatsApp/Telegram/Zalo convention. Bỏ logic `nextMsg/sameMinAsNext/showMeta`. Net: -28 dòng code. Time + tick share row với bubble (opposite edge) nên không tốn vertical space. Commit: `567966a`.

59. **Phase 24.1 — AvatarCropDialog đen xì mobile**: ✅ Root cause: `cropSize` init null + conditional `{cropSize && <Cropper/>}` — trên Safari iOS, `ResizeObserver` callback fire chậm/skip lần đầu → Cropper không mount → user thấy `bg-ink` đen. Fix: init `cropSize = {280, 280}` default + initial sync measure `el.clientWidth` trước RO + bỏ conditional. Cropper luôn mount với cropSize hợp lệ. Commit: `5f0217b`.

60. **Phase 25 — Avatar zoom out tới mép ảnh**: ✅ Trước: `minZoom=1` (default react-easy-crop) + `objectFit=cover` → tại zoom thấp nhất, ảnh cover crop hình vuông → chiều dài bị cắt, không thể zoom out tiếp. Fix: dynamic `minZoom` qua `onMediaLoaded`:
    - Formula: `minZoom = min(naturalW, naturalH) / max(naturalW, naturalH)`
    - Ảnh 4:3 → 0.75, 16:9 → 0.5625, vuông → 1
    - Tại minZoom đó, chiều dài chạm mép crop
    - Auto-reset `zoom = minZoom` khi ảnh load → user thấy full ảnh ngay khi mở
    - Slider `min={minZoom}` + ZoomOut button bound theo minZoom. Commit: `83420ee`.

61. **Phase 26 — Avatar simple upload (bỏ crop dialog)**: ✅ Sau nhiều round-trip fix crop dialog cho ảnh dài/portrait, owner: "tại sao không upload thẳng ảnh nguyên?". Rewrite: AvatarCropDialog REMOVED. AvatarUploader upload file gốc thẳng → CSS clip tròn qua `rounded-pill overflow-hidden + object-cover`. Discord/Telegram/Zalo pattern — đơn giản nhất, không bug aspect. Bỏ ~250 dòng code crop. Commits: `74240cf` (rebuild), later `7f...` (final).

62. **Phase 26.1 — Crop dialog back với aspect THẬT (true ratio)**: ✅ Owner muốn quay lại crop có UI nhưng hiển thị ảnh ở tỷ lệ thật (không ép vuông). Container `aspectRatio` dynamic theo `naturalW/naturalH`. cropSize = 78% smaller dim. minZoom=0.4 + restrictPosition=false (full pan). E2E test 5 aspect (16:9, 2:3, 1:1, 4:1, 1:3) đều hiển thị đúng tỷ lệ. Commit: `74240cf`.

63. **Phase 27 — System audit + Production Hardening**: ✅ Spawn 3 parallel agent rà 6 dimension (consistency, mobile, flow/a11y, performance, security, cost). Tìm 80+ issue. Fix theo 3 tier:
    - **P0 Security**: Sepay webhook Zod validation, payment race condition (compare-and-set updateMany), order/enrollment concurrent confirm rollback. Commit: `0c717c7`.
    - **P1 Performance**: Settings cache 60s in-memory (3 DB query → 0), chat unread N+1 batch (200 query → 2), users.search restrict phone match cho non-staff, logout try/catch. Commit: `1989eda`.
    - **P2 Indexes + cron**: ClassSession @@index([date]), SessionRegistration @@index([sessionId, status]), birthday cron LIMIT 100, reconciliation cron batch query. Commit: `e659516`.
    - Doc CLAUDE.md §17.1: Responsively App workflow cho multi-device test.

64. **Phase 27.1 — Theme contrast + send button + grid responsive + safe-area**: ✅ Nhiều UI fix dồn 1 commit:
    - "Chưa đăng ký" + "18:00" hero card chữ đen trên nền tối (light mode) → thêm explicit `text-paper` override `.lqg-headline`. Commit: `082e7ae` + root cause fix `32c24d2` (move `.lqg-headline` + `.lqg-numeric-sans` vào `@layer components` để Tailwind utilities override được).
    - Chat send button h-10 w-10 ngang bằng textarea (cả ChatThread + MessagesClient). Commit: `534d0d3`.
    - Grid-cols mobile breakpoint 24 fix / 18 file (admin + student + staff forms). Commit: `e3c495b`.
    - Safe-area + dialog max-height (CartDrawer, staff assess, ChangePasswordDialog). Commit: `bf9bbe6`.
    - Heading responsive scale (`text-4xl` → `text-2xl sm:text-4xl` 10 files) + cleanup orphan + gitignore `.claude/`. Commit: `990a3db`.
    - StatCard tone='dark' explicit text-paper override + dashboard "1/7 HV" bump text-sm. Commit: `ddd3286`.

65. **Phase 27.2 — FAB popover position stable cross-viewport**: ✅ Owner phát hiện MessagesFab popover bị auto-flip side trên iPhone 12 Pro. Root cause `collisionPadding=60` + popup width 350-380px + viewport hẹp → base-ui auto-flip. Fix 3 FAB đồng bộ: `collisionPadding=8` + `w-[min(380px,calc(100vw-7rem))]`. Verified e2e 4 viewport. Commit: `f26001b`. Bài học `§12.9` CLAUDE.md.

66. **Phase 27.3 — Wire UI cho điểm danh + đánh giá**: ✅ Code `/staff/attendance/[sessionId]` + `/staff/assess/[studentId]` đã có từ Phase 3-5 nhưng KHÔNG có button UI để bấm vào → owner phải gõ URL tay. Add: button "Điểm danh" trên `/admin/schedule/sessions/[id]` + ⭐ button per HV row Approved section + page mới `/staff/attendance` (index list buổi hôm nay). settings.ts catalog: attendance item mở rộng cho cả admin + staff. Commit: `1a75d5d`.

67. **Phase 27.4 — Transaction CRUD (carryover + manual + reverse)**: ✅ Owner gặp 2 vấn đề: (1) HV cũ có vé từ trước hệ thống — cần PoolTicket KHÔNG tạo Payment record. (2) Owner cần CRUD lịch sử giao dịch (manual cash, compensation, fix lỗi). Build 1-form admin-only `/admin/students/[id]/transactions`:
    - Schema: Payment.excludeFromRevenue + PoolTicket.isCarryover
    - API POST `/api/admin/transactions` (tạo Payment ± PoolTicket atomic)
    - API POST `/api/admin/transactions/[paymentId]/reverse` (đảo bút toán)
    - UI form 2 toggle (Payment + Ticket) + summary preview live
    - Anti-fraud: strict admin role, KHÔNG xoá/sửa Payment, chỉ tạo mới hoặc reverse
    - Revenue filter `excludeFromRevenue: false` ở 3 chỗ (reports, admin/finance, admin/dashboard)
    - E2E verified 4 use case + auth check. Commit: `1198869`.

68. **Phase 28 — Centralized Padding System (Design Tokens)**: ✅ Owner báo "sát lề phải iPhone 12 Pro" → AI patch `pr-[5rem]` → "né khỏi FAB" → revert. Owner hỏi: "tại sao lệch? Phải có kỹ thuật chứ?" → AI mới propose **Design Tokens architecture**.

    **Pattern**: CSS Custom Property `--page-px` ở `:root` + apply ở `.pola-main { padding-inline: var(--page-px) }` 1 lần. Toàn app inherit. Sửa 1 dòng → 80+ pages đồng bộ. Mọi page chỉ cần `mx-auto max-w-Xxl` (centering), KHÔNG cần `px-X` riêng. Hero blocks escape padding qua `margin-inline: calc(-1 * var(--page-px))`. FAB frosted backdrop `bg-X/85 backdrop-blur-md` cho content dưới mờ ảo thấy.

    **Migration**: 151 replacements / 87 files. Token values: mobile 20px, tablet 32px, desktop 40px.

    **Bài học `§12.10`** (CLAUDE.md): trước khi PATCH bug, BẮT BUỘC analyze root cause + đối chiếu chuẩn ngành (Notion/Lark/Linear/Stripe dùng Design Tokens) + propose 2 hướng (patch vs architectural) cho owner chọn. KHÔNG default về patch. Commit: `e092f90` + `d036a5e` (rule doc).

### 🟢 DEPLOY ĐÃ HOÀN TẤT (2026-05-15)

- ✅ **GitHub repo**: `polaproject/poolane@master` (4 commit Phase 13.1-14)
- ✅ **Supabase DB Singapore** (`frzqhredvgdmlwimctpy`): 44 tables + 3 courses + 1 admin (Nguyễn Ngọc Hoàng Việt — `0355553205`) + 8 FAQs
- ✅ **Storage bucket** `poolane-public` + 4 policies (SELECT public / INSERT/UPDATE/DELETE authenticated)
- ✅ **Vercel Pro team `pola-project`** ($20/mo) + project `poolane` + 19 env vars
- ✅ **Production deploy** với region `sin1` (Singapore) — Fluid Compute
- ✅ **Domain `poolane.vn` + `www.poolane.vn`** — Matbao DNS A record `216.150.1.1` + CNAME `f03179357ed4c972.vercel-dns-016.com.`
- ✅ **SSL Let's Encrypt** apex + www, auto-renew
- ✅ **Health check 4/4 pass**: database, auth, storage, email
- ✅ **Security headers**: X-Content-Type-Options, X-Frame-Options SAMEORIGIN, Referrer-Policy, Permissions-Policy, HSTS

### Còn lại sau deploy (owner manual)
- **Sepay webhook save**: Owner chuẩn bị 4-tab config (Cơ bản/Tài khoản/Bảo mật/Cảnh báo) — DNS resolve được rồi, save webhook URL `https://poolane.vn/api/webhooks/sepay` + token `SEPAY_API_KEY` (Apikey auth)
- **Smoke test 5 mục**: login 3 role, public landing, register HV thật, push notification subscribe, verify 4 cron jobs trên Vercel dashboard
- **Phase 6 — Auth pages polish** (login/register/forgot-password redesign split-layout brand artwork — defer)
- **Combo 3 khoá pricing** — chốt giá + implement

### Việc đã hoàn thành lớn trong session redesign

- ✅ **Phase 1 — Design system foundation**: 2-theme A+B (navy/gold + lavender/peach), tokens, 5 primitives mới (Chip/PageHeader/GlassPanel/StatCard/FloatingCard), glass utilities, ambient-bg, Cormorant italic display
- ✅ **Phase 3A — Public**: redesign `/` landing + `/courses` với `(public)/` route group, ambient-bg layout, soft glass hero
- ✅ **Phase 3B — Public**: redesign `/blog` list + detail (drop cap), `/faq` (accordion glass), `/privacy` (editorial sections)
- ✅ **Phase 4 — Student**: redesign 24 trang (dashboard, my-schedule, progress, payments, shop, profile + forms, exercises, videos, photos, quiz, events, challenges, goals, log, self-assessment, achievement card, pay pages)
- ✅ **Phase 5 — Admin + Staff**: redesign 38 trang (admin: dashboard/students/schedule/finance/refunds/shop/vouchers/blog/quizzes/events/exercises/photos/pulse/broadcast/ai/heatmap/teacher-metrics/utility; staff: dashboard/registrations/students/attendance/assess/practice/lesson-plan/videos/stats)
- ✅ **Bug fixes trong session**:
  - Supabase Auth E.164 phone format (registration failed) → bỏ phone khỏi `auth.admin.createUser`, giữ phone trong Prisma User
  - `logError()` không pass error vào `log.error/critical` → fixed
  - Turbopack/Lightning CSS reject self-ref `@theme inline` → tách shadow utilities sang `@layer utilities`

**Tổng commit redesign:** 16 commits (`feat(design-system)` → `feat(public)` → `feat(student)` → `feat(admin)` → `feat(staff)` → `fix(auth)`).

### Việc đã loại bỏ / thay thế

- ~~MoMo online payment~~ → giữ code làm backup, **VietQR + Sepay là default** (0đ phí giao dịch)
- ~~Theme D (Night Pool)~~ → bỏ trong Phase 1, giản lược system còn 2 theme A+B

---

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

**Domain Poolane:** `poolane.vn` (đã mua — domain riêng cho hệ thống quản lý lớp bơi)
**Domain Pola Project:** `polaproject.com` (mua qua Matbao — dùng cho parent brand sau khi có đủ 3 sub-projects)

```
poolane.vn       →  Toàn bộ hệ thống Poolane
                    (landing + quản lý lớp bơi)

polaproject.com  →  Trang parent brand (khi Polang/Polata ra mắt)
```

Khi Polang / Polata ra mắt → dùng subdomain hoặc mua thêm domain riêng.

**Email gửi đi:** `support@poolane.vn` (cần setup Google Workspace hoặc Resend domain verify)

### Brand Essence

**Triết lý:** *"Dạy bơi không chỉ để bơi"* — kết nối thân với tâm, xây dựng cộng đồng những người trưởng thành cùng sở thích, cùng mục tiêu giải toả áp lực cuộc sống.

**Poolane là nơi:** Chân thật, được quan tâm, ấm áp — nơi có người thầy đáng tin, người bạn thật sự, không khí nhẹ nhàng mở đầu cho một buổi tối bình yên.

**Không muốn:** Lời lẽ công nghiệp đại trà, không khí học tập căng thẳng, chỉ dạy-dạy-dạy mà không có kết nối con người.

### Visual Identity

**Trạng thái:** Design system foundation đã build xong (Phase 1), ~70 trang đã redesign theo. Logo chính thức chưa có (vẫn dùng SVG ngôi sao Polaris placeholder).

**Palette tokens** (định nghĩa trong `src/config/theme.config.ts` + `src/app/globals.css`):

```
Theme A — Đêm & Sao (mặc định)
  ink         #0F1B33   text + dark surface
  ink-soft    #1C2B4A   header / dark cards alt
  paper       #FBF7F0   background chính (cream ấm)
  paper-tint  #F2EAD9   surface subtle
  accent      #C8A84B   gold — CTA + highlight (Polaris)
  accent-soft #E8D9A8   hover, badge bg
  mist        #7FA8B5   accent phụ (info, link)
  success #5C8A6E  ·  warn #D89B3A  ·  danger #B5483C

Theme B — Bình Yên (lavender pastel)
  ink         #2D2A4A   text purple-leaning
  paper       #F4EFFB   lavender mist bg
  accent      #E89B7A   peach
  mist        #9B91D6   lavender accent phụ
```

Tất cả 2 theme dùng **cùng tên token** (`ink`, `paper`, `accent`, `mist`, ...) → switch theme = chỉ đổi CSS variables, không phải sửa code. Theme lưu trong `localStorage` (`poolane-theme`), apply qua class `theme-a`/`theme-b` trên `<html>`.

**Typography (Phase 13 discipline — italic dùng tiết chế):**
- **Cormorant Garamond italic** — CHỈ 3 trường hợp:
  1. **Quote / citation** (`<blockquote>`) — trích dẫn, philosophy, testimonial
  2. **Blog body** — nội dung dài đọc lâu
  3. **Greeting message** ("Chào buổi sáng/tối, [Tên]") — accent moment ở hero dashboard
- **Plus Jakarta Sans (400-700)** — mọi UI khác:
  - **Page headings** (h1/h2/h3) → `.lqg-headline` (sans bold 600, letter-spacing tight)
  - **Stats / numbers / currency** → `.lqg-numeric-sans` (sans bold 700 tabular-nums)
  - Body text, buttons, labels, navigation, empty states, form fields
- **Utility classes**:
  - `.lqg-headline` — page/section/card titles
  - `.lqg-numeric-sans` (+ size variants xs..3xl) — số liệu data
  - `.lqg-display` — italic serif (chỉ dùng cho 3 trường hợp trên)
  - `.lqg-numeric` — italic serif numbers (chỉ dùng cho accent drop-cap)
  - `.lqg-eyebrow` — text xs tracking widest uppercase

**Design language (Phase 1):**
- **Glass panels** — `.glass-panel` + `.glass-pill` (frosted bg + backdrop-blur + soft ring)
- **Ambient background** — `.ambient-bg` theme-aware (dark navy blobs cho A, lavender mesh cho B)
- **Cards** — `rounded-card` (16) / `rounded-card-lg` (24) / `rounded-card-xl` (28), `shadow-soft` / `shadow-glass`
- **Eyebrow** — text xs tracking widest uppercase opacity-60 (đặt trên heading)
- **Liquid Glass Phase 12** — `.glass-card`, `.glass-button`, `.glass-input` + specular streak animation
- **Soft motion** — transitions 150–250ms ease-out, hover scale max 1.02

**Primitive components** (`src/components/ui/`):
- `Chip.tsx` (6 variants + active state), `PageHeader.tsx`, `GlassPanel.tsx`, `StatCard.tsx`, `FloatingCard.tsx`
- `EmptyState.tsx`, `ThemeSwitcher.tsx` (A+B only)
- `Button.tsx`, `Card.tsx`, `Badge.tsx`, `Input.tsx` (shadcn-based, auto-theme qua override shadcn vars trong `.theme-a`/`.theme-b`)

**Logo direction (chưa có file chính thức):** Icon + wordmark, ngôi sao Polaris phản chiếu trên mặt nước. Hiện dùng SVG placeholder trong `theme.config.ts`.

**Tham chiếu cảm giác:** Soft glassmorphism / visionOS-inspired (panel kính nổi trên nền ambient, layering, italic serif). Reference Callour Studio email + Wix marketing.

### Design Discipline (Phase 16 — "Quiet Luxury")

Apple Liquid Glass framework giữ ở mức **structure** (frosted bg + blur + border + hover lift), **bỏ hoàn toàn animation loop**:

❌ **KHÔNG dùng:**
- Specular streak (vệt sáng chạy qua glass element mỗi N giây)
- Glow halo pulse quanh logo/element
- Decoration blur blob trong hero corner (`<div className="absolute ... blur-3xl">`)
- Loading.tsx skeleton (Next.js convention) — instant navigate ưu tiên hơn flash skeleton

✅ **VẪN dùng:**
- Frosted bg + backdrop-blur (chính là LQG)
- Border + ring (edge highlight)
- Hover lift transition (200-280ms spring)
- Focus ring spring (a11y keyboard nav)
- StarField (chỉ landing — brand element Polaris)
- AmbientMesh (background subtle theme-aware, drift 24s)
- Skeleton inline (rare, khi page load partial component)

**Triết lý: "Premium quiet"** — UI không tranh giành sự chú ý với content. User focus vào học viên/bài học, không vào animation. Apple iOS 26 ngôn ngữ design (structure) — nhưng zero animation loop để phù hợp app type "focus mode" (không entertainment).

**Đối tượng:** Người lớn 16–40 tuổi → **chuyên nghiệp nhưng ấm áp**, không đại trà, không lạnh lùng.

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
description, is_active,
display_order (Phase 17.3 — admin sắp xếp vị trí hiển thị, step 10, ASC = đầu shop)
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

### 6.12. Settings & Dashboard Builder (Phase 17.3-17.4)

**`system_settings`** — Admin-configurable dynamic config (key/value JSON pattern)
```
key (string, PK), value (Json), updated_at, updated_by
```
Keys hiện có (TypeScript `SettingsMap` trong `src/lib/settings.ts`):
- `quick_add.{admin,staff,student}` — array of QuickAddItemKey, max 5
- `notif_filter.types` — array of NotificationTypeKey (empty = show all)
- `sidebar_labels.{admin,staff,student}` — Record<groupKey, customLabel>
- `sidebar_order.{admin,staff,student}` — array string (custom reorder)
- `format.amount_style` — 'vn_full'|'vn_compact'|'no_symbol'|'us'
- `format.percent_decimals` — int 0-4
- `format.thousand_separator` — '.'|','

API: `GET /api/admin/settings` + `PATCH` (zod validate per-key). Public read endpoint `GET /api/settings` cho FAB/sidebar client consumption.

**`dashboards`** — Report dashboard tự build (Phase 17 — BI tool)
```
id, owner_id (FK user), name, description (nullable),
is_home (boolean — set 1 dashboard làm trang chủ thay /admin/dashboard),
layout (Json — legacy, unused. Single source of truth = widget.position),
slicers (Json — global filters cross-widget, chưa wire UI),
time_range (Json — { preset, from, to, compare, field }),
created_at, updated_at
```

**`dashboard_widgets`** (Prisma model name: `DashboardWidget`, accessor `prisma.dashboardWidget`)
```
id, dashboard_id (FK), title, type (enum: pivot/chart/heatmap/kpi),
config (Json — WidgetConfig: rootTable, joins, rows, columns, values, filters, sort, visualization),
position (Json — { x, y, w, h } cho react-grid-layout v1.5),
created_at, updated_at
```
Config types ở `src/lib/dashboard/types.ts`. SQL builder ở `src/lib/dashboard/query-builder.ts` — schema-validated whitelist + parameterized query + LIMIT 10000.

### 6.13. Indexes Bắt Buộc

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

### 12.8. Visual Debugging Workflow (Phase 16 lesson)

Khi user phàn nàn về visual ("hình lạ", "vệt sáng", "vương vãi", "elip rất to"):

1. **KHÔNG assume root cause** — cùng cảm giác có thể từ 3-4 CSS pattern khác nhau (specular streak ≠ halo glow ≠ decoration blob ≠ ambient mesh)
2. **Grep MULTIPLE patterns ngay lập tức** — specular, motion-glow, blur-3xl, rounded-full + non-square aspect, shimmer, animation, decoration, lqg-mesh, hero-block, gradient
3. **Ask clarifying trước khi mass change**: *"Owner đang chỉ vào element X (logo halo) hay Y (background blob) hay Z (streak animation)?"*
4. **Show owner danh sách affected files trước khi fix** nếu >5 file
5. **Test trên nhiều trang khác nhau**, không chỉ trang owner screenshot

**Bài học từ Phase 16:** owner phàn nàn "specular vương vãi" → AI fix specular nhưng MISS 2 element khác (logo halo `motion-glow rounded-full` + decoration blobs `<div blur-3xl>` 68 chỗ). Tốn 2 round-trip mới sạch hết. Nếu apply 5 steps trên → 1 round-trip done.

### 12.9. Responsive Cross-Device Verification (RULE BẮT BUỘC)

**Mỗi tính năng hoặc cập nhật UI mới — AI BẮT BUỘC verify trên ≥ 4 viewport trước khi commit:**

| Viewport | Lý do |
|---|---|
| **Mobile nhỏ** (iPhone SE 375×667 hoặc 12 Pro 390×844) | Tightest layout — popover, dialog, sidebar dễ collision |
| **Mobile lớn** (iPhone 14 Pro Max 430×932) | Edge case khác mobile nhỏ |
| **Tablet** (iPad 768×1024) | Breakpoint `md` của Tailwind — UX thường khác mobile + desktop |
| **Desktop** (≥ 1280×800) | Baseline layout owner build |

**Pattern cần đặc biệt verify:**
- **Popover / dropdown / tooltip** — base-ui `Popover.Positioner` auto-flip `data-side` khi collision → đo `data-side` attr ở mỗi viewport. Setup `collisionPadding` thấp (vd 8) + width formula adaptive (vd `min(380px, 100vw-7rem)`) để side STABLE.
- **Dialog / modal** — width responsive (vd `w-[min(480px, calc(100vw-2rem))]`), max-height `calc(100vh-3rem)` chứ đừng cứng pixel.
- **Sidebar / nav drawer** — overlay vs push-content; mobile cần backdrop, desktop fixed.
- **Form layout** — grid `md:grid-cols-2` collapse về 1 column trên mobile.
- **Table** — overflow-x-auto + min-width container, hoặc card view trên mobile.
- **FAB / sticky button** — chừa `env(safe-area-inset-bottom)` cho iOS notch + bottom-nav clearance trên mobile.

**Workflow verify (qua Claude Preview MCP hoặc Responsively App):**
1. Start dev server, login demo account
2. Navigate đến page có thay đổi
3. Loop 4 viewport: resize → trigger UI mới → đo bounding rect + data attributes → screenshot
4. Báo cáo: table 4 row × N column (data-side, popup width, gap, etc.)
5. Nếu inconsistent → fix, lặp lại

**Bài học từ Phase 25:** owner dùng Responsively App phát hiện MessagesFab popover ở iPhone 12 Pro KHÔNG nằm bên trái FAB (auto-flip do `collisionPadding=60` + viewport hẹp). AI không verify cross-device khi build feature → blind spot. Fix: lower collisionPadding + adaptive width formula → 3 FAB (Notification, Messages, QuickAdd) consistent `data-side=left` trên 4 viewport.

**Trade-off:** Verify 4 viewport tốn ~3-5 phút mỗi tính năng. Nhưng catch issue sớm rẻ hơn 100x so với owner phát hiện sau khi merge.

### 12.10. Root Cause / Architecture First (RULE BẮT BUỘC — Phase 28 lesson)

Trước khi PATCH bug, BẮT BUỘC làm 3 bước:

1. **Root cause analysis** — hỏi: "đây là 1-off bug hay symptom của pattern lớn hơn?"
   - Grep tìm trường hợp tương tự trong codebase
   - Nếu xuất hiện ≥3 chỗ → là pattern, không phải one-off
2. **Đối chiếu chuẩn ngành** — pattern này được giải quyết thế nào ở:
   - Tailwind CSS, MDN best practices
   - Notion, Lark, Linear, Stripe (các product team uy tín)
   - Nếu app đang đi NGƯỢC chuẩn → flag với owner trước khi tiếp tục
3. **Propose 2 hướng** trước khi sửa:
   - **A. Localized patch** (nhanh, không refactor) — effort + risk
   - **B. Architectural fix** (refactor pattern) — effort + benefit dài hạn

Owner chọn. KHÔNG default về patch khi pattern thực sự sai từ kiến trúc.

**Bài học từ Phase 28 — "sát lề phải" iPhone 12 Pro:**

Owner báo: "sát lề phải" → AI patch `pr-[5rem]` (chừa FAB).
Owner báo lại: "né khỏi FAB" → AI revert.
Owner hỏi: "tại sao lại lệch? Phải có kỹ thuật chứ?" → AI mới đề xuất Design Tokens architecture (CSS Custom Property `--page-px` + apply ở `.pola-main` 1 lần).

3 round-trip + 2 commit revert. Nếu apply 3 bước trên → 1 round-trip done.

**Anti-patterns cần TRÁNH:**

- ❌ "Codebase pattern inheritance bias" — thấy 80 page dùng `px-4 sm:px-8` → mặc định đó là đúng. Phải question pattern.
- ❌ "Minimal change mặc định" — fix dòng được hỏi, không zoom out. Phải hỏi "có pattern lớn hơn không?"
- ❌ "Patch chuỗi" — sửa A xong B vỡ, sửa B xong C vỡ → dấu hiệu pattern sai từ gốc. Stop, propose refactor.

**Pattern phổ biến cần Token hoá (nếu phát hiện drift):**

| Drift | Token chuẩn ngành |
|---|---|
| Padding ngang page | `--page-px` |
| Padding dọc section | `--section-py` |
| Max-width content | `--content-max-w` |
| Card padding | `--card-px`, `--card-py` |
| Card border radius | `--card-radius` |
| Gap giữa sections | `--section-gap` |
| Font size scale | `--text-xs`, `--text-sm`, ... (Tailwind đã có) |
| Color palette | `--ink`, `--paper`, `--accent` (Poolane đã có) |

Nếu thấy hardcode `px-4`, `gap-3`, `rounded-card-lg` lặp lại ở 10+ chỗ với value khác nhau → consider tokenize.

**Khi owner prompt rút gọn ("fix bug X"), AI vẫn BẮT BUỘC apply 3 bước trên trong âm thầm + flag pattern trước khi sửa.**

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

### 14.5. Visual / CSS Bug Debugging Workflow (Phase 12 lesson)

**RULE 1: Visual / CSS bug → inspect compiled CSS bundle FIRST, KHÔNG viết code fix trước.**

Phase 12 sidebar fixed-positioning bug took **5 fix attempts** vì AI patch theo giả thuyết (flex stretch, inset conflict, ml-64 overflow, Tailwind purge, sticky cascade) — tất cả đều SAI. Root cause: `.pola-nav { position: relative }` (Phase 10 — host pseudo-element specular) silently override `.pola-sidebar { position: fixed }` (Phase 12) qua CSS cascade order (rule defined sau wins ở equal specificity).

**Quy trình debug visual bug bắt buộc:**

1. **Inspect built CSS** trước khi viết code:
   ```bash
   grep -oE "\.SELECTOR\s*\{[^}]*\}" .next/static/chunks/*.css | head -5
   ```
   Tìm TẤT CẢ rules apply lên element + xác định rule nào win (cascade order, specificity).

2. **Khi fix attempt #1 không work → STOP, đào sâu**:
   - KHÔNG thử variant #2, #3, #4 của cùng giả thuyết
   - Khả năng cao có CSS override khác đang hoạt động silent

3. **Nghi ngờ code phase trước**:
   - Mỗi phase có thể đặt CSS override mà phase sau quên
   - Đặc biệt khi 2+ classes apply cùng 1 element (vd `.pola-nav` + `.pola-sidebar`)

4. **Yêu cầu DevTools output từ owner**:
   - "Mở F12 → click element → tab Computed → screenshot values"
   - Tiết kiệm hàng giờ patch trial-and-error

5. **Verify trong built output trước khi claim fix done**:
   - `grep` rule trong `.next/static/chunks/*.css` confirm rule đã đúng + không bị override
   - Restart server clean (`rm -rf .next && npm run build`) nếu nghi ngờ stale cache

**RULE 2: Khi 2 class cùng style 1 element, properties KHÔNG được xung đột.**

Vd `.pola-nav { position: relative }` + `.pola-sidebar { position: fixed }` apply cùng element = **một trong hai sẽ thua silently**. Trùng property → phải xóa property duplicate hoặc dùng `!important` (last resort) hoặc tăng specificity rõ ràng.

**RULE 3: Mass migration script (regex replace) RISKY khi CSS có cascade.**

Phase 8-11 mass-applied class changes không kiểm tra context → tạo regression. Khi migrate visual classes:
- Verify trong DevTools / built CSS sau mỗi batch
- Commit checkpoint mỗi batch (revert dễ)
- Không trust regex 100% — context matters

### 14.6. Template prompt cho owner khi báo visual bug

```
Trên trang [URL cụ thể], tôi thấy có [hình dạng: elip dọc / blob tròn mờ /
vệt sáng chạy ngang] [ở vị trí: xung quanh logo / góc trên phải hero / sau
form] [behavior: tĩnh / pulse / scroll qua / hover hiện ra].

Yêu cầu:
1. RÀ SOÁT toàn codebase tìm TẤT CẢ pattern tương tự.
2. LIỆT KÊ cho tôi xem trước khi fix.
3. Sau khi tôi confirm → mới sửa + push.
```

**Trade-off:** prompt cụ thể = 1 round-trip; prompt mơ hồ ("bỏ hiệu ứng này") = 3-5 round-trip.

### 14.7. FOUC (Flash Of Unstyled Content) Audit Pattern (Phase 17.2 lesson)

**MỤC TIÊU**: Mọi giá trị derived từ `localStorage`/`sessionStorage` mà ảnh hưởng UI phải apply TRƯỚC first paint, không trong `useEffect` (chạy SAU paint = flash).

**Audit thường xuyên** — grep `localStorage.getItem` trong `src/`:

| State scope | Fix pattern |
|---|---|
| Toàn trang (theme bg/text) | Inline blocking `<script>` trong `<head>` root layout — chạy trước cả React mount |
| Element nhỏ (sidebar, dropdown) | `useIsomorphicLayoutEffect` — `useLayoutEffect` client + `useEffect` SSR fallback (tránh warn) |
| Local UI (cart, form) | `useState` thường — không persist thì không FOUC |
| Async fetch (API data) | Loading state acceptable, hiện skeleton/spinner |

Ví dụ inline script cho theme (root layout.tsx, BẮT BUỘC khi default theme mode khác system default):
```html
<script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('poolane-theme-v2');var t=(s==='dark'||s==='light')?s:'light';var h=document.documentElement;h.classList.add('theme-'+t);if(t==='dark')h.classList.add('lqg-dark');h.setAttribute('data-theme',t);}catch(e){...}})();` }} />
```
Đồng bộ storage key + class names với ThemeProvider; bump key version khi reset preference (Phase 13.2 → `poolane-theme-v2`). `suppressHydrationWarning` trên `<html>` bắt buộc vì script mutate className trước React mount.

### 14.8. Library Version Pinning Discipline (Phase 17.4 hotfix lesson)

**Khi `npm install` lib mới**: LUÔN check MAJOR version semver. Latest có thể là breaking change.

**Trường hợp `react-grid-layout`**: `npm i react-grid-layout` mặc định install latest v2.2.3. **v2 đã rewrite hoàn toàn API** — bỏ `WidthProvider` HOC pattern, thay bằng hooks (`useContainerWidth`, `useResponsiveLayout`). Code v1 pattern (`import { Responsive, WidthProvider }`) build fail:
```
Export WidthProvider doesn't exist in target module
```

**Fix**: downgrade `^1.5.0` (stable CJS). Pin explicit range cho stable, không `latest` mà chưa migrate API.

**Pre-commit checklist khi install new lib**:
1. `npm view <lib> versions --json | tail -5` — xem latest version
2. Đọc CHANGELOG → check breaking changes giữa major
3. Test `npm run build` local TRƯỚC commit
4. Nếu Vercel deploy lỗi → owner thấy site down

### 14.9. Prisma Model Accessor Discipline (Phase 17.4 hotfix lesson)

**Model name = camelCase trên `prisma.*` accessor.**

| Prisma schema | Accessor đúng | Sai (catch ở compile) |
|---|---|---|
| `model DashboardWidget` | `prisma.dashboardWidget` | `prisma.widget` |
| `model SessionRegistration` | `prisma.sessionRegistration` | `prisma.registration` |
| `model SystemSetting` | `prisma.systemSetting` | `prisma.setting` |

**Workflow sau khi sửa schema**:
1. `npx prisma db push` — sync schema lên DB
2. `npx prisma generate` — regenerate client với types mới
3. **RESTART dev server** (Turbopack cache stale Prisma client)
4. `npm run build` — full pipeline (compile + typecheck + static gen). Sandbox có thể fail ở static gen do DB unreachable — acceptable, Vercel sẽ pass

### 14.10. Polling Race Condition Pattern (Phase 23.2 lesson)

Khi có **polling interval** + **optimistic mutation** (chat, real-time list...), race condition điển hình:

```
T=0:    User send → optimistic added to array, POST in flight
T=3s:   Polling fires → fetchMessages(since=...) → server trả real msg đã tạo từ POST
        → array append → [..., optimistic_opt, real]
T=3.05: POST response arrives → setMessages map replace optimistic → real
        → array = [..., real, real]  ← DUPLICATE
```

**Fix dedupe by ID (2 chỗ)**:

```typescript
// 1. Polling append: filter trùng id
setMessages(prev => {
  const existingIds = new Set(prev.map(m => m.id))
  const filtered = newMsgs.filter(m => !existingIds.has(m.id))
  return filtered.length === 0 ? prev : [...prev, ...filtered]
})

// 2. POST response: check real đã exists chưa
setMessages(prev => {
  const withoutOpt = prev.filter(m => m.id !== optimistic.id)
  if (withoutOpt.some(m => m.id === real.id)) return withoutOpt
  return [...withoutOpt, real]
})
```

### 14.11. React State Stale Trong Cùng Tick (Phase 23.2 lesson)

Rapid event firing (Enter spam, double-click) trong < 16ms (1 frame) → state chưa propagate → guard `if (sending) return` không hiệu quả.

**Pattern: `useRef` cho sync flag**

```typescript
const sendingRef = useRef(false)

async function handleSend() {
  if (sendingRef.current) return  // sync read, không qua React render
  sendingRef.current = true        // sync write
  setSending(true)                  // UI state vẫn cần cho disabled button
  ...
  finally {
    sendingRef.current = false
    setSending(false)
  }
}
```

useRef đọc/ghi đồng bộ → 2 lần Enter trong cùng tick → lần 2 thấy `sendingRef.current === true` → return ngay.

Áp dụng cho: chat send, form submit, payment confirm, action button bất kỳ có async.

### 14.12. Mobile Responsive Audit cho Split-Pane (Phase 23 lesson)

**Pattern bug**: Desktop split-pane (left list + right content) khi resize mobile:
- Left `w-72` (288px) chiếm 76% của 375px viewport
- Right `flex-1` còn ~55px → content bị squash, name/avatar/bubble overflow

**Fix mobile-first responsive**:

```tsx
{/* Left: full mobile, fixed desktop. Hide khi item selected */}
<div className={`w-full sm:w-72 ${activeId ? 'hidden sm:flex' : 'flex'} ...`}>

{/* Right: hidden khi không có item selected. Hiển full mobile khi có */}
<div className={`flex-1 ${activeId ? 'flex' : 'hidden sm:flex'} ...`}>
  {/* Back button chỉ mobile để return về list */}
  <button onClick={() => setActiveId(null)} className="sm:hidden">
    <ArrowLeft />
  </button>
```

Kèm theo: bỏ auto-select first item — để user click chủ động → mobile thấy list trước.

### 14.13. Production Crash Debugging qua error_logs (Phase 22.1 lesson)

Production error message thường bị minify ("An error occurred in the Server Components render. The specific message is omitted in production builds").

**Workflow**:
1. User báo lỗi với `digest` code (`1036636938`)
2. Query `prisma.errorLog.findMany({ where: { context: 'client.error_boundary' }, ... })` — `inputData.digest` match
3. `userId` tìm được → query user data → reproduce locally
4. Common cause: **stale Vercel deploy** (schema đã `prisma db push` lên production DB nhưng bundle JS vẫn chạy code cũ) → mismatch → crash
5. Defensive fix: wrap server component DB queries trong `try/catch + logError + fallback empty array` → page render empty state thay vì error boundary

Script tạm: `prisma/check-error-logs.ts` (xóa sau khi debug xong).

### 14.14. Race trong onMount Measurement (Phase 24.1 lesson)

**Pattern bug**: Dialog/modal cần đo container width để config child component (vd `cropSize` cho Cropper):

```typescript
// ❌ BAD: chỉ có ResizeObserver — Safari iOS đôi khi fire chậm/skip
const [size, setSize] = useState(null)
useEffect(() => {
  const ro = new ResizeObserver((e) => setSize(...))
  ro.observe(el)
}, [])
{size && <Cropper cropSize={size} />}  // → black screen khi RO chưa fire
```

**Fix**:
```typescript
// ✅ GOOD: init default + initial sync measure + RO cho resize sau
const [size, setSize] = useState({ width: 280, height: 280 })  // sensible default
useEffect(() => {
  const measure = () => { if (el.clientWidth > 0) setSize(...) }
  measure()  // sync ngay khi mount
  const ro = new ResizeObserver(measure)
  ro.observe(el)
}, [])
<Cropper cropSize={size} />  // luôn render
```

Triết lý: **không bao giờ phụ thuộc 100% vào async observer** — luôn có initial sync measurement + sensible default.

---

## 15. Operational Principles (Production Discipline)

### 15.1. Test Account Principle (Phase 15.2)

Luôn duy trì 1 set demo accounts cho **smoke test + UX verify**:

- **Student**: `0900000088` / `PoolaneDemo@123` (vé 8 buổi, enrolled khoá ECH)
- **Staff**: `0900000099` / `PoolaneDemo@123`

**Quy tắc:**
1. **Chạy luồng thật** — registration / payment / attendance / assessment đều chạy code thật, **KHÔNG bypass logic** → tester thấy UX đúng như user thật
2. **Protected** — API DELETE block với 403 `DEMO_ACCOUNT_PROTECTED` nếu `phone.startsWith('0900000')`
3. **Auto-ensure** — cron `/api/cron/ensure-test-account` daily 5:30 sáng VN tự re-create nếu missing (idempotent)
4. **Exclude analytics** — `getDemoStudentIds()` filter exclude khỏi 7 critical queries
5. **Audit log giữ** — debug cần đầy đủ trace
6. **Refresh data manual** — `DELETE_DEMO=1 npm run db:seed-demo`

### 15.2. Data Integrity Pattern (Phase 15.2)

**Approach: soft tagging + query-level filter** (không cần env riêng — overkill cho 200 HV).

Helper `src/lib/demo-account.ts`:
```typescript
isDemoAccount(phone)          // detect by prefix '0900000'
getDemoStudentIds(prisma)     // cached 60s, return string[]
excludeDemoStudentsFilter()   // Prisma WHERE { studentId: { notIn } } helper
```

**Affected queries (7):**
- `/admin/dashboard` — 6 stats
- `/api/reports/revenue` — Excel export
- `/api/ai/dropout-risk` — prediction list
- `/admin/skill-heatmap` — class average
- `/api/cron/pulse-check` — follow-up list
- `/api/cron/reconciliation` — payment check
- `/api/cron/absence-reminder` — email loop

**KHÔNG filter** (intentional):
- `audit_log` (debug trace đầy đủ)
- `error_logs`
- Notifications

### 15.3. STRICT Payment Validation (Phase 15.1)

Sepay automated webhook → `input.amount === order.finalAmount` phải khớp **chính xác**:

| Match | Hành vi |
|---|---|
| ✅ Khớp | Auto-confirm Order `paid` + Payment record |
| ❌ Lệch | `AMOUNT_MISMATCH` error → save `unmatched_transactions` + notify admin |

**Manual admin confirm bypass** strict (admin click `/admin/shop/orders` "Xác nhận đã nhận tiền") vì admin đã verify sao kê.

**Enrollment KHÔNG strict** — partial payment chấp nhận (plan B/C cho phép 30% deposit trước, full sau).

### 15.4. Rule-based AI > LLM (Phase 15, scale 200 HV)

**Dropout prediction** (`/api/ai/dropout-risk`):
- 5 heuristic factors (vắng, nợ, vé, tần suất, ôn luyện) + decision tree
- Output: priority/action/reason/suggestion/templateMessage per HV
- 7 patterns recommendation cụ thể (critical/high/medium)

**Skill comments** (`src/lib/ai/skill-comments.ts`):
- Rule engine: delta calc + threshold + variant pool
- Output: overall + improvements[] + weaknesses[] + encouragement + graduationReadiness%

**LLM (Claude API) sẽ phù hợp khi:**
- Scale >1000 HV
- Real-time chat tư vấn cá nhân
- Video stroke analysis (Phase 17+)

Hiện tại scale 200 HV → rule-based đủ insight, cost saving, no dependency.

### 15.5. Force Migrate Strategy (Phase 13.2)

Khi cần reset user preference (vd localStorage), **bump key version** thay vì write JS migration code:

```typescript
const STORAGE_KEY = 'poolane-theme-v2'  // bumped từ 'poolane-theme'
```

User cũ có key cũ → app KHÔNG đọc key đó → fresh init default (light). Browser tự GC orphan key sau. Không cần touch old data, không write migration JS.

### 15.6. Code Clean Discipline (Phase 16.1)

**Trước khi build feature mới**, baseline phải đạt:

```bash
npm run lint    # → 0 errors + 0 warnings
npm run build   # → pass TypeScript strict
```

Cộng audit "orphan refs" sau mỗi mass migration:
- Grep removed props/classes — đảm bảo 0 active code references
- Chỉ comment lịch sử cho phép giữ (intentional)

**Tốn 30 phút audit > 2 ngày debug regression sau.**

### 15.7. Quiet Luxury UI Philosophy (Phase 16)

Apple Liquid Glass framework giữ ở mức **structure** (frosted bg + blur + border + hover), **bỏ hoàn toàn animation loop** (specular streak, halo pulse, decoration blob).

**Triết lý:** "Premium quiet" — UI không tranh giành sự chú ý với content. App type Poolane = focus mode (không entertainment) → animation noise là anti-pattern.

Chi tiết tại Section 2 (Brand) — Design Discipline subsection.

### 15.8. Role-Agnostic UX Consistency (Phase 23 lesson)

**Triết lý**: KHÔNG có chênh lệch UX giữa các role (admin/staff/student) hay device (mobile/desktop). Cùng action → cùng visual feedback → cùng affordance.

**Anti-pattern tránh**: Asymmetric features dựa trên role.
- ❌ Phase 22 thử: chỉ HV thấy CheckCheck khi admin đọc, admin không thấy (tránh "áp lực reply nhanh")
- → Owner phản hồi: "tôi không muốn có sự chênh lệch giữa các role"
- ✅ Phase 23 sửa: symmetric — cả 2 bên đều thấy CheckCheck khi đối phương đọc

**Lý do**: Hidden rule yêu cầu user học → bad UX. Consistency tạo trust + predictability.

**Áp dụng**:
- Read receipt: symmetric
- Edit/delete permissions: cùng role → cùng quyền (không gate theo platform)
- Notification: cùng event → cùng broadcast (không skip role nào)
- Form validation: cùng field → cùng rule (không loose hơn cho admin)

Ngoại lệ acceptable: **admin có thêm quyền** (xem all conversations, override resolve, etc.) nhưng không **bớt** UX so với student.

### 15.9. Standard UX Over Custom Rules (Phase 24 lesson)

**Triết lý**: Ưu tiên convention quen thuộc (WhatsApp/Telegram/Zalo cho chat, Google Calendar cho schedule, Shopee/Tiki cho cart) hơn rule clever tự nghĩ ra để "save space".

**Anti-pattern tránh**: Hidden rules user phải học.
- ❌ Phase 22 thử: dedup time same-minute → chỉ tin cuối chuỗi hiển thị time
- Vấn đề thực tế:
  - User phải biết rule mới hiểu
  - Read receipt per-message ambiguous (tin nào đã đọc?)
  - Layout "lệch" khi meta bị hide
- ✅ Phase 24 sửa: hiển thị time MỌI tin (khớp WhatsApp). Lặp "11:23 · 11:23" chấp nhận được, đổi lấy:
  - Read receipt rõ ràng từng tin
  - Không rule ngầm
  - Code đơn giản hơn (-28 dòng)

**Câu hỏi quyết định**: "Có ai cần học rule này để dùng app không?" Nếu có → đổi sang convention chuẩn.

**Trade-off chấp nhận**: Visual lặp lại > hidden complexity. User vẫn ưu tiên cao hơn.

---

## 16. Security & Privacy

### 16.1. Tuân Thủ Pháp Lý Việt Nam

**Nghị định 13/2023/NĐ-CP — Bảo vệ dữ liệu cá nhân:**
- Trang chính sách bảo mật public tại `/privacy`
- Học viên tick xác nhận khi đăng ký, lưu timestamp
- Right to access: học viên xem được toàn bộ dữ liệu của mình
- Right to delete: học viên yêu cầu xoá (qua admin, có quy trình)
- Data retention: dữ liệu học viên không hoạt động > 2 năm có thể archive

### 16.2. Đồng Ý Hình Ảnh/Video

2 mức consent tách biệt:
- **Học tập nội bộ** (bắt buộc khi đăng ký) — cho phép lớp ghi hình kỹ thuật để dạy
- **Marketing** (tuỳ chọn) — cho phép sử dụng trên mạng xã hội

Cả 2 lưu timestamp xác nhận trong `users` table.

### 16.3. Secrets Management

- `.env.local` — local development, không commit
- Vercel Environment Variables — production
- KHÔNG BAO GIỜ commit secret vào git
- KHÔNG BAO GIỜ paste secret vào chat với AI
- `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng server-side

### 16.4. RBAC Enforcement

3 tầng:
1. **UI** — ẩn tính năng không có quyền
2. **API** — `requireRole()` ở mọi protected route
3. **Database** — RLS policies ở Supabase

Mọi route phải có check ở TẦNG 2. UI và DB là defense in depth.

### 16.5. Sensitive Data Handling

- CCCD — encrypted at rest (Supabase column encryption)
- Mật khẩu — Supabase Auth tự hash (bcrypt)
- Số điện thoại — không encrypt nhưng có RLS

### 16.6. Rate Limiting

- Login: 5 lần fail / 15 phút / IP
- Registration: 3 account / SĐT / 24h
- API chung: 100 req / phút / user

### 16.7. CORS & CSRF

- CORS: chỉ allow `polaproject.com` ở production
- CSRF: Next.js mặc định protect, dùng server actions tận dụng

---

## 17. Testing Strategy

### 17.1. Cho Non-Developer

**Không cần viết automated test** — thay vào đó:

1. **Acceptance Checklist** mỗi tính năng
2. **Seed data script** để test thật
3. **Vercel Preview Deployment** để test trước khi production
4. **Multi-device responsive test**: dùng [Responsively App](https://responsively.app) (free, open-source) trỏ vào `localhost:3000` → xem N device side-by-side, session share, sync click/scroll, hot-reload đồng bộ. Real device thật: mở `http://<local-IP>:3000` từ điện thoại (cùng WiFi) — IP in ra ở terminal khi `npm run dev` dưới dòng `Network:`

### 17.2. Seed Data Bắt Buộc

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

### 17.3. Acceptance Test Checklist Mỗi Phase

Format:
```
[ ] Test case 1: Description
    Steps: 1, 2, 3
    Expected: ...
    Verify in: UI / Supabase dashboard / Vercel logs
```

AI tạo checklist sau khi build xong, user tự check trên browser.

### 17.4. Manual Test Scenarios Quan Trọng

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

### 17.5. Production Smoke Test (sau mỗi deploy)

1. Login với 1 admin, 1 staff, 1 student
2. Tạo 1 đăng ký mới + duyệt
3. Ghi nhận 1 thanh toán
4. Đánh giá 1 học viên
5. Check Vercel logs có error không

---

## 18. Deployment & Operations

### 18.1. Environment

| Environment | Purpose | URL |
|---|---|---|
| Local | Development | localhost:3000 |
| Preview | Test trước deploy | *.vercel.app (auto từ PR) |
| Production | Live | polaproject.com |

### 18.2. Environment Variables (.env.example)

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

### 18.3. Domain DNS (Matbao → Vercel)

Trong trang quản lý Matbao, thêm:
```
Type: A     Name: @     Value: 76.76.21.21
Type: CNAME Name: www   Value: cname.vercel-dns.com
```

Trong Vercel: Add domain `polaproject.com` + `www.polaproject.com`.

### 18.4. Backup & Recovery

- **Supabase Pro daily backup** — 7 days retention
- **Manual export hàng tuần** — admin tự download JSON full
- **Vercel git-based** — toàn bộ code có lịch sử trên GitHub

### 18.5. Monitoring

- **Vercel Analytics** — page views, performance
- **Vercel Logs** — runtime errors
- **Supabase Dashboard** — DB usage, slow queries
- **Custom Health Check** — `/api/health` ping

### 18.6. Chi Phí Hàng Tháng

| Giai đoạn | Chi phí | Note |
|---|---|---|
| Development | $0 | Free tiers |
| Launch (Phase 4) | $25 ≈ 625k VND | Supabase Pro |
| Tăng trưởng (>300 HV) | $45 ≈ 1.1M VND | + Resend Starter |
| Scale lớn | $65+ ≈ 1.6M VND | + Vercel Pro |

### 18.7. Disaster Recovery

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

## 19. DEPLOY READINESS CHECKLIST (Phase 13 — Pre-launch)

### 19.1. Code (AI có thể verify autonomously)
- [x] All builds pass (`npm run build` exit 0)
- [x] Lighthouse landing perf 89 / a11y 100 / bp 100 (sau Phase 12.1 + 13)
- [x] No console.log secrets, no hardcoded API keys
- [x] Audit log on all financial write operations (Phase 12 fixed refund.create)
- [x] requireRole on all protected routes (Phase 12 fixed shop/products GET)
- [x] Typography discipline (Phase 13 — italic chỉ ở 3 cases)
- [x] Sidebar fixed Notion-style (Phase 12.X bug fix)
- [x] Mass migration scripts committed (`migrate-tokens`, `migrate-glass`, `migrate-glass-tables`, `migrate-theme-harmony`, `migrate-typography`)
- [ ] Sandbox folder removed hoặc moved sang `qa/design-reference/`
- [ ] Verify Lighthouse cả 5 trang × 2 mode (dark/light) — owner test thủ công

### 19.2. Infrastructure (owner thao tác 3rd-party dashboard)
- [ ] **Vercel**: tạo project + connect GitHub repo
- [ ] **Vercel**: import env vars từ `.env.local`
- [ ] **Matbao DNS**: thêm A record `@` → `76.76.21.21` + CNAME `www` → `cname.vercel-dns.com`
- [ ] **Vercel domain**: add `poolane.vn` + `www.poolane.vn`
- [ ] **Supabase Pro**: upgrade plan ($25/mo) → daily backup 7 days
- [ ] **Supabase Storage**: tạo bucket `poolane-public` (public read)
- [ ] **Sepay**: env `SEPAY_API_KEY` + cấu hình webhook `https://poolane.vn/api/webhooks/sepay`
- [ ] **Resend**: tạo account + verify domain `poolane.vn` (thêm MX/TXT DNS Matbao) + env `RESEND_API_KEY`
- [ ] **VAPID keys**: chạy `npx web-push generate-vapid-keys` → env `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY`
- [ ] **Cron secret**: env `CRON_SECRET` (random 32 char)
- [ ] **Health check**: monitor `/api/health` → alert nếu fail

### 19.3. Content (owner chốt)
- [ ] **Combo 3 khoá pricing** — chốt giá giảm (% hay số tiền cố định)
- [ ] **Shop products real list** (placeholder 9 product seed hiện tại — cần real)
- [ ] **Email templates** chi tiết (welcome, invoice, refund, birthday, absence) — code sẵn sàng, cần review tone
- [ ] **FAQ entries** — 8 entries seed đã có, kiểm tra cập nhật
- [ ] **Blog posts** demo 3-5 bài (technique / safety / nutrition / student_story) cho launch

### 19.4. QA cuối (owner thao tác)
- [ ] Test 3 role login (admin/staff/student) flow toàn diện
- [ ] Test thanh toán mock với Sepay sandbox
- [ ] Test push notification trên Safari + Chrome
- [ ] Test mobile real device (iPhone + Android) — touch target 44px, scroll, sticky
- [ ] Test theme switcher Sáng/Tối preserve trong session

---

## PHỤ LỤC: TODO / TBD

Những điều CHƯA chốt, cần quyết định trước khi build:

- [ ] Brand identity: logo chính thức (màu + font đã định hướng, cần file thiết kế)
- [ ] Combo 3 khoá: mức giảm giá cụ thể (%)
- [ ] Trường hợp B hoàn tiền (giữ vé bơi): học viên có tính vào sức chứa ca không?
- [ ] Combo 3 khoá: có ưu tiên đăng ký buổi không?
- [ ] Danh sách cụ thể ~20 sản phẩm/dịch vụ trong Shop *(placeholder bên dưới — owner điền chi tiết)*
- [ ] Email template chi tiết (welcome, invoice, absence, birthday, ...)
- [x] Email: `support@polaproject.com` qua **Resend** — domain `polaproject.com` đã verify (MX + TXT DNS records thêm vào Matbao). `RESEND_API_KEY` đã có trong `.env.local`. *(Không cần Google Workspace)*

### Shop Products Placeholder

> ⚠️ Owner cần điền chi tiết (tên, SKU, giá, tồn kho) trước khi build Phase 10.

**Nhóm 1 — Khoá học (type: `course`)** — không có tồn kho, tạo enrollment khi mua:
- Khoá Bơi Ếch (10 buổi) — 1.600.000đ
- Khoá Bơi Sải (10 buổi) — 2.100.000đ
- Khoá Bơi Bướm (10 buổi) — 3.500.000đ
- Combo 3 khoá (Ếch + Sải + Bướm) — giá TBD (có giảm giá)

**Nhóm 2 — Buổi cải thiện kỹ năng (type: `improvement_pack`)** — không tồn kho, tạo improvement_sessions khi mua:
- Pack 5 buổi cải thiện — giá TBD
- Pack 10 buổi cải thiện — giá TBD

**Nhóm 3 — Dịch vụ (type: `service`)** — không tồn kho, cần lên lịch sau khi mua:
- *(Owner điền — ví dụ: tư vấn 1-1, video phân tích kỹ thuật...)*

**Nhóm 4 — Đồ vật lý (type: `physical`)** — có tồn kho, giao tại bể:
- Kính bơi — giá TBD
- Mũ bơi Poolane — giá TBD
- Bộ đồ bơi — giá TBD
- *(Owner điền thêm)*
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
| **Liquid Glass** | Apple iOS 26/macOS 26 design language (translucent + lensing + specular streak). Reference: family.co |
| **LQG tokens** | `.lqg-*` CSS variable namespace cho design system Phase 12+ (vd `--lqg-bg-glass`, `--lqg-accent`) |
| **Lensing** | `backdrop-filter: blur(N) saturate(M%) brightness(K)` compound — màu phía sau "uốn" qua kính |
| **Specular streak** | Vệt sáng gradient trượt chéo qua glass element mỗi 8-11s (linear-gradient animated) |
| **Concentric radius** | Bo góc nested chuẩn: outer 32px → inner 24px → button 16px → small 12px |
| **Spring overshoot** | Cubic-bezier easing có overshoot (`0.34, 1.7, 0.64, 1`) — bouncy feel |
| **Press squish** | Click feedback `scale(0.96) + brightness(0.92)` snappy 150ms |
| **Notion-style sidebar** | Layout pattern: outer padding-left 16rem + sidebar position: fixed (KHÔNG flex parallel) |
| **Typography discipline** | Phase 13 rule: italic Cormorant CHỈ cho quote/blog body/greeting; sans Plus Jakarta cho mọi UI structural |
| **Popover vs Picker/Overlay** | Popover = Base UI `Popover.Root` anchored vào trigger (FAB chat, notification bell). Picker/Overlay = absolute-positioned div không anchor (UserPicker trong popover). "Popup" colloquial cho cả 2 |
| **Participants pattern** | Phase 20 chat schema: `Conversation` không có FK Role-specific, dùng `ConversationParticipant` junction table (any-to-any). Thay 1-staff-1-student rigid pattern |
| **Symmetric UX** | Phase 23 principle: KHÔNG asymmetric features giữa roles. Cùng action → cùng feedback. Tránh hidden rules dạng "chỉ role X mới thấy" |
| **Standard UX over custom rules** | Phase 24 principle: ưu tiên convention quen thuộc (WhatsApp/Telegram/Shopee) hơn rule clever. Visual lặp lại > hidden complexity |
| **sendingRef pattern** | useRef sync flag chống double-fire khi state stale trong cùng tick (Enter spam, rapid click). State `setSending` chỉ cho UI disabled; ref cho logic guard |
| **shortenVietnameseName** | Phase 21 helper (`src/lib/format-name.ts`): viết tắt họ (từ đầu) còn 2 chữ, giữ tên đệm + tên chính. Ví dụ `Nguyễn Ngọc Hoàng Việt` → `Ng Ngọc Hoàng Việt` |
| **Design Tokens** | Phase 28 architecture: CSS Custom Properties ở `:root` làm single source of truth cho design decisions (color, spacing, padding, radius, font). Tham chiếu Notion/Lark/Linear/Stripe/Material Design. Sửa 1 token → toàn app đồng bộ. Token `--page-px` (mobile 20px / tablet 32px / desktop 40px) quản padding ngang trang qua `.pola-main { padding-inline: var(--page-px) }` |
| **Centralized Padding** | Phase 28 pattern: padding TOÀN APP managed ở 1 chỗ duy nhất (`.pola-main` rule + `--page-px` var). Pages chỉ cần `mx-auto max-w-Xxl` (centering), KHÔNG được tự thêm `px-X` riêng → tránh drift. Hero blocks escape qua `margin-inline: calc(-1 * var(--page-px))` cho band edge-to-edge. |
| **Carryover ticket** | Phase 27.4: HV cũ đã trả tiền vé ngoài hệ thống → admin tạo PoolTicket với flag `isCarryover=true` KHÔNG tạo Payment record. Doanh thu báo cáo filter `excludeFromRevenue: false` để loại trừ. |
| **Reversal payment** | Phase 27.4: KHÔNG xoá Payment đã tạo. Sửa lỗi bằng cách tạo Payment mới với `amount` âm + `isReversal=true` + notes link Payment gốc. Forward-only audit. |
| **Root Cause / Architecture First** | Phase 28 rule §12.10: trước khi patch bug, BẮT BUỘC analyze root cause (grep tương tự ≥3 chỗ = pattern) + đối chiếu chuẩn ngành + propose 2 hướng (patch vs architectural) cho owner chọn. KHÔNG default về patch. |

---

**Phiên bản:** 1.8 — Phase 26-28 (Avatar simple upload → crop true ratio; System audit + production hardening; Theme contrast + FAB cross-viewport; Wire điểm danh/đánh giá; Transaction CRUD; **Centralized Padding System / Design Tokens**). Rule mới §12.10: Root Cause / Architecture First trước khi patch.
**Cập nhật cuối:** 2026-05-19
**Maintainer:** Owner + AI

> Mọi quyết định nghiệp vụ phải được phản ánh ở đây. Code đi theo file này, không ngược lại.
