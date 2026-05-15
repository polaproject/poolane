# Poolane

> Hệ thống quản lý lớp dạy bơi cho người lớn — production tại https://poolane.vn

## Brand

Poolane là 1 trong 3 brand của **Pola Project** — tên "Pola" lấy từ Polaris (sao Bắc Đẩu) — luôn đứng yên dẫn đường:

- 🏊 **Poolane** — Bơi lội (production)
- 📚 Polang — Ngoại ngữ (future)
- 📊 Polata — Phân tích dữ liệu (future)

Triết lý: *"Dạy bơi không chỉ để bơi"* — kết nối thân với tâm, cộng đồng người trưởng thành cùng giải toả áp lực.

## Stack

- **Frontend**: Next.js 16 App Router + TypeScript strict + Tailwind v4
- **DB**: PostgreSQL via Supabase Singapore + Prisma 7
- **Deploy**: Vercel Pro region `sin1`
- **Payment**: VietQR (TPBank `22282138888`) + Sepay webhook auto-confirm
- **Email**: Resend (domain polaproject.com verified)
- **Auth**: Supabase Auth (phone + password, no OTP)
- **Storage**: Supabase Storage bucket `poolane-public` + Google Drive (videos)

## SSOT (Single Source of Truth)

| File | Mục đích |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Project SSOT — quy ước, phases, schema, business rules, operational principles |
| [brand-guideline.md](brand-guideline.md) | Brand identity, color, typography, design discipline (Quiet Luxury) |
| [SETUP-AFTER-WAKE.md](SETUP-AFTER-WAKE.md) | Operational reference — env vars, infra, troubleshooting |

## Development

```bash
npm install                    # postinstall auto-run `prisma generate`
npm run dev                    # http://localhost:3000
npm run build                  # Production build (test trước deploy)
npm run lint                   # ESLint — kỳ vọng 0 errors + 0 warnings (Phase 16.1 baseline)

# Database
npm run db:push                # Push schema to Supabase (no migration)
npm run db:studio              # Prisma Studio — browse/edit data
npm run db:seed-production     # Seed minimum (admin + 3 courses + 8 FAQs) — chạy 1 lần
npm run db:seed-demo           # Seed test accounts + data
DELETE_DEMO=1 npm run db:seed-demo  # Cleanup demo data
```

## Demo Accounts (Synthetic Monitoring)

Demo luôn live trên production, chạy luồng thật, exclude khỏi analytics:

```
Staff:    0900000099 / PoolaneDemo@123
Student:  0900000088 / PoolaneDemo@123  (vé 8 buổi, enrolled khoá ECH)
```

- API DELETE block 403 (protected)
- Cron daily 5:30 AM VN tự re-create nếu missing
- Auto-exclude khỏi 7 analytics queries qua `getDemoStudentIds()` helper

## Design Philosophy

**Phase 16 — Quiet Luxury:** Apple Liquid Glass framework giữ ở mức structure (frosted + blur + border + hover lift), bỏ hoàn toàn animation loop (specular streak, halo pulse, decoration blob). UI nhường chỗ cho content. Default theme: `light`.

## License

Private — Pola Project © 2026
