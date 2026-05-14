# Setup Sau Khi Thức — Đêm Sprint

Đêm qua AI build feature-complete code. Mọi thứ chạy được với fallback no-op. Khi bạn thức dậy, làm theo các bước sau để bật full features:

---

## ⭐ Setup tài khoản ngân hàng (cho VietQR thanh toán)

Thêm vào `.env.local`:

```env
BANK_BIN=970436                          # 970436=Vietcombank, xem các mã khác bên dưới
BANK_ACCOUNT_NO=0011234567890           # Số tài khoản nhận
BANK_ACCOUNT_NAME=NGUYEN VAN OWNER      # Tên chủ TK (KHÔNG DẤU, VIẾT HOA)
BANK_DISPLAY_NAME=Vietcombank           # Tên hiển thị
```

**BIN code các ngân hàng phổ biến:**
- Vietcombank: `970436`
- Techcombank: `970407`
- VPBank: `970432`
- MB Bank: `970422`
- ACB: `970416`
- TPBank: `970423`
- BIDV: `970418`
- VietinBank: `970415`
- Sacombank: `970403`
- OCB: `970448`

Restart dev server → khi HV mua hàng → trang `/student/shop/orders/[id]/pay` hiện QR có thông tin TK thật → quét bằng app banking → tiền vào TK Poolane.

**Admin đối chiếu**: vào sao kê tìm nội dung `POLA<8chars>` → bấm "✓ Xác nhận đã nhận tiền" trên `/admin/shop/orders` → hệ thống tự tạo Payment + paid order.

---

## 1. Restart dev server

```powershell
# Stop old dev (nếu còn chạy):
Get-Process -Name node | Stop-Process -Force -ErrorAction SilentlyContinue
npm run dev
```

DB đã được apply schema mới (PasswordResetRequest, PushSubscription, SelfAssessment, ImprovementSessionPack) qua `prisma db push`. Không cần migrate gì.

---

## 2. Tạo Supabase Storage bucket (BẮT BUỘC cho photo upload)

Mở [Supabase Dashboard](https://supabase.com/dashboard) → project Poolane → **Storage** → **New bucket**:

- **Name**: `poolane-public`
- **Public bucket**: ✅ tick
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`

Sau đó vào **Policies** của bucket → thêm:
- Policy: **Allow public read** — `SELECT` với expression `true`
- Policy: **Allow authenticated upload** — `INSERT` với expression `auth.role() = 'authenticated'`

Nếu không tạo bucket: photo upload sẽ trả lỗi friendly "Bucket chưa tồn tại". Mọi tính năng khác vẫn chạy.

---

## 3. Setup Resend (cho email biên lai, sinh nhật, hoàn tiền)

1. Sign up tại [resend.com](https://resend.com) (free tier 3.000 email/tháng)
2. Verify domain `poolane.vn` qua DNS records:
   - Thêm 3 records (MX/TXT/CNAME) vào Matbao DNS theo hướng dẫn của Resend
   - Đợi 5-30 phút để propagate
3. Tạo API key tại resend.com → API Keys → **Create API Key**
4. Thêm vào `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   EMAIL_FROM=support@poolane.vn
   ```
5. Restart dev server

**Test**: ghi 1 payment cho HV có email thật → check inbox + Resend dashboard logs.

---

## 4. Setup Web Push (VAPID keys)

Gen 1 cặp VAPID keys:

```bash
npx web-push generate-vapid-keys
```

Output sẽ có 2 keys. Thêm vào `.env.local`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BC...your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:support@poolane.vn
```

Restart dev server. HV vào `/student/profile` → section "Đồng ý & Bảo mật" → nút "Bật thông báo" sẽ hoạt động.

---

## 5. Cron jobs

`vercel.json` đã có 4 cron jobs sẵn sàng. Chỉ chạy khi deploy lên Vercel.

**Test thủ công local** (cần `CRON_SECRET` env hoặc bỏ qua trong dev):
```bash
# Trong dev (không cần secret):
curl http://localhost:3000/api/cron/birthday
curl http://localhost:3000/api/cron/pulse-check
curl http://localhost:3000/api/cron/reconciliation
curl http://localhost:3000/api/cron/absence-reminder
```

**Trên production**: Vercel tự gọi endpoints này theo schedule.

Setup `CRON_SECRET` cho production trong Vercel env vars:
```
CRON_SECRET=<random 32 chars, gen bằng `openssl rand -hex 32`>
```

---

## 6. Test các tính năng mới đêm nay

Seed data đã có sẵn. Login bằng admin `0900000001 / Poolane@123456`.

| Tính năng | URL |
|---|---|
| Lịch học redesigned | `/admin/schedule` (xem HV inline trong từng buổi) |
| Sidebar nhóm + collapse | (tự nhiên ở mọi trang dashboard) |
| Public landing | `/` (chưa login) |
| Public courses | `/courses` |
| Public FAQ | `/faq` (8 FAQ demo) |
| Public privacy | `/privacy` |
| Photo upload (sản phẩm) | `/admin/shop/products/new` → upload ảnh |
| Photo upload (blog cover) | `/admin/blog/new` → upload bìa |
| Voucher admin | `/admin/vouchers` (3 voucher demo: WELCOME10, GIAM50K, TANGVE) |
| Video Drive admin | `/staff/videos` hoặc `/admin/videos` |
| Video student | `/student/videos` (login HV `0901000006`) |
| Album ảnh admin | `/admin/photos` (8 ảnh demo) |
| Album ảnh student | `/student/photos` |
| Admin tạo quiz | `/admin/quizzes/new` |
| Email biên lai | Ghi 1 payment → check log dev server (no-op nếu chưa setup Resend) |
| Cron birthday | `curl localhost:3000/api/cron/birthday` |

---

## 7. Các tính năng cần env vars để chạy thật

| Tính năng | Env cần | Hành vi nếu thiếu |
|---|---|---|
| Photo upload | Supabase Storage bucket | Trả lỗi friendly "Bucket chưa tồn tại" |
| Email gửi | `RESEND_API_KEY` | No-op + log warning |
| Web Push subscribe | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Hiển thị "Trình duyệt không hỗ trợ hoặc VAPID chưa setup" |
| Cron production | `CRON_SECRET` | Trong dev mode bypass auth — production trả 401 |

---

## 8. Việc còn lại không làm đêm nay

- Deploy Vercel + trỏ domain poolane.vn (cần access Vercel account của bạn)
- Combo 3 khoá pricing (chưa chốt giá)
- Mobile responsive audit (cần thiết bị thật)
- AI features stretch (phase 12 roadmap)

---

Mọi câu hỏi paste log lỗi vào chat, AI fix.
