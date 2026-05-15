import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { z } from 'zod'
import { KEY_SKILLS_FOR_GRADUATION, ASSESSMENT_SCALE } from '@/config/constants'

const createAssessmentSchema = z.object({
  studentId: z.string().uuid(),
  courseId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  sessionNumber: z.number().int().min(1),
  type: z.enum(['initial', 'quick', 'detailed', 'graduation', 'improvement']),
  notes: z.string().max(1000).optional(),
  voiceNoteUrl: z.string().url().optional(),
  scores: z.array(z.object({
    skillKey: z.string(),
    score: z.number().int().min(1).max(5),
    note: z.string().max(300).optional(),
  })),
  metrics: z.array(z.object({
    metricKey: z.enum(['continuous_meters', 'time_25m', 'stroke_count']),
    value: z.number().positive(),
    unit: z.string(),
  })).optional(),
})

// ─── POST /api/assessments ────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])

    const body = await request.json()
    const parsed = createAssessmentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const { studentId, courseId, sessionId, sessionNumber, type, notes, voiceNoteUrl, scores, metrics } = parsed.data

    // Kiểm tra tốt nghiệp nếu là graduation assessment
    let isGraduationPass = false
    if (type === 'graduation') {
      const course = await prisma.course.findUnique({ where: { id: courseId }, select: { code: true } })
      const courseCode = (course?.code ?? 'ECH') as 'ECH' | 'SAI' | 'BUOM'
      const keySkills = KEY_SKILLS_FOR_GRADUATION[courseCode] ?? []

      const allAboveMin = scores.every(s => s.score >= ASSESSMENT_SCALE.GRADUATION_MIN)
      const keySkillsPass = keySkills.every(k => {
        const score = scores.find(s => s.skillKey === k)?.score ?? 0
        return score >= ASSESSMENT_SCALE.KEY_SKILLS_MIN
      })
      const continuousMeters = metrics?.find(m => m.metricKey === 'continuous_meters')?.value ?? 0

      isGraduationPass = allAboveMin && keySkillsPass && continuousMeters >= ASSESSMENT_SCALE.CONTINUOUS_METERS_MIN
    }

    const assessment = await prisma.assessment.create({
      data: {
        studentId,
        courseId,
        sessionId: sessionId || null,
        sessionNumber,
        type,
        assessorId: user.id,
        assessmentDate: new Date(),
        notes: notes || null,
        isVoiceNote: !!voiceNoteUrl,
        voiceNoteUrl: voiceNoteUrl || null,
        scores: {
          create: scores.map(s => ({
            skillKey: s.skillKey,
            score: s.score,
            note: s.note || null,
          }))
        },
        ...(metrics && metrics.length > 0 ? {
          metrics: {
            create: metrics.map(m => ({
              metricKey: m.metricKey,
              value: m.value,
              unit: m.unit,
            }))
          }
        } : {})
      },
      include: { scores: true, metrics: true }
    })

    // Nếu tốt nghiệp → cập nhật enrollment
    if (type === 'graduation' && isGraduationPass) {
      await prisma.enrollment.updateMany({
        where: { studentId, courseId, status: { in: ['active', 'extension'] } },
        data: { status: 'completed', graduationDate: new Date() }
      })

      // Cập nhật student status
      await prisma.student.update({
        where: { id: studentId },
        data: { status: 'completed' }
      })

      // Thông báo tốt nghiệp
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: { select: { fullName: true } } }
      })
      const course = await prisma.course.findUnique({ where: { id: courseId }, select: { name: true } })

      if (student) {
        await prisma.notification.create({
          data: {
            userId: student.userId,
            studentId,
            type: 'badge',
            title: `🎉 Tốt nghiệp khoá ${course?.name}!`,
            body: `Chúc mừng bạn đã hoàn thành khoá học! Mình thấy bạn tiến bộ rất nhiều từ buổi đầu đến giờ. Hẹn gặp bạn ở khoá tiếp theo nhé 💙`,
          }
        })
      }
    }

    // Thông báo có kết quả đánh giá mới
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true }
    })
    if (student && type !== 'quick') {
      await prisma.notification.create({
        data: {
          userId: student.userId,
          studentId,
          type: 'general',
          title: 'Kết quả đánh giá mới 📊',
          body: `Mình vừa cập nhật đánh giá buổi ${sessionNumber} cho bạn. Vào app xem tiến độ nhé 🌊`,
          metadata: { assessmentId: assessment.id, sessionNumber }
        }
      })
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'assessment.create',
        entityType: 'assessment',
        entityId: assessment.id,
        afterData: { studentId, courseId, sessionNumber, type, scoresCount: scores.length, isGraduationPass }
      }
    })

    log.info('assessments.create', `Created ${type} assessment for student ${studentId}`, {
      sessionNumber, isGraduationPass, assessorId: user.id
    })

    return NextResponse.json({
      data: { ...assessment, isGraduationPass },
      error: null
    }, { status: 201 })

  } catch (error) {
    await logError({ context: 'assessments.create', message: 'Failed to create assessment', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi lưu đánh giá' } },
      { status: 500 }
    )
  }
}

// ─── GET /api/assessments ─────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'staff', 'student'])

    const { searchParams } = request.nextUrl
    const studentId = searchParams.get('studentId')
    const courseId = searchParams.get('courseId')
    const latest = searchParams.get('latest') === 'true'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (studentId) where.studentId = studentId
    if (courseId) where.courseId = courseId

    if (latest && studentId && courseId) {
      const assessment = await prisma.assessment.findFirst({
        where,
        orderBy: { assessmentDate: 'desc' },
        include: { scores: true, metrics: true }
      })
      return NextResponse.json({ data: assessment, error: null })
    }

    const assessments = await prisma.assessment.findMany({
      where,
      orderBy: { sessionNumber: 'asc' },
      include: { scores: true, metrics: true }
    })

    return NextResponse.json({ data: assessments, error: null })

  } catch (error) {
    await logError({ context: 'assessments.list', message: 'Failed to fetch assessments', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
