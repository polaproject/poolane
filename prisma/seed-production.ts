/**
 * Poolane — Production Seed (Fresh Start)
 *
 * Tạo dữ liệu TỐI THIỂU cho production go-live:
 *   - 3 khoá học cố định (ECH/SAI/BUOM) — BẮT BUỘC, không có app sẽ vỡ
 *   - 8 FAQ entries (không có prefix [DEMO])
 *   - 1 admin user (owner cung cấp phone + password qua env)
 *
 * KHÔNG seed: students, staff, sessions, products, vouchers — owner tự tạo qua admin UI sau go-live.
 *
 * Chạy:
 *   ADMIN_PHONE=0901234567 ADMIN_PASSWORD=YourStrongPass ADMIN_FULL_NAME="Nguyen Van A" \
 *   npx dotenv -e .env.local -- npx tsx prisma/seed-production.ts
 *
 * Idempotent: chạy lại nhiều lần không trùng (upsert).
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter, log: ['error'] })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function phoneToEmail(phone: string): string {
  return `${phone.replace(/\D/g, '')}@poolane.local`
}

async function main() {
  console.log('\n🌟 POOLANE PRODUCTION SEED — Fresh start\n')

  // ─── Validate env ───
  const adminPhone = process.env.ADMIN_PHONE
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminFullName = process.env.ADMIN_FULL_NAME

  if (!adminPhone || !adminPassword || !adminFullName) {
    console.error('❌ Thiếu env: ADMIN_PHONE, ADMIN_PASSWORD, ADMIN_FULL_NAME')
    console.error('   Vd: ADMIN_PHONE=0901234567 ADMIN_PASSWORD=ABC@xyz123 ADMIN_FULL_NAME="Tên Owner" npm run db:seed-production')
    process.exit(1)
  }
  if (adminPassword.length < 12) {
    console.error('❌ ADMIN_PASSWORD phải ≥12 ký tự')
    process.exit(1)
  }

  // ─── 1. Courses (BẮT BUỘC) ───
  console.log('📚 Courses...')
  const courses = [
    { code: 'ECH', name: 'Bơi Ếch', price: 1_600_000, sessionsCount: 10, description: 'Khoá Bơi Ếch 10 buổi — kỹ thuật cơ bản dành cho người mới hoàn toàn.', isActive: true },
    { code: 'SAI', name: 'Bơi Sải', price: 2_100_000, sessionsCount: 10, description: 'Khoá Bơi Sải 10 buổi — kỹ thuật cao cấp với thở 2 bên và đập chân hiệu quả.', isActive: true },
    { code: 'BUOM', name: 'Bơi Bướm', price: 3_500_000, sessionsCount: 10, description: 'Khoá Bơi Bướm 10 buổi — kỹ thuật nâng cao, yêu cầu nền tảng vững.', isActive: true },
  ]
  for (const c of courses) {
    await prisma.course.upsert({
      where: { code: c.code },
      create: c,
      update: { name: c.name, price: c.price, sessionsCount: c.sessionsCount, description: c.description, isActive: c.isActive },
    })
  }
  console.log(`   ✓ ${courses.length} courses\n`)

  // ─── 2. Admin user ───
  console.log('👤 Admin user...')
  const adminEmail = phoneToEmail(adminPhone)

  // Xoá auth user cũ nếu trùng email
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers()
  const existingAuth = existing.users?.find(u => u.email === adminEmail)
  if (existingAuth) {
    await supabaseAdmin.auth.admin.deleteUser(existingAuth.id)
    console.log(`   ⚠️  Đã xoá auth user cũ với email ${adminEmail}`)
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { full_name: adminFullName, role: 'admin' },
  })
  if (authError) throw new Error(`Auth create failed: ${authError.message}`)
  const authUserId = authData.user!.id

  // Upsert User record (link với auth)
  await prisma.user.upsert({
    where: { id: authUserId },
    create: {
      id: authUserId,
      email: adminEmail,
      phone: adminPhone,
      fullName: adminFullName,
      role: 'admin',
      accountSource: 'staff_created',
      isActive: true,
      termsAcknowledgedAt: new Date(),
    },
    update: {
      phone: adminPhone,
      fullName: adminFullName,
      role: 'admin',
      isActive: true,
    },
  })
  console.log(`   ✓ Admin: ${adminPhone} (${adminFullName})\n`)

  // ─── 3. FAQs (production version — bỏ prefix [DEMO]) ───
  console.log('❓ FAQs...')
  await prisma.faq.deleteMany({}) // fresh start nên clear all
  const faqs = [
    { category: 'Khoá học', q: 'Tôi chưa từng biết bơi có học được không?', a: 'Hoàn toàn được! Khoá Bơi Ếch dành cho người mới hoàn toàn. Buổi 1-3 chỉ làm quen với nước, không yêu cầu kỹ thuật.' },
    { category: 'Khoá học', q: 'Mỗi khoá học mấy buổi?', a: 'Mỗi khoá 10 buổi chính thức. Nếu chưa đạt sau buổi 10, bạn được học ôn luyện thêm — chỉ trả vé bơi, không tốn học phí.' },
    { category: 'Khoá học', q: 'Có thể học 2 khoá song song không?', a: 'Có thể. Tuy nhiên mỗi buổi học chỉ tập trung 1 kỹ năng. Nếu đăng ký 2 khoá cùng 1 buổi, hệ thống yêu cầu bạn chọn 1.' },
    { category: 'Học phí', q: 'Có những phương án thanh toán nào?', a: 'A. Đóng toàn bộ (cọc 100%); B. Học phí trước, vé bơi tại buổi 1; C. Cọc 30% + 100% vé bơi, đóng nốt trước buổi 2.' },
    { category: 'Học phí', q: 'Vé bơi là gì?', a: 'Vé bơi tách biệt học phí. Vé lần đầu 1.300.000đ cho 10 buổi (tối đa 12). Lần 2 trở đi bạn tự mua từ 65k/buổi.' },
    { category: 'Hoàn tiền', q: 'Chính sách hoàn tiền thế nào?', a: 'Hoàn theo bậc số buổi đã học: 0 buổi=50%, 1-2=40%, 3-4=30%, 5-6=20%, 7+=10%. Vé bơi hoàn 80% giá trị buổi chưa dùng. Hạn yêu cầu: 30 ngày kể từ buổi học cuối.' },
    { category: 'Tài khoản', q: 'Quên mật khẩu thì làm sao?', a: 'Vào trang "Quên mật khẩu", nhập SĐT đăng ký. Lớp sẽ liên hệ qua Zalo để xác minh và cung cấp mật khẩu mới trong 24h.' },
    { category: 'Khác', q: 'Lớp ghi hình video bơi của tôi để làm gì?', a: 'Để phân tích kỹ thuật và giúp bạn cải thiện. Video chỉ chia sẻ với bạn (không công khai), trừ khi bạn tick đồng ý dùng cho marketing.' },
  ]
  for (let i = 0; i < faqs.length; i++) {
    const f = faqs[i]
    await prisma.faq.create({
      data: { question: f.q, answer: f.a, category: f.category, orderIndex: i, isActive: true },
    })
  }
  console.log(`   ✓ ${faqs.length} FAQs\n`)

  // ─── Done ───
  console.log('✅ Production seed complete!\n')
  console.log(`   Admin login: ${adminPhone} / ${adminPassword}`)
  console.log(`   Đăng nhập tại: ${process.env.NEXT_PUBLIC_APP_URL ?? 'https://poolane.vn'}/login\n`)
  console.log('   Bước tiếp theo (qua admin UI):')
  console.log('   - Tạo 2 staff (/admin/students hoặc tab Staff)')
  console.log('   - Tạo products shop (/admin/shop/products)')
  console.log('   - Tạo vouchers (/admin/vouchers)')
  console.log('   - Tạo session schedule (/admin/schedule)\n')
}

main()
  .catch(err => {
    console.error('\n❌ Seed FAILED:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
