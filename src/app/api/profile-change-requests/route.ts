import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import {
  createProfileChangeRequestSchema,
  profileChangeRequestListQuerySchema,
} from '@/lib/validations/profile-change'

// ─── POST /api/profile-change-requests — HV tạo yêu cầu ───
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (user.role !== 'student') {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Chỉ học viên mới có thể tạo yêu cầu cập nhật' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = createProfileChangeRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Thông tin không hợp lệ', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const student = await prisma.student.findFirst({
      where: { userId: user.id },
      select: { id: true, studentCode: true }
    })

    if (!student) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ học viên' } },
        { status: 404 }
      )
    }

    // Chặn nếu đã có request pending — tránh spam
    const pendingExisting = await prisma.profileChangeRequest.findFirst({
      where: { studentId: student.id, status: 'pending' }
    })

    if (pendingExisting) {
      return NextResponse.json(
        { data: null, error: { code: 'PENDING_EXISTS', message: 'Bạn đã có 1 yêu cầu đang chờ duyệt. Vui lòng đợi xử lý xong.' } },
        { status: 409 }
      )
    }

    const { fieldChanges, reason } = parsed.data

    const created = await prisma.$transaction(async (tx) => {
      const req = await tx.profileChangeRequest.create({
        data: {
          studentId: student.id,
          fieldChanges: {
            changes: fieldChanges,
            reason: reason ?? null,
          },
          status: 'pending',
        }
      })

      // Notify all admins + staff
      const recipients = await tx.user.findMany({
        where: { role: { in: ['admin', 'staff'] }, isActive: true },
        select: { id: true }
      })

      if (recipients.length > 0) {
        await tx.notification.createMany({
          data: recipients.map(r => ({
            userId: r.id,
            studentId: student.id,
            senderId: user.id,
            type: 'general',
            title: 'Yêu cầu cập nhật hồ sơ mới',
            body: `Học viên ${student.studentCode} yêu cầu cập nhật ${Object.keys(fieldChanges).length} trường thông tin.`,
            actionUrl: `/admin/profile-requests/${req.id}`,
          }))
        })
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          role: user.role,
          action: 'profile_change_request.create',
          entityType: 'profile_change_request',
          entityId: req.id,
          afterData: { fieldChanges, reason: reason ?? null, studentId: student.id },
        }
      })

      return req
    })

    log.info('profile_change_request.create', `Created request ${created.id}`, {
      studentId: student.id,
      userId: user.id,
      fields: Object.keys(fieldChanges),
    })

    return NextResponse.json(
      { data: { id: created.id, status: created.status }, error: null },
      { status: 201 }
    )

  } catch (error) {
    await logError({ context: 'profile_change_request.create', message: 'Failed to create request', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi tạo yêu cầu' } },
      { status: 500 }
    )
  }
}

// ─── GET /api/profile-change-requests — Staff/Admin list ─
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])

    const { searchParams } = request.nextUrl
    const query = profileChangeRequestListQuerySchema.safeParse({
      status: searchParams.get('status') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    })

    if (!query.success) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_QUERY', message: 'Tham số không hợp lệ', details: query.error.flatten() } },
        { status: 400 }
      )
    }

    const { status, page, pageSize } = query.data
    const where = status ? { status } : {}

    const [items, total] = await Promise.all([
      prisma.profileChangeRequest.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { requestedAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              studentCode: true,
              user: { select: { fullName: true, phone: true } }
            }
          }
        }
      }),
      prisma.profileChangeRequest.count({ where })
    ])

    log.info('profile_change_request.list', `Fetched ${items.length} requests`, { userId: user.id, status })

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
    await logError({ context: 'profile_change_request.list', message: 'Failed to list requests', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
