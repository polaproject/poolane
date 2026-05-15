# Poolane Production Setup Reference

> Hệ thống Poolane đã **live tại https://poolane.vn** từ **2026-05-15**. File này là quick reference cho owner + debugging.

---

## 🎯 Quick Access

### Admin login (production)
```
URL:       https://poolane.vn/login
Phone:     0355553205
Password:  privatePassPrj@4Website
Tên:       Nguyễn Ngọc Hoàng Việt
```

### Demo accounts (Synthetic monitoring — luôn live trên production)
```
Staff:    0900000099 / PoolaneDemo@123
Student:  0900000088 / PoolaneDemo@123  (vé 8 buổi, enrolled khoá ECH)
```

Quy tắc (Phase 15.2):
- Chạy **luồng thật** — registration / payment / attendance / assessment đều dùng code production, KHÔNG bypass logic
- API DELETE **block 403** nếu phone start `0900000` (protected)
- Cron daily **5:30 AM VN** (`ensure-test-account`) tự re-create nếu missing
- **Auto-exclude khỏi analytics** qua `getDemoStudentIds()` helper (7 critical queries)
- **Audit log giữ** — debug cần đầy đủ trace
- Refresh: `DELETE_DEMO=1 npm run db:seed-demo` rồi `npm run db:seed-demo`

---

## 🏗️ Infrastructure

| Service | Detail |
|---|---|
| **GitHub** | `polaproject/poolane@master` |
| **Vercel** | Team `pola-project` Pro plan ($20/mo). Project `poolane` region `sin1` (Singapore) |
| **Supabase** | Project `frzqhredvgdmlwimctpy` region Singapore. **Free tier** — auto-pause sau 1 tuần idle |
| **DB** | PostgreSQL 17, 44 tables, 3 courses + admin + 8 FAQs |
| **Storage** | Bucket `poolane-public` (5MB, image/* MIME) + 4 RLS policies |
| **Resend** | Domain `polaproject.com` verified. FROM `support@polaproject.com` |
| **Sepay** | Gói Basic 99k/tháng. ⚠️ Owner cần save webhook URL `https://poolane.vn/api/webhooks/sepay` với API Key `5d7d97977c...` |
| **TPBank** | Account `22282138888` (NGUYEN NGOC HOANG VIET) cho VietQR pay |
| **DNS** | Matbao quản lý. A `@` → `216.150.1.1` + `216.150.16.1`, CNAME `www` → `f03179357ed4c972.vercel-dns-016.com.` |
| **SSL** | Let's Encrypt cert apex+www, auto-renew |

---

## 🔧 Common Commands

### Development
```bash
npm run dev                    # Local dev server :3000
npm run build                  # Test production build local
npm run lint                   # ESLint check
```

### Database
```bash
npm run db:push                # Push schema to Supabase (no migrations)
npm run db:studio              # Open Prisma Studio (browse data)
npm run db:seed-production     # Init courses + admin + FAQs (đã chạy 1 lần)
npm run db:seed-demo           # Tạo demo HV + sessions cho test
DELETE_DEMO=1 npm run db:seed-demo  # Xoá demo data
```

### Vercel
```bash
vercel logs --token=$VERCEL_TOKEN     # Live logs
vercel deploy --prod --token=$VERCEL_TOKEN  # Manual deploy (override git push)
```

---

## 🔴 Sepay Webhook Setup — Vẫn cần owner làm

DNS đã resolve, URL `https://poolane.vn/api/webhooks/sepay` accessible. Owner quay lại https://sepay.vn → Webhook → Tạo mới:

| Field | Giá trị |
|---|---|
| Tên | `Poolane Production` |
| URL | `https://poolane.vn/api/webhooks/sepay` |
| Loại GD | ✅ Tiền vào |
| Định dạng | JSON |
| Tự gửi lại lỗi | ✅ Bật |
| TK ngân hàng | TPBank `22282138888` |
| Bảo mật → API Key | `5d7d97977cddb184f70a2e9e2c5e237c7379c7f36216bff904f4719636a47f32` |
| Cảnh báo | (tắt) |

Sepay sẽ tự test → kỳ vọng **200 OK**. Sau đó mọi giao dịch chuyển khoản vào TPBank `22282138888` sẽ auto-confirm enrollment/order qua memo `POLA<id>` hoặc `POLAE<id>`.

Backup: nếu chưa setup Sepay, admin có nút "Xác nhận đã nhận tiền" tại `/admin/shop/orders` để confirm thủ công.

---

## 📋 Env Variables (Vercel — 19 vars)

| Key | Loại | Note |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Plain | `https://frzqhredvgdmlwimctpy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Plain | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Sensitive | Service role cho admin operations |
| `DATABASE_URL` | Sensitive | Transaction pooler port 6543 |
| `DIRECT_URL` | Sensitive | Session pooler port 5432 |
| `RESEND_API_KEY` | Sensitive | Resend email API |
| `EMAIL_FROM` | Plain | `support@polaproject.com` |
| `NEXT_PUBLIC_APP_URL` | Plain | `https://poolane.vn` |
| `NEXT_PUBLIC_APP_DOMAIN` | Plain | `poolane.vn` |
| `NEXT_PUBLIC_SCHOOL_NAME` | Plain | `Poolane` |
| `BANK_BIN` | Plain | `970423` (TPBank) |
| `BANK_ACCOUNT_NO` | Plain | `22282138888` |
| `BANK_ACCOUNT_NAME` | Plain | `NGUYEN NGOC HOANG VIET` |
| `BANK_DISPLAY_NAME` | Plain | `TPBank` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Plain | Web Push public |
| `VAPID_PRIVATE_KEY` | Sensitive | Web Push private |
| `VAPID_SUBJECT` | Plain | `mailto:support@polaproject.com` |
| `CRON_SECRET` | Sensitive | Vercel cron Authorization Bearer |
| `SEPAY_API_KEY` | Sensitive | Sepay webhook auth |

Bỏ `TZ` — Vercel reserved name, code dùng date-fns với Asia/Ho_Chi_Minh explicit.

---

## 🐛 Common Issues

### "Not secure" trên Chrome (cert valid theo DevTools)
Chrome cached "allowed insecure content" từ lần truy cập trước cert active. Fix:
- `chrome://net-internals/#hsts` → Delete domain `poolane.vn`
- Hoặc Incognito test (fresh state)
- Owner Chrome Enterprise có thể có MITM proxy — verify trên Edge/Firefox

### Photo upload fail "Bucket not found"
Storage bucket `poolane-public` chưa tạo. AI tạo qua SQL:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('poolane-public', 'poolane-public', true, 5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']);
```

### Webhook 401 Unauthorized từ Sepay
Token paste sai trong Sepay config. Check lại env `SEPAY_API_KEY` trên Vercel khớp với token nhập trong Sepay Bảo mật tab.

### Vercel deploy fail "Prisma client not found"
Script `postinstall: "prisma generate"` đã add trong package.json. Nếu vẫn fail → check Vercel build log có chạy `prisma generate` không.

### DB connection timeout
`DATABASE_URL` dùng Transaction pooler (port 6543) cho query runtime. Nếu thấy "too many connections" → check Vercel function vùng region khớp `sin1` (giảm latency + connection lifetime).

---

## 📊 Free Tier Limits (Supabase + Vercel)

### Supabase Free
- 500MB DB storage
- 1GB file storage
- 2GB bandwidth/tháng
- 50,000 monthly active users
- **Auto-pause sau 1 tuần idle** ← rủi ro với traffic thấp ban đầu

Nâng Pro $25/mo khi: cần daily backup, không bị pause, >500MB data.

### Vercel Pro $20/mo
- 1TB bandwidth
- 1M function invocations
- 5000 image optimizations
- 24,000 build minutes
- 40 cron jobs (Poolane dùng **5** — `birthday`, `pulse-check`, `reconciliation`, `absence-reminder`, `ensure-test-account`)
- 1 concurrent build

---

## 🚀 Phase Roadmap

### ✅ Completed (2026-05)
- Phase 1-13: Design system + Liquid Glass + Typography
- Phase 13.1: Specular streak cleanup
- Phase 13.2: Default light + mobile login
- Phase 14: Dark mode contrast boost
- Phase 6: Auth pages migrate LQG primitives
- **Production deploy**: GitHub + Vercel + Domain + SSL + Sepay-ready
- Phase 15: AI rule-based polish (dropout prediction + skill comments — no LLM)
- Phase 15.1: STRICT payment validation (Sepay amount match)
- Phase 15.2: Test account protection + Data integrity (cron + getDemoStudentIds filter)
- Phase 15.3: UX micro-fixes (password reveal, session restore, admin direct approve)
- Phase 16: Quiet luxury UI (xoá toàn bộ specular/halo/decoration blob — 68 file)
- Phase 16.1: Code clean discipline (lint 0 errors + 0 warnings baseline)

### ⏸️ Pending
- **Sepay webhook save** (owner manual — 5 phút)
- **Smoke test 5 mục** (login, public, register, push, cron)
- **Combo 3 khoá pricing** (chốt giá business)

### 💡 Future enhancements
- Auth pages split-layout với artwork (current is centered)
- Real-time WebSocket cho notifications
- Mobile PWA install prompt
- Bulk operations (export/import data)
- Multi-language (EN/VI toggle)

---

**Maintained by:** Owner Nguyễn Ngọc Hoàng Việt + Claude AI assistant
**Last updated:** 2026-05-16 (Phase 15-16.1 — AI + payment + data integrity + quiet luxury + lint clean)

---

## 🎨 Design Philosophy (Phase 16 — Quiet Luxury)

Apple Liquid Glass framework giữ ở mức **structure** (frosted bg + blur + border + hover lift), **bỏ hoàn toàn animation loop**:

❌ Không dùng: specular streak, halo pulse quanh logo, decoration blur blob hero, route-level `loading.tsx`
✅ Vẫn dùng: frosted bg + backdrop-blur, border + ring, hover lift 200-280ms spring, focus ring, StarField (landing), AmbientMesh

Triết lý: **"Premium quiet"** — UI nhường chỗ cho học viên/buổi học, không tranh giành attention. Default theme: **light** (Sáng). Force migrate user cũ qua localStorage key `poolane-theme-v2`.
