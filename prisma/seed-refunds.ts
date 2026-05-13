/**
 * Idempotent seed cho refund requests mẫu để test UI.
 * Chạy: npx dotenv -e .env.local -- npx tsx prisma/seed-refunds.ts
 *
 * Tạo 2 yêu cầu:
 *   1. PENDING — Học viên 0901000007 (Lý Thị Em, đã học 7 buổi SAI, vé còn vài buổi)
 *      → để test flow Duyệt/Từ chối
 *   2. APPROVED — Học viên 0901000008 (Mai Văn Phúc, đã học 3 buổi ECH)
 *      → để test flow Đánh dấu đã chuyển
 *
 * Có thể chạy nhiều lần — sẽ xoá refund cũ của 2 HV này rồi tạo lại.
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
  console.log('💸 Seeding refund requests...\n')

  // Tìm admin để làm requestedBy
  const admin = await prisma.user.findFirst({ where: { role: 'admin' }, select: { id: true } })
  if (!admin) {
    console.error('❌ Không tìm thấy admin. Chạy npm run db:seed trước.')
    process.exit(1)
  }

  // ─── Refund 1: PENDING — Lý Thị Em (0901000007) ───
  const student1 = await prisma.student.findFirst({
    where: { user: { phone: '0901000007' } },
    include: {
      user: { select: { fullName: true } },
      enrollments: { where: { status: { in: ['active', 'extension', 'completed'] } }, take: 1 },
      poolTickets: { where: { isActive: true }, take: 1 },
    }
  })

  if (!student1) {
    console.error('❌ Không tìm thấy HV 0901000007 (Lý Thị Em)')
    process.exit(1)
  }

  // Xoá refund cũ của HV này (để idempotent)
  await prisma.refundRequest.deleteMany({ where: { studentId: student1.id } })

  const enrollment1 = student1.enrollments[0]
  const ticket1 = student1.poolTickets[0]

  if (!enrollment1 || !ticket1) {
    console.error('❌ HV 0901000007 không có enrollment hoặc vé active. Chạy npm run db:seed lại?')
    process.exit(1)
  }

  // Tính số buổi đã học (đếm attendance present)
  const attended1 = await prisma.attendance.count({
    where: { studentId: student1.id, status: 'present' }
  })

  // Tỉ lệ hoàn theo CLAUDE.md §7.5
  const courseRate1 = attended1 === 0 ? 0.5
    : attended1 <= 2 ? 0.4
    : attended1 <= 4 ? 0.3
    : attended1 <= 6 ? 0.2
    : 0.1

  const courseAmount1 = Math.floor(enrollment1.totalPaid * courseRate1)
  const remainingTicket1 = Math.max(0, Math.min(ticket1.totalSessions, 10) - ticket1.sessionsUsed)
  const ticketAmount1 = Math.floor(remainingTicket1 * 130_000 * 0.8)

  await prisma.refundRequest.create({
    data: {
      studentId: student1.id,
      enrollmentId: enrollment1.id,
      poolTicketId: ticket1.id,
      includeCourseRefund: true,
      includeTicketRefund: true,
      courseSessionsAttended: attended1,
      courseRefundRate: courseRate1,
      courseRefundAmount: courseAmount1,
      ticketSessionsUsed: ticket1.sessionsUsed,
      ticketRefundAmount: ticketAmount1,
      totalRefundAmount: courseAmount1 + ticketAmount1,
      reason: 'work',
      reasonText: 'Tôi chuyển công tác xa, không thể tiếp tục học. Mong lớp hỗ trợ hoàn tiền.',
      status: 'pending',
      requestedBy: student1.userId,
    }
  })

  console.log(`   ✓ PENDING: ${student1.user.fullName}`)
  console.log(`     - Học phí: ${(courseAmount1).toLocaleString('vi-VN')}đ (${Math.round(courseRate1 * 100)}% × ${attended1} buổi)`)
  console.log(`     - Vé bơi:  ${(ticketAmount1).toLocaleString('vi-VN')}đ (${remainingTicket1} buổi còn × 80%)`)
  console.log(`     - Tổng:    ${(courseAmount1 + ticketAmount1).toLocaleString('vi-VN')}đ\n`)

  // ─── Refund 2: APPROVED — Mai Văn Phúc (0901000008) ───
  const student2 = await prisma.student.findFirst({
    where: { user: { phone: '0901000008' } },
    include: {
      user: { select: { fullName: true } },
      enrollments: { where: { status: { in: ['active', 'extension', 'completed'] } }, take: 1 },
    }
  })

  if (!student2) {
    console.error('❌ Không tìm thấy HV 0901000008 (Mai Văn Phúc)')
    process.exit(1)
  }

  await prisma.refundRequest.deleteMany({ where: { studentId: student2.id } })

  const enrollment2 = student2.enrollments[0]
  if (!enrollment2) {
    console.error('❌ HV 0901000008 không có enrollment active')
    process.exit(1)
  }

  const attended2 = await prisma.attendance.count({
    where: { studentId: student2.id, status: 'present' }
  })

  const courseRate2 = attended2 === 0 ? 0.5
    : attended2 <= 2 ? 0.4
    : attended2 <= 4 ? 0.3
    : attended2 <= 6 ? 0.2
    : 0.1
  const courseAmount2 = Math.floor(enrollment2.totalPaid * courseRate2)

  await prisma.refundRequest.create({
    data: {
      studentId: student2.id,
      enrollmentId: enrollment2.id,
      includeCourseRefund: true,
      includeTicketRefund: false,
      courseSessionsAttended: attended2,
      courseRefundRate: courseRate2,
      courseRefundAmount: courseAmount2,
      ticketSessionsUsed: 0,
      ticketRefundAmount: 0,
      totalRefundAmount: courseAmount2,
      reason: 'health',
      reasonText: 'Tôi bị chấn thương đầu gối, bác sĩ chỉ định nghỉ tập 3 tháng.',
      status: 'approved',
      requestedBy: student2.userId,
      processedAt: new Date(Date.now() - 86400000), // hôm qua
      processedBy: admin.id,
    }
  })

  console.log(`   ✓ APPROVED: ${student2.user.fullName}`)
  console.log(`     - Học phí: ${(courseAmount2).toLocaleString('vi-VN')}đ (${Math.round(courseRate2 * 100)}% × ${attended2} buổi)`)
  console.log(`     - Đã duyệt hôm qua, chờ chuyển khoản\n`)

  console.log('✅ Done. Vào /admin/finance/refunds để test.\n')
  console.log('📋 Flow test:')
  console.log('   1. Tab "Chờ duyệt"     → ${student1.user.fullName} → Duyệt hoặc Từ chối')
  console.log('   2. Tab "Đã duyệt"      → ${student2.user.fullName} → Đánh dấu đã chuyển (nhập mã giao dịch)')
  console.log('   3. Sau khi chuyển     → /admin/finance dashboard thấy Payment âm (type=refund)\n')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
