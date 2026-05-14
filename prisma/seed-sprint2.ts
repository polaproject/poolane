/**
 * Seed data cho sprint 2: Exercises + Assignments + LessonPlans
 * Chạy: npx dotenv -e .env.local -- npx tsx prisma/seed-sprint2.ts
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
  console.log('🌙 Seeding sprint 2 extras...\n')

  const admin = await prisma.user.findFirst({ where: { role: 'admin' }, select: { id: true } })
  if (!admin) {
    console.error('❌ Chưa có admin')
    process.exit(1)
  }

  // ─── Exercises ───
  console.log('💪 Exercises...')
  await prisma.exerciseAssignment.deleteMany({ where: { exercise: { title: { startsWith: '[DEMO]' } } } })
  await prisma.exercise.deleteMany({ where: { title: { startsWith: '[DEMO]' } } })

  const exercises = [
    {
      title: '[DEMO] Đạp chân ếch với phao mềm',
      description: 'Tập trung vào chuyển động đối xứng của 2 chân, gót hướng ra ngoài. Bài cơ bản cho HV mới.',
      skillTarget: 'leg_kick', difficulty: 'beginner',
      steps: ['Ôm phao mềm bằng 2 tay trước mặt', 'Đầu nhìn xuống đáy hồ', 'Co gối, mở rộng đầu gối', 'Đạp mạnh ra hai bên rồi khép vào', 'Tốc độ chậm, nhịp đều'],
    },
    {
      title: '[DEMO] Glide lướt nước với 2 cú đạp',
      description: 'Tập cảm nhận giai đoạn lướt — quan trọng nhất của bơi ếch.',
      skillTarget: 'glide', difficulty: 'beginner',
      steps: ['Đẩy thành bằng 2 chân', 'Tay duỗi thẳng, đầu kẹp giữa 2 tay', 'Lướt đến khi mất đà', 'Đạp 2 cú nhẹ → lướt tiếp', 'Lặp lại 5 lần'],
    },
    {
      title: '[DEMO] Thở 3-2-3 (bơi sải)',
      description: 'Tập thở luân phiên 2 bên — kỹ năng quan trọng cho HV chuyển từ ếch sang sải.',
      skillTarget: 'bilateral_breathing', difficulty: 'intermediate',
      steps: ['Bơi 3 nhịp tay thở trái', 'Bơi 2 nhịp không thở', 'Bơi 3 nhịp tay thở phải', 'Lặp lại 4 chu kỳ × 25m'],
      videoUrl: 'https://www.youtube.com/watch?v=demo',
    },
    {
      title: '[DEMO] Catch-up drill cho bơi sải',
      description: 'Tay chờ tay — tăng cảm nhận water entry và body rotation.',
      skillTarget: 'high_elbow_catch', difficulty: 'intermediate',
      steps: ['Bơi sải bình thường', 'Tay trước duỗi thẳng đợi tay sau bắt kịp', 'Khi 2 tay chạm nhau ở trước mặt mới bắt đầu pull tay tiếp theo', 'Tập trung high elbow catch'],
    },
    {
      title: '[DEMO] Đập chân cá heo nằm ngửa',
      description: 'Bài tập cảm nhận sóng người cho bơi bướm.',
      skillTarget: 'dolphin_kick', difficulty: 'advanced',
      steps: ['Nằm ngửa, tay duỗi qua đầu', 'Tạo sóng từ ngực → hông → chân', 'Đập chân 2 nhịp liên tiếp', '25m × 4 set, nghỉ 30s'],
    },
    {
      title: '[DEMO] Streamline kick (đá chân vớ tay)',
      description: 'Streamline + flutter kick để tăng sức bền và cảm nhận đường nước.',
      skillTarget: 'flutter_kick', difficulty: 'beginner',
      steps: ['Đẩy thành', 'Tay duỗi streamline, ngón cái khoá ngón út', 'Đập chân nhẹ nhịp đều', 'Bơi 25m, không lấy không khí', 'Lặp lại 6 lần'],
    },
    {
      title: '[DEMO] Quay đầu hồ flip turn (ếch)',
      description: 'Quay đầu nhanh ở thành hồ — không bắt buộc cho HV ếch nhưng tăng tốc độ.',
      skillTarget: 'turn', difficulty: 'advanced',
      steps: ['Bơi đến gần thành 2m', 'Lộn ngược, chân chạm thành', 'Đẩy ra streamline', 'Đập chân + 1 cú đạp ếch trước khi nổi', 'Thực hành 10 lần liên tiếp'],
    },
    {
      title: '[DEMO] Bơi liên tục 200m',
      description: 'Tăng sức bền — bài tổng hợp cho HV chuẩn bị tốt nghiệp.',
      skillTarget: 'endurance', difficulty: 'intermediate',
      steps: ['Khởi động 50m', 'Bơi liên tục 200m kiểu chính', 'Không bám phao/thành giữa chừng', 'Nghỉ 1 phút', 'Lặp lại 2 lần'],
    },
  ]

  const createdExercises = []
  for (const ex of exercises) {
    const e = await prisma.exercise.create({
      data: {
        title: ex.title,
        description: ex.description,
        skillTarget: ex.skillTarget,
        difficulty: ex.difficulty,
        videoUrl: 'videoUrl' in ex ? ex.videoUrl : null,
        stepsJson: ex.steps,
        isPublished: true,
        createdBy: admin.id,
      }
    })
    createdExercises.push(e)
  }
  console.log(`   ✓ ${createdExercises.length} exercises\n`)

  // ─── Assignments ───
  console.log('📋 Assignments...')
  const activeStudents = await prisma.student.findMany({
    where: { status: { in: ['active', 'extension'] } },
    select: { id: true, userId: true, user: { select: { fullName: true } } },
    take: 5,
  })

  let assignmentCount = 0
  for (const stu of activeStudents.slice(0, 3)) {
    const pickedExercises = createdExercises.slice(0, 2 + Math.floor(Math.random() * 2))
    for (const ex of pickedExercises) {
      await prisma.exerciseAssignment.create({
        data: {
          exerciseId: ex.id,
          studentId: stu.id,
          assignedBy: admin.id,
          dueDate: new Date(Date.now() + 7 * 86400000),
          status: 'assigned',
        }
      })
      assignmentCount++
    }
  }
  console.log(`   ✓ ${assignmentCount} assignments cho ${Math.min(3, activeStudents.length)} HV\n`)

  // ─── Lesson plans cho buổi gần đây ───
  console.log('📋 Lesson plans...')
  const recentSessions = await prisma.classSession.findMany({
    where: { date: { gte: new Date(Date.now() - 7 * 86400000) } },
    orderBy: { date: 'asc' },
    take: 3,
  })

  await prisma.lessonPlan.deleteMany({ where: { sessionId: { in: recentSessions.map(s => s.id) } } })

  for (const sess of recentSessions) {
    await prisma.lessonPlan.create({
      data: {
        sessionId: sess.id,
        focusSkills: ['leg_kick', 'breathing', 'glide'],
        warmupNotes: '5 phút bơi nhẹ tự do + giãn cơ vai, hông, đầu gối',
        mainNotes: 'Set 1: Đạp chân ếch với phao 4×25m, nghỉ 20s\nSet 2: Glide drill 2 cú đạp 4×25m\nSet 3: Bơi đầy đủ tay-chân-thở 6×25m, đếm strokes',
        cooldownNotes: '3 phút bơi nhẹ + thở sâu trên thành',
        equipment: '5 phao mềm + 3 phao dài',
        createdBy: admin.id,
      }
    })
  }
  console.log(`   ✓ ${recentSessions.length} lesson plans\n`)

  console.log('✅ Done! Test các trang:')
  console.log('   /admin/exercises → 8 bài tập demo')
  console.log('   /student/exercises (login HV active) → browse thư viện')
  console.log('   /student/exercises/my → 3 HV đầu đã có 2-3 bài assigned')
  console.log('   /admin/schedule/sessions/[id] → bấm "Kế hoạch bài học" → 3 buổi gần đây đã có plan')
  console.log('   /admin/teacher-metrics → metrics tự tính từ data hiện có')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
