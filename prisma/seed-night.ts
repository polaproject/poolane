/**
 * Seed thêm cho các tính năng làm trong đêm sprint
 * Chạy: npx dotenv -e .env.local -- npx tsx prisma/seed-night.ts
 *
 * Bao gồm:
 *   - 3 vouchers mẫu
 *   - 5 video Drive links mẫu cho HV active
 *   - 8 session photos cho buổi gần đây (placeholder URL từ picsum)
 *   - 8 FAQ entries
 *   - 1 improvement_session_pack mẫu
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter, log: ['error'] })

async function main() {
  console.log('🌙 Seeding night extras...\n')

  const admin = await prisma.user.findFirst({ where: { role: 'admin' }, select: { id: true } })
  if (!admin) {
    console.error('❌ Chưa có admin. Chạy npm run db:seed trước.')
    process.exit(1)
  }

  // ─── Vouchers ───
  console.log('🎟️  Vouchers...')
  await prisma.voucher.deleteMany({ where: { code: { in: ['WELCOME10', 'GIAM50K', 'TANGVE'] } } })
  await prisma.voucher.createMany({
    data: [
      {
        code: 'WELCOME10',
        description: 'Giảm 10% cho học viên đăng ký mới',
        discountType: 'percent',
        discountValue: 10,
        appliesTo: 'any',
        maxUses: 100,
        validUntil: new Date(Date.now() + 90 * 86400000),
        isActive: true,
      },
      {
        code: 'GIAM50K',
        description: 'Giảm 50.000đ trên đơn hàng shop từ 200.000đ',
        discountType: 'fixed',
        discountValue: 50_000,
        appliesTo: 'shop_only',
        maxUses: 50,
        isActive: true,
      },
      {
        code: 'TANGVE',
        description: 'Tặng 1 buổi vé bơi miễn phí',
        discountType: 'free_pool_session',
        discountValue: 1,
        appliesTo: 'any',
        maxUses: 20,
        isActive: true,
      },
    ]
  })
  console.log('   ✓ 3 vouchers\n')

  // ─── FAQs ───
  console.log('❓ FAQs...')
  await prisma.faq.deleteMany({ where: { question: { startsWith: '[DEMO]' } } })
  const faqs = [
    { category: 'Khoá học', q: '[DEMO] Tôi chưa từng biết bơi có học được không?', a: 'Hoàn toàn được! Khoá Bơi Ếch dành cho người mới hoàn toàn. Buổi 1-3 chỉ làm quen với nước, không yêu cầu kỹ thuật.' },
    { category: 'Khoá học', q: '[DEMO] Mỗi khoá học mấy buổi?', a: 'Mỗi khoá 10 buổi chính thức. Nếu chưa đạt sau buổi 10, bạn được học ôn luyện thêm — chỉ trả vé bơi, không tốn học phí.' },
    { category: 'Khoá học', q: '[DEMO] Có thể học 2 khoá song song không?', a: 'Có thể. Tuy nhiên mỗi buổi học chỉ tập trung 1 kỹ năng. Nếu đăng ký 2 khoá cùng 1 buổi, hệ thống yêu cầu bạn chọn 1.' },
    { category: 'Học phí', q: '[DEMO] Có những phương án thanh toán nào?', a: 'A. Đóng toàn bộ (cọc 100%); B. Học phí trước, vé bơi tại buổi 1; C. Cọc 30% + 100% vé bơi, đóng nốt trước buổi 2.' },
    { category: 'Học phí', q: '[DEMO] Vé bơi là gì?', a: 'Vé bơi tách biệt học phí. Vé lần đầu 1.300.000đ cho 10 buổi (tối đa 12). Lần 2 trở đi bạn tự mua từ 65k/buổi.' },
    { category: 'Hoàn tiền', q: '[DEMO] Chính sách hoàn tiền thế nào?', a: 'Hoàn theo bậc số buổi đã học: 0 buổi=50%, 1-2=40%, 3-4=30%, 5-6=20%, 7+=10%. Vé bơi hoàn 80% giá trị buổi chưa dùng. Hạn yêu cầu: 30 ngày kể từ buổi học cuối.' },
    { category: 'Hoàn tiền', q: '[DEMO] Quên mật khẩu thì làm sao?', a: 'Vào trang "Quên mật khẩu", nhập SĐT đăng ký. Lớp sẽ liên hệ qua Zalo để xác minh và cung cấp mật khẩu mới trong 24h.' },
    { category: 'Khác', q: '[DEMO] Lớp ghi hình video bơi của tôi để làm gì?', a: 'Để phân tích kỹ thuật và giúp bạn cải thiện. Video chỉ chia sẻ với bạn (không công khai), trừ khi bạn tick đồng ý dùng cho marketing.' },
  ]
  for (let i = 0; i < faqs.length; i++) {
    const f = faqs[i]
    await prisma.faq.create({
      data: { question: f.q, answer: f.a, category: f.category, orderIndex: i, isActive: true }
    })
  }
  console.log(`   ✓ ${faqs.length} FAQs\n`)

  // ─── Video links ───
  console.log('📹 Video links...')
  const activeStudents = await prisma.student.findMany({
    where: { status: 'active' },
    include: { user: { select: { fullName: true } } },
    take: 5,
  })
  const sessions = await prisma.classSession.findMany({
    where: { date: { lt: new Date() } },
    orderBy: { date: 'desc' },
    take: 5,
  })
  await prisma.videoLink.deleteMany({
    where: { caption: { startsWith: '[DEMO]' } }
  })
  let videoCount = 0
  for (let i = 0; i < activeStudents.length && i < sessions.length; i++) {
    await prisma.videoLink.create({
      data: {
        studentId: activeStudents[i].id,
        sessionId: sessions[i].id,
        driveUrl: 'https://drive.google.com/file/d/1abc123_demo_placeholder/preview',
        caption: `[DEMO] Phân tích kỹ thuật bơi - ${activeStudents[i].user.fullName}`,
        createdBy: admin.id,
      }
    })
    videoCount++
  }
  console.log(`   ✓ ${videoCount} videos (placeholder URLs)\n`)

  // ─── Session photos ───
  console.log('📸 Session photos...')
  await prisma.sessionPhoto.deleteMany({ where: { caption: { startsWith: '[DEMO]' } } })
  const photoUrls = [
    'https://picsum.photos/seed/poolane1/800/800',
    'https://picsum.photos/seed/poolane2/800/800',
    'https://picsum.photos/seed/poolane3/800/800',
    'https://picsum.photos/seed/poolane4/800/800',
    'https://picsum.photos/seed/poolane5/800/800',
    'https://picsum.photos/seed/poolane6/800/800',
    'https://picsum.photos/seed/poolane7/800/800',
    'https://picsum.photos/seed/poolane8/800/800',
  ]
  for (let i = 0; i < photoUrls.length; i++) {
    await prisma.sessionPhoto.create({
      data: {
        photoUrl: photoUrls[i],
        caption: `[DEMO] Khoảnh khắc buổi học ${i + 1}`,
        visibleTo: 'all_students',
        uploadedBy: admin.id,
        sessionId: sessions[i % sessions.length]?.id ?? null,
      }
    })
  }
  console.log(`   ✓ ${photoUrls.length} photos (placeholder URLs)\n`)

  // ─── Improvement pack mẫu ───
  console.log('🏊 Improvement pack...')
  if (activeStudents[0]) {
    await prisma.improvementSessionPack.deleteMany({ where: { studentId: activeStudents[0].id } })
    await prisma.improvementSessionPack.create({
      data: {
        studentId: activeStudents[0].id,
        sessionsPurchased: 5,
        sessionsUsed: 1,
        expiresAt: new Date(Date.now() + 60 * 86400000),
      }
    })
    console.log('   ✓ 1 improvement pack mẫu\n')
  }

  console.log('✅ Done! Test các trang mới:')
  console.log('   /admin/vouchers → 3 vouchers (WELCOME10/GIAM50K/TANGVE)')
  console.log('   /admin/photos → 8 ảnh demo')
  console.log('   /admin/quizzes/new → tạo quiz mới')
  console.log('   /faq → 8 FAQ entries')
  console.log('   /student/photos → 8 ảnh demo')
  console.log('   /student/videos (login 0901000006 hoặc HV active đầu) → 1 video demo')
}

main()
  .catch(e => {
    console.error('❌ Seed night failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
