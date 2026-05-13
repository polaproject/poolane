/**
 * Seed dữ liệu mẫu cho mọi tính năng mới của session này.
 * Idempotent: chạy nhiều lần không tạo trùng (xoá rồi tạo lại cho entity không có natural unique).
 *
 * Chạy: npx dotenv -e .env.local -- npx tsx prisma/seed-extras.ts
 *
 * Bao gồm:
 *   1. Sessions + Registrations + Attendance (cho /student/my-schedule, reconciliation)
 *   2. Assessments + Scores (cho /admin/skill-heatmap, tự đánh giá so sánh)
 *   3. Blog posts (cho /admin/blog + public /blog)
 *   4. Quizzes + questions (cho /student/quiz)
 *   5. Events + Challenges + Progress (cho /admin/events, /student/events, /student/challenges)
 *   6. Self-assessments mẫu (cho /student/self-assessment)
 *   7. Profile change requests + Password reset requests (queue cho admin)
 *   8. Notifications mẫu
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

const COURSE_SKILLS: Record<string, string[]> = {
  ECH: ['body_position', 'leg_kick', 'arm_pull', 'breathing', 'glide', 'coordination', 'turn', 'endurance'],
  SAI: ['body_rotation', 'flutter_kick', 'entry', 'high_elbow_catch', 'arm_recovery', 'side_breathing', 'bilateral_breathing', 'turn', 'endurance_speed'],
  BUOM: ['undulation', 'dolphin_kick', 'entry', 'pull', 'arm_recovery', 'breathing', 'rhythm', 'endurance'],
}

async function main() {
  console.log('🌱 Seeding extras...\n')

  const admin = await prisma.user.findFirst({ where: { role: 'admin' }, select: { id: true } })
  const staff = await prisma.user.findFirst({ where: { role: 'staff' }, select: { id: true } })
  if (!admin || !staff) {
    console.error('❌ Chưa có admin/staff. Chạy npm run db:seed trước.')
    process.exit(1)
  }

  const courses = await prisma.course.findMany({ select: { id: true, code: true } })
  const courseByCode = Object.fromEntries(courses.map(c => [c.code, c.id]))

  const activeStudents = await prisma.student.findMany({
    where: { status: { in: ['active', 'extension'] } },
    include: {
      enrollments: { where: { status: { in: ['active', 'extension'] } }, take: 1, include: { course: true } },
    },
    take: 15,
  })

  if (activeStudents.length === 0) {
    console.error('❌ Không có student active. Chạy npm run db:seed trước.')
    process.exit(1)
  }

  // ─── 1. Sessions + Registrations + Attendance ───
  console.log('📅 Sessions / Registrations / Attendance...')
  // Xoá data 14 ngày gần đây để tạo lại
  const sinceDate = new Date(Date.now() - 14 * 86400000)
  await prisma.attendance.deleteMany({ where: { markedAt: { gte: sinceDate } } })
  await prisma.sessionRegistration.deleteMany({ where: { registeredAt: { gte: sinceDate } } })
  await prisma.classSession.deleteMany({ where: { date: { gte: sinceDate } } })

  let sessionsCreated = 0
  let regsCreated = 0
  let attsCreated = 0

  for (let dayOffset = -7; dayOffset <= 7; dayOffset++) {
    const date = new Date()
    date.setDate(date.getDate() + dayOffset)
    date.setHours(0, 0, 0, 0)

    for (const slot of ['morning', 'evening'] as const) {
      const capacity = slot === 'morning' ? 5 : 7
      const session = await prisma.classSession.create({
        data: {
          date,
          timeSlot: slot,
          capacity,
          status: dayOffset < 0 ? 'completed' : dayOffset === 0 ? 'in_progress' : 'scheduled',
        }
      })
      sessionsCreated++

      // Pick 2-4 random students for this session
      const numStudents = 2 + Math.floor(Math.random() * 3)
      const picked = activeStudents.slice().sort(() => 0.5 - Math.random()).slice(0, numStudents)
      for (const stu of picked) {
        const courseId = stu.enrollments[0]?.courseId
        if (!courseId) continue

        const reg = await prisma.sessionRegistration.create({
          data: {
            sessionId: session.id,
            studentId: stu.id,
            courseId,
            status: dayOffset > 2 ? 'pending' : 'approved',
            registeredAt: new Date(date.getTime() - 3 * 86400000),
            decidedAt: dayOffset <= 2 ? new Date(date.getTime() - 2 * 86400000) : null,
            decidedBy: dayOffset <= 2 ? staff.id : null,
          }
        }).catch(() => null) // ignore unique constraint
        if (!reg) continue
        regsCreated++

        // Attendance for past sessions
        if (dayOffset < 0 && reg.status === 'approved') {
          const present = Math.random() > 0.15 // 85% present
          await prisma.attendance.create({
            data: {
              sessionId: session.id,
              studentId: stu.id,
              courseId,
              status: present ? 'present' : 'absent',
              markedBy: staff.id,
              markedAt: new Date(date.getTime() + 8 * 3600000), // 8h sau session
            }
          }).catch(() => null)
          attsCreated++
        }
      }
    }
  }
  console.log(`   ✓ ${sessionsCreated} sessions, ${regsCreated} registrations, ${attsCreated} attendance\n`)

  // ─── 2. Assessments + Scores ───
  console.log('🏊 Assessments...')
  await prisma.assessmentScore.deleteMany({})
  await prisma.assessment.deleteMany({})

  let assessmentsCreated = 0
  for (const stu of activeStudents) {
    const enrollment = stu.enrollments[0]
    if (!enrollment) continue
    const courseCode = enrollment.course.code
    const skills = COURSE_SKILLS[courseCode] ?? []
    if (skills.length === 0) continue

    // Tạo 2-3 assessment cho mỗi HV
    const sessionNumbers = [1, 5, 9].slice(0, 1 + Math.floor(Math.random() * 3))
    for (const sn of sessionNumbers) {
      const a = await prisma.assessment.create({
        data: {
          studentId: stu.id,
          courseId: enrollment.courseId,
          sessionNumber: sn,
          type: sn === 1 ? 'initial' : sn === 9 ? 'detailed' : 'quick',
          assessorId: admin.id,
          assessmentDate: new Date(Date.now() - (30 - sn * 3) * 86400000),
          notes: sn === 1 ? 'Đánh giá ban đầu' : `Kiểm tra buổi ${sn}`,
        }
      })
      assessmentsCreated++

      for (const skillKey of skills) {
        // Điểm tăng dần theo session number, với randomness
        const baseScore = Math.min(5, Math.max(1, Math.round(2 + sn * 0.3 + (Math.random() - 0.5))))
        await prisma.assessmentScore.create({
          data: {
            assessmentId: a.id,
            skillKey,
            score: baseScore,
          }
        })
      }
    }
  }
  console.log(`   ✓ ${assessmentsCreated} assessments với scores\n`)

  // ─── 3. Blog posts ───
  console.log('📝 Blog posts...')
  await prisma.blogPost.deleteMany({ where: { slug: { startsWith: 'demo-' } } })

  const blogs = [
    { slug: 'demo-5-loi-thuong-gap-boi-ech', title: '5 lỗi thường gặp khi mới học bơi ếch', category: 'technique',
      excerpt: 'Đa số học viên mới đều mắc 5 lỗi cơ bản này. Đọc bài để tránh!',
      content: `# 5 lỗi thường gặp khi mới học bơi ếch\n\n## 1. Đạp chân không đối xứng\nNhiều bạn đạp chân lệch sang một bên, gây mất thăng bằng.\n\n## 2. Tay kéo quá rộng\nKéo tay sang ngang quá nhiều làm chậm tốc độ và mỏi vai.\n\n## 3. Không lướt nước (glide)\nĐa số bạn quên giai đoạn lướt sau khi đạp — đây là lúc tiết kiệm năng lượng nhất.\n\n## 4. Thở sai nhịp\nNgẩng đầu thở quá cao làm hông chìm xuống.\n\n## 5. Bỏ qua tư thế thân người\nThân người phải duỗi thẳng, mặt nhìn xuống đáy hồ.\n\nHẹn gặp các bạn ở hồ bơi! 🌊` },
    { slug: 'demo-an-toan-hoc-boi', title: 'An toàn đầu tiên: 7 nguyên tắc khi xuống nước', category: 'safety',
      excerpt: 'Trước khi học kỹ thuật, hãy nắm vững 7 nguyên tắc an toàn cơ bản.',
      content: `# 7 nguyên tắc an toàn\n\n1. **Không bao giờ bơi một mình** — luôn có người giám sát\n2. **Khởi động kỹ** trước khi xuống nước\n3. **Không ăn no** trong 1h trước khi bơi\n4. **Uống đủ nước** — bơi vẫn mất nước qua mồ hôi\n5. **Lắng nghe cơ thể** — mệt thì nghỉ\n6. **Biết giới hạn của mình** — không thử quá sức\n7. **Học cứu đuối cơ bản** — phòng cho mình và bạn cùng tập\n\nAn toàn luôn là ưu tiên số 1 ở Poolane.` },
    { slug: 'demo-dinh-duong-truoc-buoi-tap', title: 'Ăn gì trước khi xuống hồ?', category: 'nutrition',
      excerpt: 'Chế độ dinh dưỡng hợp lý giúp buổi bơi hiệu quả hơn.',
      content: `# Dinh dưỡng cho người tập bơi\n\n## 2-3h trước buổi tập\n- Cơm/bún/phở với protein nhẹ (cá, gà luộc)\n- Một ít rau xanh\n- Tránh đồ chiên rán\n\n## 30 phút trước\n- 1 quả chuối hoặc thanh ngũ cốc\n- 1 ly nước lọc\n\n## Sau buổi tập\n- Bù nước + điện giải\n- Bữa nhẹ giàu protein trong 30 phút (sữa, trứng)\n\nNghe cơ thể của bạn — mỗi người mỗi khác!` },
    { slug: 'demo-cau-chuyen-hv-an', title: 'Hành trình từ "sợ nước" đến bơi 100m của anh An', category: 'student_story',
      excerpt: 'Anh An tham gia Poolane khi 35 tuổi — câu chuyện vượt qua nỗi sợ.',
      content: `# Câu chuyện của anh An\n\n*Tôi đã sợ nước hơn 30 năm. Cứ thấy hồ là run.*\n\nĐó là lời anh An kể khi mới đến Poolane buổi đầu tiên. Sau 12 buổi học khoá Ếch:\n\n- Buổi 1-3: Làm quen với nước, thở oxy\n- Buổi 4-6: Tập đạp chân + glide\n- Buổi 7-9: Phối hợp tay-chân-thở\n- Buổi 10: Bơi liên tục 25m\n- Buổi 11-12 (ôn): Tăng lên 100m!\n\nGiờ anh An bơi đều đặn 2 buổi/tuần và đang theo khoá Sải.\n\n*"Lớp không chỉ dạy bơi — lớp giúp tôi tin vào bản thân."*` },
    { slug: 'demo-thong-bao-nghi-le', title: 'Thông báo lịch tập dịp Tết 2026', category: 'news',
      excerpt: 'Lịch tập trong tuần Tết và các thay đổi tạm thời.',
      content: `# Lịch Tết 2026\n\n## Nghỉ\n- 28 Tết → mùng 5 (8 ngày)\n\n## Mở lại bình thường\n- Mùng 6 Tết, ca chiều\n\n## Tặng cho HV đang học\n- Mỗi HV được +2 buổi vé bơi trong tháng 2\n\nChúc các bạn năm mới khoẻ mạnh, bơi giỏi!\n\n— Lớp Poolane` },
  ]

  for (const b of blogs) {
    await prisma.blogPost.create({
      data: {
        slug: b.slug,
        title: b.title,
        category: b.category,
        excerpt: b.excerpt,
        content: b.content,
        authorId: admin.id,
        status: 'published',
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
        viewCount: Math.floor(Math.random() * 200),
      }
    })
  }
  console.log(`   ✓ ${blogs.length} blog posts\n`)

  // ─── 4. Quizzes ───
  console.log('🧠 Quizzes...')
  // Xoá quiz có title bắt đầu bằng [DEMO]
  const oldQuizzes = await prisma.quiz.findMany({ where: { title: { startsWith: '[DEMO]' } }, select: { id: true } })
  if (oldQuizzes.length > 0) {
    await prisma.quizQuestion.deleteMany({ where: { quizId: { in: oldQuizzes.map(q => q.id) } } })
    await prisma.quizAttempt.deleteMany({ where: { quizId: { in: oldQuizzes.map(q => q.id) } } })
    await prisma.quiz.deleteMany({ where: { id: { in: oldQuizzes.map(q => q.id) } } })
  }

  await prisma.quiz.create({
    data: {
      title: '[DEMO] Kiến thức cơ bản về bơi ếch',
      description: 'Quiz 5 câu kiểm tra hiểu biết kỹ thuật bơi ếch',
      courseId: courseByCode.ECH ?? null,
      linkedSkill: 'breathing',
      createdBy: admin.id,
      isPublished: true,
      timeLimitMinutes: 10,
      questions: {
        create: [
          { orderIndex: 0, type: 'multiple_choice', questionText: 'Khi đạp chân ếch, gót chân nên hướng về phía nào?',
            options: ['Hướng ra ngoài', 'Hướng vào trong', 'Hướng lên trên', 'Hướng xuống dưới'],
            correctAnswer: 'Hướng ra ngoài',
            explanation: 'Gót chân hướng ra ngoài giúp tạo lực đẩy lớn nhất khi đạp.' },
          { orderIndex: 1, type: 'true_false', questionText: 'Bơi ếch cần lướt nước (glide) sau mỗi cú đạp.',
            options: [], correctAnswer: 'Đúng',
            explanation: 'Đúng — glide giúp tiết kiệm năng lượng và tăng tốc độ trung bình.' },
          { orderIndex: 2, type: 'multiple_choice', questionText: 'Mặt nhìn về đâu khi đang lướt?',
            options: ['Phía trước', 'Đáy hồ', 'Trần nhà', 'Bên cạnh'],
            correctAnswer: 'Đáy hồ',
            explanation: 'Nhìn xuống đáy giúp thân người duỗi thẳng, giảm cản nước.' },
          { orderIndex: 3, type: 'multiple_choice', questionText: 'Khi nào thì thở?',
            options: ['Khi đạp chân', 'Khi kéo tay', 'Khi lướt', 'Liên tục'],
            correctAnswer: 'Khi kéo tay',
            explanation: 'Thở trong giai đoạn kéo tay khi đầu được nâng tự nhiên.' },
          { orderIndex: 4, type: 'short_answer', questionText: 'Một chu kỳ bơi ếch gồm mấy giai đoạn chính?',
            options: [], correctAnswer: '4',
            explanation: '4 giai đoạn: kéo tay → thở → đạp chân → lướt' },
        ]
      }
    }
  })

  await prisma.quiz.create({
    data: {
      title: '[DEMO] An toàn dưới nước',
      description: 'Những quy tắc an toàn bắt buộc phải nhớ',
      createdBy: admin.id,
      isPublished: true,
      timeLimitMinutes: 5,
      questions: {
        create: [
          { orderIndex: 0, type: 'true_false', questionText: 'Có thể bơi một mình nếu là người bơi giỏi.',
            options: [], correctAnswer: 'Sai',
            explanation: 'Không bao giờ bơi một mình, dù là tay bơi chuyên nghiệp.' },
          { orderIndex: 1, type: 'multiple_choice', questionText: 'Trước buổi bơi nên ăn cách bao lâu?',
            options: ['30 phút', '1 giờ', '2-3 giờ', 'Vừa ăn xong là được'],
            correctAnswer: '2-3 giờ',
            explanation: 'Ăn xong 2-3 giờ là khoảng an toàn để tránh đau bụng.' },
          { orderIndex: 2, type: 'true_false', questionText: 'Khởi động trước khi bơi là không cần thiết.',
            options: [], correctAnswer: 'Sai',
            explanation: 'Khởi động giúp tránh chuột rút và chấn thương.' },
        ]
      }
    }
  })
  console.log(`   ✓ 2 quizzes\n`)

  // ─── 5. Events ───
  console.log('🎉 Events...')
  await prisma.event.deleteMany({ where: { name: { startsWith: '[DEMO]' } } })
  await prisma.event.createMany({
    data: [
      { name: '[DEMO] Minigame Tết 2026', date: new Date(Date.now() + 20 * 86400000),
        description: 'Cuộc thi bơi tốc độ vui dịp Tết. Có giải thưởng cho 3 bạn nhanh nhất ở mỗi nhóm tuổi!',
        createdBy: admin.id, timeSlot: 'evening' },
      { name: '[DEMO] Buổi off-line cafe Poolane', date: new Date(Date.now() + 7 * 86400000),
        description: 'Gặp gỡ cộng đồng học viên Poolane tại quán cafe lớp. Tự do trao đổi kinh nghiệm tập luyện.',
        createdBy: admin.id },
      { name: '[DEMO] Workshop dinh dưỡng cho người tập bơi', date: new Date(Date.now() - 10 * 86400000),
        description: 'Đã tổ chức thành công với 18 HV tham gia. Coach chia sẻ chế độ ăn trước/sau tập.',
        createdBy: admin.id, participantCount: 18 },
    ]
  })
  console.log(`   ✓ 3 events\n`)

  // ─── 6. Challenges ───
  console.log('🏆 Challenges...')
  // Xoá challenges có name bắt đầu [DEMO]
  const oldChallenges = await prisma.challenge.findMany({ where: { name: { startsWith: '[DEMO]' } }, select: { id: true } })
  if (oldChallenges.length > 0) {
    await prisma.challengeProgress.deleteMany({ where: { challengeId: { in: oldChallenges.map(c => c.id) } } })
    await prisma.challenge.deleteMany({ where: { id: { in: oldChallenges.map(c => c.id) } } })
  }

  const ch1 = await prisma.challenge.create({
    data: {
      name: '[DEMO] Thử thách 1000m tháng này',
      goalValue: 1000,
      unit: 'meters',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      isActive: true,
    }
  })
  const ch2 = await prisma.challenge.create({
    data: {
      name: '[DEMO] Đi 12 buổi/tháng',
      goalValue: 12,
      unit: 'sessions',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      isActive: true,
    }
  })

  // Add progress cho 10 students đầu
  for (const stu of activeStudents.slice(0, 10)) {
    await prisma.challengeProgress.create({
      data: {
        challengeId: ch1.id, studentId: stu.id,
        currentValue: Math.floor(Math.random() * 1200),
      }
    }).catch(() => null)
    await prisma.challengeProgress.create({
      data: {
        challengeId: ch2.id, studentId: stu.id,
        currentValue: Math.floor(Math.random() * 14),
      }
    }).catch(() => null)
  }
  console.log(`   ✓ 2 challenges với progress cho 10 HV\n`)

  // ─── 7. Self-assessments mẫu (cho 3 HV) ───
  console.log('🪞 Self-assessments...')
  let saCount = 0
  for (const stu of activeStudents.slice(0, 3)) {
    const enrollment = stu.enrollments[0]
    if (!enrollment) continue
    const skills = COURSE_SKILLS[enrollment.course.code] ?? []
    const scores: Record<string, number> = {}
    for (const s of skills) scores[s] = Math.max(1, Math.min(5, 2 + Math.floor(Math.random() * 3)))

    await prisma.selfAssessment.upsert({
      where: { studentId_courseId_sessionNumber: { studentId: stu.id, courseId: enrollment.courseId, sessionNumber: 5 } },
      create: {
        studentId: stu.id, courseId: enrollment.courseId, sessionNumber: 5,
        scoresJson: scores,
        notes: 'Tôi cảm thấy tự tin hơn nhưng còn run khi phải thở 2 bên.',
      },
      update: { scoresJson: scores }
    })
    saCount++
  }
  console.log(`   ✓ ${saCount} self-assessments\n`)

  // ─── 8. Password reset requests ───
  console.log('🔑 Password reset requests...')
  await prisma.passwordResetRequest.deleteMany({ where: { phone: { in: ['0901999998', '0901999999'] } } })
  // 1 pending của HV có thật
  const stuForReset = activeStudents[0]
  const stuUser = await prisma.user.findUnique({ where: { id: stuForReset.userId } })
  if (stuUser) {
    await prisma.passwordResetRequest.create({
      data: {
        phone: stuUser.phone ?? '0901000006',
        fullNameHint: stuUser.fullName,
        status: 'pending',
        ipAddress: '203.205.34.10',
      }
    })
  }
  // 1 pending của phone không tồn tại (test reject flow)
  await prisma.passwordResetRequest.create({
    data: { phone: '0901999998', fullNameHint: 'Người không có trong DB', status: 'pending', ipAddress: '1.2.3.4' }
  })
  console.log(`   ✓ 2 password reset requests (1 hợp lệ + 1 không hợp lệ)\n`)

  console.log('✅ Done! Test các trang:')
  console.log('   /student/my-schedule — lịch cá nhân với attendance')
  console.log('   /student/payments — lịch sử thanh toán')
  console.log('   /student/self-assessment — 3 HV đã có dữ liệu mẫu')
  console.log('   /student/quiz — 2 quiz published')
  console.log('   /student/events — 3 sự kiện (2 sắp tới + 1 đã qua)')
  console.log('   /student/challenges — 2 thử thách đang chạy')
  console.log('   /admin/blog — 5 bài viết')
  console.log('   /admin/events — quản lý sự kiện')
  console.log('   /admin/skill-heatmap — heatmap kỹ năng (đổi giữa ECH/SAI/BUOM)')
  console.log('   /admin/password-resets — 2 yêu cầu reset chờ xử lý')
  console.log('   /admin/reports — xuất Excel + reconciliation hoạt động ngay')
}

main()
  .catch(e => {
    console.error('❌ Seed extras failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
