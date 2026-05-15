import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { updateStudentSchema } from '@/lib/validations/student'

type Params = { params: Promise<{ id: string }> }

// ─── GET /api/students/[id] ───────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const { id } = await params

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        enrollments: {
          include: { course: true },
          orderBy: { enrolledAt: 'desc' }
        },
        poolTickets: {
          where: { isActive: true },
          orderBy: { purchasedAt: 'desc' }
        },
        studentNotes: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
      }
    })

    if (!student) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy học viên' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: student, error: null })

  } catch (error) {
    await logError({ context: 'students.get', message: 'Failed to fetch student', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}

// ─── PATCH /api/students/[id] ─────────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const { id } = await params

    const body = await request.json()
    const parsed = updateStudentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Thông tin không hợp lệ', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!student) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy học viên' } },
        { status: 404 }
      )
    }

    const input = parsed.data
    const { status, swimmingExperience, learningGoal, marketingSource, ...userFields } = input

    // Capture before state for audit
    const beforeData = {
      status: student.status,
      ...Object.fromEntries(
        Object.keys(userFields).map(k => [k, (student.user as Record<string, unknown>)[k]])
      )
    }

    // Update trong transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update user fields nếu có
      const userUpdateData: Record<string, unknown> = {}
      if (userFields.fullName) userUpdateData.fullName = userFields.fullName
      if (userFields.dob) userUpdateData.dob = new Date(userFields.dob)
      if (userFields.gender) userUpdateData.gender = userFields.gender
      if (userFields.ward !== undefined) userUpdateData.ward = userFields.ward
      if (userFields.district !== undefined) userUpdateData.district = userFields.district
      if (userFields.province !== undefined) userUpdateData.province = userFields.province
      if (userFields.addressStreet !== undefined) userUpdateData.addressStreet = userFields.addressStreet || null
      if (userFields.emergencyContactName !== undefined) userUpdateData.emergencyContactName = userFields.emergencyContactName || null
      if (userFields.emergencyContactPhone !== undefined) userUpdateData.emergencyContactPhone = userFields.emergencyContactPhone || null
      if (userFields.occupation !== undefined) userUpdateData.occupation = userFields.occupation || null
      if (userFields.healthNotes !== undefined) userUpdateData.healthNotes = userFields.healthNotes || null

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({ where: { id: student.userId }, data: userUpdateData })
      }

      // Update student fields
      const studentUpdateData: Record<string, unknown> = {}
      if (status) studentUpdateData.status = status
      if (swimmingExperience !== undefined) studentUpdateData.swimmingExperience = swimmingExperience || null
      if (learningGoal !== undefined) studentUpdateData.learningGoal = learningGoal || null
      if (marketingSource !== undefined) studentUpdateData.marketingSource = marketingSource || null

      return tx.student.update({
        where: { id },
        data: studentUpdateData,
        include: { user: { select: { fullName: true, phone: true } } }
      })
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'student.update',
        entityType: 'student',
        entityId: id,
        beforeData,
        afterData: input
      }
    })

    log.info('students.update', `Updated student ${id}`, { updatedBy: user.id })

    return NextResponse.json({ data: updated, error: null })

  } catch (error) {
    await logError({ context: 'students.update', message: 'Failed to update student', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi cập nhật học viên' } },
      { status: 500 }
    )
  }
}

// ─── DELETE /api/students/[id] — Soft delete ──────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin'])  // Chỉ admin mới được xoá
    const { id } = await params

    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: { select: { phone: true } } },
    })

    if (!student) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy học viên' } },
        { status: 404 }
      )
    }

    // Phase 15.2 — Block xoá demo account (phone bắt đầu 0900000)
    const { isDemoAccount } = await import('@/lib/demo-account')
    if (isDemoAccount(student.user.phone)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'DEMO_ACCOUNT_PROTECTED',
            message: 'Tài khoản demo không xoá được qua UI. Dùng "DELETE_DEMO=1 npm run db:seed-demo" để xoá local + re-seed nếu cần.',
          },
        },
        { status: 403 }
      )
    }

    // Soft delete — chỉ deactivate user
    await prisma.user.update({
      where: { id: student.userId },
      data: { isActive: false }
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'student.deactivate',
        entityType: 'student',
        entityId: id,
        beforeData: { isActive: true },
        afterData: { isActive: false }
      }
    })

    log.warn('students.delete', `Deactivated student ${id}`, { deactivatedBy: user.id })

    return NextResponse.json({ data: { id }, error: null })

  } catch (error) {
    await logError({ context: 'students.delete', message: 'Failed to deactivate student', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
