import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { processProfileChangeRequestSchema } from '@/lib/validations/profile-change'
import { APPROVAL_REQUIRED_FIELDS } from '@/config/profile-fields'

type Params = { params: Promise<{ id: string }> }

// ─── GET /api/profile-change-requests/[id] ──────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const req = await prisma.profileChangeRequest.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true, fullName: true, phone: true, email: true, dob: true,
                ward: true, district: true, province: true, addressStreet: true,
                idCardNumber: true,
              }
            }
          }
        }
      }
    })

    if (!req) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy yêu cầu' } },
        { status: 404 }
      )
    }

    // Student chỉ xem được của chính mình
    if (user.role === 'student' && req.student.userId !== user.id) {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Không có quyền xem yêu cầu này' } },
        { status: 403 }
      )
    }

    return NextResponse.json({ data: req, error: null })

  } catch (error) {
    await logError({ context: 'profile_change_request.get', message: 'Failed to fetch request', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}

// ─── PATCH /api/profile-change-requests/[id] — Duyệt/từ chối ─
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const { id } = await params

    const body = await request.json()
    const parsed = processProfileChangeRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Thông tin không hợp lệ', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const req = await prisma.profileChangeRequest.findUnique({
      where: { id },
      include: { student: { include: { user: true } } }
    })

    if (!req) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy yêu cầu' } },
        { status: 404 }
      )
    }

    if (req.status !== 'pending') {
      return NextResponse.json(
        { data: null, error: { code: 'ALREADY_PROCESSED', message: 'Yêu cầu này đã được xử lý' } },
        { status: 409 }
      )
    }

    const { action, notes } = parsed.data
    const studentUserId = req.student.userId
    const studentUser = req.student.user

    // Parse fieldChanges JSON
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawChanges = req.fieldChanges as any
    const changes: Record<string, { old: string | null; new: string }> = rawChanges?.changes ?? {}

    if (action === 'approve') {
      // Build update data, chỉ áp các trường trong whitelist
      const userUpdateData: Record<string, unknown> = {}
      for (const [field, entry] of Object.entries(changes)) {
        if (!(APPROVAL_REQUIRED_FIELDS as readonly string[]).includes(field)) continue
        if (field === 'dob') {
          userUpdateData.dob = entry.new ? new Date(entry.new) : null
        } else {
          userUpdateData[field] = entry.new && entry.new.trim().length > 0 ? entry.new.trim() : null
        }
      }

      // Build beforeData từ studentUser hiện tại
      const beforeData: Record<string, string | null> = {}
      for (const k of Object.keys(userUpdateData)) {
        const v = (studentUser as Record<string, unknown>)[k]
        if (v instanceof Date) beforeData[k] = v.toISOString()
        else if (v == null) beforeData[k] = null
        else beforeData[k] = String(v)
      }

      await prisma.$transaction(async (tx) => {
        if (Object.keys(userUpdateData).length > 0) {
          await tx.user.update({ where: { id: studentUserId }, data: userUpdateData })
        }

        await tx.profileChangeRequest.update({
          where: { id },
          data: {
            status: 'approved',
            processedAt: new Date(),
            processedBy: user.id,
            processedNotes: notes || null,
          }
        })

        await tx.notification.create({
          data: {
            userId: studentUserId,
            studentId: req.studentId,
            senderId: user.id,
            type: 'approval',
            title: 'Yêu cầu cập nhật hồ sơ đã được duyệt',
            body: `Yêu cầu cập nhật ${Object.keys(userUpdateData).length} trường của bạn đã được áp dụng.`,
            actionUrl: '/student/profile',
          }
        })

        await tx.auditLog.create({
          data: {
            userId: user.id,
            role: user.role,
            action: 'profile_change_request.approve',
            entityType: 'profile_change_request',
            entityId: id,
            beforeData: beforeData as Record<string, string | null>,
            afterData: { ...userUpdateData, processedBy: user.id, notes: notes ?? null } as Record<string, unknown> as never,
          }
        })
      })

      log.info('profile_change_request.approve', `Approved request ${id}`, {
        processedBy: user.id,
        studentId: req.studentId,
      })

    } else {
      // Reject
      await prisma.$transaction(async (tx) => {
        await tx.profileChangeRequest.update({
          where: { id },
          data: {
            status: 'rejected',
            processedAt: new Date(),
            processedBy: user.id,
            processedNotes: notes,
          }
        })

        await tx.notification.create({
          data: {
            userId: studentUserId,
            studentId: req.studentId,
            senderId: user.id,
            type: 'rejection',
            title: 'Yêu cầu cập nhật hồ sơ bị từ chối',
            body: `Lý do: ${notes}`,
            actionUrl: '/student/profile',
          }
        })

        await tx.auditLog.create({
          data: {
            userId: user.id,
            role: user.role,
            action: 'profile_change_request.reject',
            entityType: 'profile_change_request',
            entityId: id,
            afterData: { processedBy: user.id, notes },
          }
        })
      })

      log.info('profile_change_request.reject', `Rejected request ${id}`, {
        processedBy: user.id,
        studentId: req.studentId,
      })
    }

    return NextResponse.json({ data: { id, action }, error: null })

  } catch (error) {
    await logError({ context: 'profile_change_request.process', message: 'Failed to process request', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi xử lý yêu cầu' } },
      { status: 500 }
    )
  }
}
