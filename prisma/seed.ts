/**
 * Poolane — Seed Data
 * Tạo dữ liệu test: 1 admin, 2 staff, 20 học viên, 3 khoá học
 *
 * Chạy: npm run db:seed
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'

// Dùng DATABASE_URL (session pooler) cho seed
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter, log: ['error'] })

// Supabase Admin client để tạo auth users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ─── Helpers ──────────────────────────────────────────────
function phoneToEmail(phone: string): string {
  return `${phone.replace(/\D/g, '')}@poolane.local`
}

async function createAuthUser(phone: string, fullName: string, password = 'Poolane@123456') {
  const email = phoneToEmail(phone)

  // Xoá nếu đã tồn tại
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers()
  const existingUser = existing.users?.find(u => u.email === email)
  if (existingUser) {
    await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  })

  if (error) throw new Error(`Auth create failed for ${phone}: ${error.message}`)
  return data.user
}

// ─── Seed ─────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting seed...\n')

  // ── Xoá dữ liệu cũ ──────────────────────────────────────
  console.log('🗑  Clearing old data...')
  // Thứ tự xoá theo dependency (foreign key)
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.studentNote.deleteMany()
  await prisma.profileChangeRequest.deleteMany()
  await prisma.practiceLog.deleteMany()
  await prisma.skillGoal.deleteMany()
  await prisma.challengeProgress.deleteMany()
  await prisma.quizAttempt.deleteMany()
  await prisma.objectiveMetric.deleteMany()
  await prisma.assessmentScore.deleteMany()
  await prisma.assessment.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.sessionRegistration.deleteMany()
  await prisma.classSession.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.refundRequest.deleteMany()
  await prisma.poolTicket.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.videoLink.deleteMany()
  await prisma.student.deleteMany()
  await prisma.course.deleteMany()
  await prisma.user.deleteMany()
  console.log('   ✓ Cleared\n')

  // ── 1. Courses ───────────────────────────────────────────
  console.log('📚 Creating courses...')
  const [ech, sai, buom] = await Promise.all([
    prisma.course.create({
      data: {
        code: 'ECH',
        name: 'Bơi Ếch',
        price: 1_600_000,
        sessionsCount: 10,
        description: 'Khoá học bơi ếch cơ bản — 10 buổi, 8 kỹ năng',
        isActive: true,
      }
    }),
    prisma.course.create({
      data: {
        code: 'SAI',
        name: 'Bơi Sải',
        price: 2_100_000,
        sessionsCount: 10,
        description: 'Khoá học bơi sải — 10 buổi, 9 kỹ năng',
        isActive: true,
      }
    }),
    prisma.course.create({
      data: {
        code: 'BUOM',
        name: 'Bơi Bướm',
        price: 3_500_000,
        sessionsCount: 10,
        description: 'Khoá học bơi bướm nâng cao — 10 buổi, 8 kỹ năng',
        isActive: true,
      }
    }),
  ])
  console.log('   ✓ Courses: ECH, SAI, BUOM\n')

  // ── 2. Admin ─────────────────────────────────────────────
  console.log('👑 Creating admin...')
  const adminAuth = await createAuthUser('0900000001', 'Nguyễn Văn Admin')
  await prisma.user.create({
    data: {
      id: adminAuth.id,
      email: phoneToEmail('0900000001'),
      phone: '0900000001',
      fullName: 'Nguyễn Văn Admin',
      role: 'admin',
      accountSource: 'staff_created',
      isActive: true,
      photoConsentAt: new Date(),
      termsAcknowledgedAt: new Date(),
    }
  })
  console.log('   ✓ Admin: 0900000001 / Poolane@123456\n')

  // ── 3. Staff ─────────────────────────────────────────────
  console.log('👥 Creating staff...')
  const staff1Auth = await createAuthUser('0900000002', 'Trần Thị Staff 1')
  const staff2Auth = await createAuthUser('0900000003', 'Lê Văn Staff 2')

  await Promise.all([
    prisma.user.create({
      data: {
        id: staff1Auth.id,
        email: phoneToEmail('0900000002'),
        phone: '0900000002',
        fullName: 'Trần Thị Staff 1',
        role: 'staff',
        accountSource: 'staff_created',
        isActive: true,
        photoConsentAt: new Date(),
        termsAcknowledgedAt: new Date(),
      }
    }),
    prisma.user.create({
      data: {
        id: staff2Auth.id,
        email: phoneToEmail('0900000003'),
        phone: '0900000003',
        fullName: 'Lê Văn Staff 2',
        role: 'staff',
        accountSource: 'staff_created',
        isActive: true,
        photoConsentAt: new Date(),
        termsAcknowledgedAt: new Date(),
      }
    }),
  ])
  console.log('   ✓ Staff: 0900000002, 0900000003 / Poolane@123456\n')

  // ── 4. Students ──────────────────────────────────────────
  console.log('🏊 Creating 20 students...')

  const studentData = [
    // Prospects (chưa đăng ký)
    { phone: '0901000001', name: 'Phạm Thị Lan',      status: 'prospect',   daysAgo: 3 },
    { phone: '0901000002', name: 'Nguyễn Minh Tuấn',  status: 'prospect',   daysAgo: 7 },
    { phone: '0901000003', name: 'Võ Thị Hoa',        status: 'prospect',   daysAgo: 1 },
    // Enrolled (đã cọc, chưa bắt đầu)
    { phone: '0901000004', name: 'Trần Văn Bình',     status: 'enrolled',   daysAgo: 5,  course: 'ECH', plan: 'A_full' },
    { phone: '0901000005', name: 'Đinh Thị Cúc',      status: 'enrolled',   daysAgo: 3,  course: 'SAI', plan: 'C_deposit' },
    // Active (đang học)
    { phone: '0901000006', name: 'Hoàng Văn Dũng',    status: 'active',     daysAgo: 20, course: 'ECH', plan: 'A_full',        sessions: 5 },
    { phone: '0901000007', name: 'Lý Thị Em',         status: 'active',     daysAgo: 25, course: 'SAI', plan: 'B_course_first', sessions: 7 },
    { phone: '0901000008', name: 'Mai Văn Phúc',      status: 'active',     daysAgo: 15, course: 'ECH', plan: 'C_deposit',      sessions: 3 },
    { phone: '0901000009', name: 'Ngô Thị Giang',     status: 'active',     daysAgo: 30, course: 'BUOM', plan: 'A_full',        sessions: 6 },
    { phone: '0901000010', name: 'Phan Minh Hải',     status: 'active',     daysAgo: 18, course: 'SAI', plan: 'A_full',         sessions: 4 },
    // Extension (buổi 10+, đang ôn)
    { phone: '0901000011', name: 'Quách Thị Iris',    status: 'extension',  daysAgo: 45, course: 'ECH', plan: 'A_full',         sessions: 12 },
    { phone: '0901000012', name: 'Rồng Văn Kim',      status: 'extension',  daysAgo: 40, course: 'SAI', plan: 'A_full',         sessions: 11 },
    // Completed (đã tốt nghiệp)
    { phone: '0901000013', name: 'Sơn Thị Linh',      status: 'completed',  daysAgo: 60, course: 'ECH', plan: 'A_full',         sessions: 10 },
    { phone: '0901000014', name: 'Tâm Văn Minh',      status: 'completed',  daysAgo: 90, course: 'SAI', plan: 'B_course_first',  sessions: 10 },
    // Inactive (vắng lâu)
    { phone: '0901000015', name: 'Ứng Thị Nga',       status: 'inactive',   daysAgo: 50, course: 'ECH', plan: 'A_full',          sessions: 6 },
    { phone: '0901000016', name: 'Vinh Minh Phương',  status: 'inactive',   daysAgo: 35, course: 'SAI', plan: 'C_deposit',        sessions: 3 },
    // Mixed — có nhiều khoá
    { phone: '0901000017', name: 'Xuyên Thị Quỳnh',  status: 'active',     daysAgo: 22, course: 'SAI', plan: 'A_full',           sessions: 5 },
    { phone: '0901000018', name: 'Yến Văn Rồng',      status: 'active',     daysAgo: 12, course: 'ECH', plan: 'A_full',           sessions: 2 },
    { phone: '0901000019', name: 'Zoom Thị Sen',      status: 'prospect',   daysAgo: 2 },
    { phone: '0901000020', name: 'An Văn Tài',        status: 'enrolled',   daysAgo: 4,  course: 'BUOM', plan: 'A_full' },
  ]

  const courseMap: Record<string, { id: string; price: number }> = {
    ECH: { id: ech.id, price: 1_600_000 },
    SAI: { id: sai.id, price: 2_100_000 },
    BUOM: { id: buom.id, price: 3_500_000 },
  }

  for (let i = 0; i < studentData.length; i++) {
    const s = studentData[i]
    const index = String(i + 1).padStart(4, '0')
    const studentCode = `POLA-2025-${index}`
    const lastAttended = s.sessions
      ? new Date(Date.now() - (s.daysAgo - 2) * 86400000)
      : null

    const authUser = await createAuthUser(s.phone, s.name)

    const user = await prisma.user.create({
      data: {
        id: authUser.id,
        email: phoneToEmail(s.phone),
        phone: s.phone,
        fullName: s.name,
        role: 'student',
        accountSource: i < 3 ? 'online_signup' : 'staff_created',
        isActive: s.status !== 'refunded',
        ward: 'Phường Bến Nghé',
        district: 'Quận 1',
        province: 'TP. Hồ Chí Minh',
        photoConsentAt: new Date(),
        refundPolicyAcknowledgedAt: new Date(),
        termsAcknowledgedAt: new Date(),
        createdAt: new Date(Date.now() - s.daysAgo * 86400000),
      }
    })

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        studentCode,
        status: s.status as 'prospect' | 'enrolled' | 'active' | 'extension' | 'completed' | 'inactive' | 'refunded',
        lastAttendedAt: lastAttended,
        createdAt: new Date(Date.now() - s.daysAgo * 86400000),
      }
    })

    // Tạo enrollment nếu có course
    if (s.course && s.plan) {
      const course = courseMap[s.course]
      const deposit = s.plan === 'A_full' || s.plan === 'B_course_first'
        ? course.price
        : Math.floor(course.price * 0.3)

      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          paymentPlan: s.plan as 'A_full' | 'B_course_first' | 'C_deposit',
          depositAmount: deposit,
          totalPaid: deposit,
          status: s.status === 'completed'
            ? 'completed'
            : s.status === 'extension'
              ? 'extension'
              : 'active',
          startedAt: new Date(Date.now() - (s.daysAgo - 1) * 86400000),
          graduationDate: s.status === 'completed'
            ? new Date(Date.now() - 5 * 86400000)
            : null,
          extensionSessionsUsed: s.status === 'extension' ? (s.sessions ?? 0) - 10 : 0,
          enrolledAt: new Date(Date.now() - s.daysAgo * 86400000),
        }
      })

      // Tạo pool ticket
      await prisma.poolTicket.create({
        data: {
          studentId: student.id,
          ticketType: 'first',
          totalSessions: 10,
          maxSessions: 12,
          sessionsUsed: s.sessions ?? 0,
          pricePaid: 1_300_000,
          isActive: s.status !== 'completed' && s.status !== 'refunded',
          purchasedAt: new Date(Date.now() - s.daysAgo * 86400000),
        }
      })

      // Tạo payment record
      await prisma.payment.create({
        data: {
          studentId: student.id,
          amount: deposit,
          type: 'course_fee',
          referenceType: 'enrollment',
          referenceId: enrollment.id,
          paymentMethod: 'cash',
          recordedBy: staff1Auth.id,
          recordedAt: new Date(Date.now() - s.daysAgo * 86400000),
        }
      })
    }

    process.stdout.write(`.`)
  }

  console.log(`\n   ✓ 20 students created\n`)

  // ── Summary ──────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.student.count(),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.poolTicket.count(),
  ])

  console.log('✅ Seed complete!')
  console.log(`   Users: ${counts[0]} | Students: ${counts[1]} | Courses: ${counts[2]}`)
  console.log(`   Enrollments: ${counts[3]} | Pool Tickets: ${counts[4]}`)
  console.log('\n📋 Test credentials (password: Poolane@123456):')
  console.log('   Admin: 0900000001')
  console.log('   Staff: 0900000002, 0900000003')
  console.log('   Students: 0901000001 → 0901000020')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
