/**
 * Poolane — Seed Demo Data (test sau khi launch)
 *
 * Tạo tối thiểu dữ liệu để owner test các trang student/staff/admin
 * mà không phải tạo thủ công qua UI.
 *
 * Tạo:
 *   - 1 staff demo (số ĐT 0900000099)
 *   - 1 student demo (số ĐT 0900000088, fullName "Học Viên Demo")
 *     + Pool ticket 10 buổi
 *     + Enrollment khoá ECH (active)
 *   - 6 class sessions cho 2 tuần tới (mix sáng/chiều)
 *   - 1 session registration approved (cho session đầu)
 *   - 1 session registration pending (cho session sau)
 *
 * Chạy:
 *   npx dotenv -e .env.local -- npx tsx prisma/seed-demo.ts
 *
 * Idempotent: chạy lại nhiều lần không trùng. Để dọn dẹp, chạy với DELETE_DEMO=1
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'
import { addDays, startOfWeek, setHours, setMinutes } from 'date-fns'

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

const DEMO_STAFF_PHONE = '0900000099'
const DEMO_STUDENT_PHONE = '0900000088'
const DEMO_PASSWORD = 'PoolaneDemo@123'

function phoneToEmail(phone: string): string {
  return `${phone.replace(/\D/g, '')}@poolane.local`
}

async function createAuthUser(
  phone: string,
  fullName: string,
  role: 'admin' | 'staff' | 'student'
) {
  const email = phoneToEmail(phone)
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers()
  const existingUser = existing.users?.find(u => u.email === email)
  if (existingUser) {
    await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
  }
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  })
  if (error) throw new Error(`Auth create ${phone}: ${error.message}`)
  return data.user!.id
}

async function deleteDemo() {
  console.log('🧹 Xoá demo data...\n')

  // Find demo users
  const demoUsers = await prisma.user.findMany({
    where: { phone: { in: [DEMO_STAFF_PHONE, DEMO_STUDENT_PHONE] } },
    select: { id: true, email: true, phone: true },
  })

  for (const u of demoUsers) {
    // Delete cascade: student profile → enrollments, pool_tickets, registrations
    const student = await prisma.student.findFirst({ where: { userId: u.id } })
    if (student) {
      await prisma.sessionRegistration.deleteMany({ where: { studentId: student.id } })
      await prisma.poolTicket.deleteMany({ where: { studentId: student.id } })
      await prisma.enrollment.deleteMany({ where: { studentId: student.id } })
      await prisma.student.delete({ where: { id: student.id } })
    }
    await prisma.user.delete({ where: { id: u.id } })
    // Delete auth user
    await supabaseAdmin.auth.admin.deleteUser(u.id).catch(() => {})
    console.log(`   ✓ Xoá ${u.phone}`)
  }

  // Delete demo sessions (tag bằng notes='[DEMO]')
  const demoSessions = await prisma.classSession.findMany({
    where: { notes: { contains: '[DEMO]' } },
    select: { id: true },
  })
  await prisma.sessionRegistration.deleteMany({
    where: { sessionId: { in: demoSessions.map(s => s.id) } },
  })
  await prisma.classSession.deleteMany({ where: { id: { in: demoSessions.map(s => s.id) } } })
  console.log(`   ✓ Xoá ${demoSessions.length} demo sessions\n`)
  console.log('✅ Dọn dẹp xong!')
}

async function main() {
  if (process.env.DELETE_DEMO === '1') {
    await deleteDemo()
    return
  }

  console.log('\n🎬 SEED DEMO DATA — for owner testing\n')

  // ─── Find ECH course ───
  const course = await prisma.course.findUnique({ where: { code: 'ECH' } })
  if (!course) {
    console.error('❌ Course ECH not found. Run seed-production.ts trước.')
    process.exit(1)
  }

  // ─── 1. Staff demo ───
  console.log('👤 Staff demo...')
  const staffId = await createAuthUser(DEMO_STAFF_PHONE, 'Trợ Lý Demo', 'staff')
  await prisma.user.upsert({
    where: { id: staffId },
    create: {
      id: staffId,
      email: phoneToEmail(DEMO_STAFF_PHONE),
      phone: DEMO_STAFF_PHONE,
      fullName: 'Trợ Lý Demo',
      role: 'staff',
      accountSource: 'staff_created',
      isActive: true,
      termsAcknowledgedAt: new Date(),
    },
    update: { fullName: 'Trợ Lý Demo', role: 'staff', isActive: true },
  })
  console.log(`   ✓ ${DEMO_STAFF_PHONE} (Trợ Lý Demo)\n`)

  // ─── 2. Student demo ───
  console.log('👤 Student demo...')
  const studentUserId = await createAuthUser(DEMO_STUDENT_PHONE, 'Học Viên Demo', 'student')
  await prisma.user.upsert({
    where: { id: studentUserId },
    create: {
      id: studentUserId,
      email: phoneToEmail(DEMO_STUDENT_PHONE),
      phone: DEMO_STUDENT_PHONE,
      fullName: 'Học Viên Demo',
      role: 'student',
      accountSource: 'walk_in',
      dob: new Date('1995-08-15'),
      gender: 'male',
      ward: 'Phú Nhuận',
      district: 'Phú Nhuận',
      province: 'TP. Hồ Chí Minh',
      isActive: true,
      termsAcknowledgedAt: new Date(),
      photoConsentAt: new Date(),
    },
    update: { fullName: 'Học Viên Demo', role: 'student', isActive: true },
  })

  const student = await prisma.student.upsert({
    where: { userId: studentUserId },
    create: {
      userId: studentUserId,
      studentCode: 'POLA-2026-DEMO',
      status: 'active',
      swimmingExperience: 'Người mới hoàn toàn',
      learningGoal: 'Bơi được 25m không nghỉ',
    },
    update: { status: 'active' },
  })
  console.log(`   ✓ ${DEMO_STUDENT_PHONE} (Học Viên Demo) — code ${student.studentCode}`)

  // ─── 3. Pool ticket cho student ───
  await prisma.poolTicket.deleteMany({ where: { studentId: student.id } })
  await prisma.poolTicket.create({
    data: {
      studentId: student.id,
      ticketType: 'first',
      totalSessions: 10,
      maxSessions: 12,
      sessionsUsed: 2, // Đã dùng 2, còn 8 chưa hết → test register bình thường
      pricePaid: 1_300_000,
      purchasedAt: new Date(),
      isActive: true,
    },
  })
  console.log(`   ✓ Pool ticket: 10 buổi, dùng 2, còn 8`)

  // ─── 4. Enrollment ECH cho student ───
  await prisma.enrollment.deleteMany({ where: { studentId: student.id } })
  await prisma.enrollment.create({
    data: {
      studentId: student.id,
      courseId: course.id,
      paymentPlan: 'A_full',
      depositAmount: course.price,
      totalPaid: course.price,
      status: 'active',
      enrolledAt: new Date(),
      startedAt: new Date(),
    },
  })
  console.log(`   ✓ Enrollment khoá ECH (A_full, đã đóng đủ)\n`)

  // ─── 5. Class sessions cho 2 tuần tới ───
  console.log('📅 Class sessions...')
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })

  // Xoá session cũ demo (nếu có) để fresh
  await prisma.classSession.deleteMany({ where: { notes: { contains: '[DEMO]' } } })

  // Tạo 6 buổi: T2/T4/T6 tuần này + tuần sau (sáng)
  const dayOffsets = [0, 2, 4, 7, 9, 11] // Mon Wed Fri của 2 tuần
  const created: { id: string; date: Date }[] = []

  for (const offset of dayOffsets) {
    const date = addDays(weekStart, offset)
    // Buổi sáng 05:30
    const morningDate = setMinutes(setHours(date, 5), 30)
    const session = await prisma.classSession.create({
      data: {
        date: morningDate,
        timeSlot: 'morning',
        capacity: 5,
        status: 'scheduled',
        notes: '[DEMO] Buổi sáng',
      },
    })
    created.push({ id: session.id, date: morningDate })
  }

  // Thêm 2 buổi chiều cho ngày T3/T5 tuần này
  for (const offset of [1, 3]) {
    const date = addDays(weekStart, offset)
    const eveningDate = setHours(date, 18)
    const session = await prisma.classSession.create({
      data: {
        date: eveningDate,
        timeSlot: 'evening',
        capacity: 7,
        status: 'scheduled',
        notes: '[DEMO] Buổi chiều',
      },
    })
    created.push({ id: session.id, date: eveningDate })
  }
  console.log(`   ✓ ${created.length} sessions trong 2 tuần tới\n`)

  // ─── 6. 2 registrations mẫu ───
  console.log('📝 Session registrations...')
  // 1 approved (buổi đầu)
  await prisma.sessionRegistration.create({
    data: {
      sessionId: created[0].id,
      studentId: student.id,
      courseId: course.id,
      status: 'approved',
      registeredAt: new Date(),
      decidedAt: new Date(),
      decidedBy: staffId,
    },
  })
  // 1 pending (buổi thứ 2)
  await prisma.sessionRegistration.create({
    data: {
      sessionId: created[1].id,
      studentId: student.id,
      courseId: course.id,
      status: 'pending',
      registeredAt: new Date(),
    },
  })
  console.log(`   ✓ 1 approved + 1 pending\n`)

  // ─── Done ───
  console.log('✅ Demo data seed complete!\n')
  console.log('═══════════════════════════════════════════════════')
  console.log('  Login demo accounts:\n')
  console.log(`  Staff:    ${DEMO_STAFF_PHONE} / ${DEMO_PASSWORD}`)
  console.log(`  Student:  ${DEMO_STUDENT_PHONE} / ${DEMO_PASSWORD}`)
  console.log(`            (vé còn 8 buổi, đã đăng ký 2 buổi)`)
  console.log('═══════════════════════════════════════════════════\n')
  console.log('Test các trang:')
  console.log('  /student/schedule       — đăng ký buổi với + button (giao diện mới)')
  console.log('  /student/my-schedule    — xem buổi đã đăng ký')
  console.log('  /student/progress       — radar chart (chưa có assessment)')
  console.log('  /student/payments       — lịch sử thanh toán')
  console.log('  /staff/registrations    — duyệt đăng ký (với staff account)')
  console.log('  /staff/students         — danh sách HV (read-only)\n')
  console.log('Xoá demo data: DELETE_DEMO=1 npm run db:seed-demo\n')
}

main()
  .catch(err => {
    console.error('\n❌ Seed FAILED:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
