import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { createStudentSchema, studentListQuerySchema } from '@/lib/validations/student'
import { createClient } from '@/lib/supabase/server'

// ─── GET /api/students — Danh sách học viên ──────────────
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])

    const { searchParams } = request.nextUrl
    const query = studentListQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    })

    if (!query.success) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_QUERY', message: 'Tham số tìm kiếm không hợp lệ', details: query.error.flatten() } },
        { status: 400 }
      )
    }

    const { page, pageSize, search, status, sortBy, sortOrder } = query.data
    const skip = (page - 1) * pageSize

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { studentCode: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search } } },
      ]
    }

    // Build orderBy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any =
      sortBy === 'fullName'
        ? { user: { fullName: sortOrder } }
        : sortBy === 'lastAttendedAt'
          ? { lastAttendedAt: sortOrder }
          : sortBy === 'studentCode'
            ? { studentCode: sortOrder }
            : { createdAt: sortOrder }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          user: {
            select: { fullName: true, phone: true, email: true, isActive: true }
          },
          enrollments: {
            where: { status: { in: ['active', 'extension'] } },
            select: { id: true, status: true }
          },
          poolTickets: {
            where: { isActive: true },
            select: { sessionsUsed: true, totalSessions: true, maxSessions: true },
            orderBy: { purchasedAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.student.count({ where })
    ])

    const items = students.map(s => ({
      id: s.id,
      studentCode: s.studentCode,
      fullName: s.user.fullName,
      phone: s.user.phone,
      status: s.status,
      lastAttendedAt: s.lastAttendedAt,
      createdAt: s.createdAt,
      activeEnrollmentsCount: s.enrollments.length,
      poolTicketSessionsLeft: s.poolTickets[0]
        ? s.poolTickets[0].maxSessions - s.poolTickets[0].sessionsUsed
        : null,
    }))

    log.info('students.list', `Fetched ${items.length} students`, { userId: user.id })

    return NextResponse.json({
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      error: null
    })

  } catch (error) {
    await logError({ context: 'students.list', message: 'Failed to fetch students', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi tải danh sách học viên' } },
      { status: 500 }
    )
  }
}

// ─── POST /api/students — Tạo học viên mới ───────────────
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])

    const body = await request.json()
    const parsed = createStudentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Thông tin không hợp lệ', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const input = parsed.data

    // Kiểm tra trùng số điện thoại
    const cleanPhone = input.phone.replace(/\D/g, '')
    const emailForAuth = `${cleanPhone}@poolane.local`

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ phone: input.phone }, { email: emailForAuth }] }
    })

    if (existingUser) {
      return NextResponse.json(
        { data: null, error: { code: 'DUPLICATE_PHONE', message: 'Số điện thoại này đã được đăng ký trong hệ thống' } },
        { status: 409 }
      )
    }

    // Tạo Supabase Auth user
    const supabase = await createClient()
    const adminSupabase = await import('@/lib/supabase/server').then(m => m.createAdminClient())

    const { data: authData, error: authError } = await (await adminSupabase).auth.admin.createUser({
      email: emailForAuth,
      phone: input.phone,
      password: `Poolane@${cleanPhone}`,  // Mật khẩu tạm — học viên cần đổi
      email_confirm: true,
      user_metadata: { full_name: input.fullName }
    })

    if (authError || !authData.user) {
      await logError({ context: 'students.create', message: 'Failed to create Supabase Auth user', error: authError })
      return NextResponse.json(
        { data: null, error: { code: 'AUTH_ERROR', message: 'Không thể tạo tài khoản. Vui lòng thử lại.' } },
        { status: 500 }
      )
    }

    // Tạo student code: POLA-YYYY-XXXX
    const year = new Date().getFullYear()
    const countThisYear = await prisma.student.count({
      where: { studentCode: { startsWith: `POLA-${year}-` } }
    })
    const studentCode = `POLA-${year}-${String(countThisYear + 1).padStart(4, '0')}`

    // Tạo User + Student records trong transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id: authData.user.id,
          email: emailForAuth,
          phone: input.phone,
          fullName: input.fullName,
          dob: input.dob ? new Date(input.dob) : null,
          gender: input.gender,
          ward: input.ward,
          district: input.district,
          province: input.province,
          addressStreet: input.addressStreet || null,
          emergencyContactName: input.emergencyContactName || null,
          emergencyContactPhone: input.emergencyContactPhone || null,
          occupation: input.occupation || null,
          healthNotes: input.healthNotes || null,
          role: 'student',
          accountSource: 'staff_created',
          photoConsentAt: input.photoConsent ? new Date() : null,
          imageConsentMarketingAt: input.imageConsentMarketing ? new Date() : null,
          refundPolicyAcknowledgedAt: input.refundPolicyAcknowledged ? new Date() : null,
          termsAcknowledgedAt: input.termsAcknowledged ? new Date() : null,
        }
      })

      const newStudent = await tx.student.create({
        data: {
          userId: newUser.id,
          studentCode,
          status: 'prospect',
          swimmingExperience: input.swimmingExperience || null,
          learningGoal: input.learningGoal || null,
          marketingSource: input.marketingSource || null,
        }
      })

      return { user: newUser, student: newStudent }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'student.create',
        entityType: 'student',
        entityId: result.student.id,
        afterData: { studentCode, status: 'prospect', createdBy: user.id }
      }
    })

    log.info('students.create', `Created student ${studentCode}`, {
      studentId: result.student.id,
      createdBy: user.id
    })

    return NextResponse.json(
      {
        data: {
          id: result.student.id,
          studentCode: result.student.studentCode,
          fullName: input.fullName,
          tempPassword: `Poolane@${cleanPhone}`,  // Trả về để staff thông báo
        },
        error: null
      },
      { status: 201 }
    )

  } catch (error) {
    await logError({ context: 'students.create', message: 'Failed to create student', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi tạo học viên' } },
      { status: 500 }
    )
  }
}
