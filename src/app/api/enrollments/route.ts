import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { createEnrollmentSchema } from '@/lib/validations/enrollment'
import { COURSE_PRICES, PAYMENT_DEPOSIT_RATE } from '@/config/constants'
import type { CourseCode } from '@/types'

// ─── POST /api/enrollments — Đăng ký khoá học ────────────
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])

    const body = await request.json()
    const parsed = createEnrollmentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Thông tin không hợp lệ', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const { studentId, courseId, paymentPlan, depositAmount, voucherCode } = parsed.data

    // Kiểm tra student tồn tại
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { fullName: true } } }
    })

    if (!student) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy học viên' } },
        { status: 404 }
      )
    }

    // Kiểm tra course tồn tại
    const course = await prisma.course.findUnique({ where: { id: courseId } })

    if (!course || !course.isActive) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Khoá học không tồn tại hoặc đã đóng' } },
        { status: 404 }
      )
    }

    // Kiểm tra không đăng ký trùng khoá đang active
    const existingActive = await prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId,
        status: { in: ['active', 'extension'] }
      }
    })

    if (existingActive) {
      return NextResponse.json(
        { data: null, error: { code: 'ALREADY_ENROLLED', message: `Học viên đang trong khoá ${course.name}` } },
        { status: 409 }
      )
    }

    // Tính số tiền theo payment plan
    const courseCode = course.code as CourseCode
    const courseFee = COURSE_PRICES[courseCode]
    let actualDeposit = 0
    let paymentDeadline: Date | null = null

    if (paymentPlan === 'A_full') {
      actualDeposit = courseFee  // Đóng toàn bộ ngay
    } else if (paymentPlan === 'B_course_first') {
      actualDeposit = courseFee  // Học phí trước, vé sau
    } else if (paymentPlan === 'C_deposit') {
      actualDeposit = depositAmount ?? Math.floor(courseFee * PAYMENT_DEPOSIT_RATE)
      // Deadline: buổi 2 (approx 2 tuần)
      const now = new Date()
      paymentDeadline = new Date(now.setDate(now.getDate() + 14))
    }

    // Tạo enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        paymentPlan,
        depositAmount: actualDeposit,
        totalPaid: actualDeposit,
        paymentDeadline,
        status: 'active',
        voucherCodeUsed: voucherCode || null,
      },
      include: { course: true }
    })

    // Cập nhật student status → enrolled (nếu đang là prospect)
    if (student.status === 'prospect') {
      await prisma.student.update({
        where: { id: studentId },
        data: { status: 'enrolled' }
      })
    }

    // Ghi payment record
    await prisma.payment.create({
      data: {
        studentId,
        amount: actualDeposit,
        type: 'course_fee',
        referenceType: 'enrollment',
        referenceId: enrollment.id,
        paymentMethod: 'cash',  // Default, staff sẽ update sau
        recordedBy: user.id,
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'enrollment.create',
        entityType: 'enrollment',
        entityId: enrollment.id,
        afterData: {
          studentId,
          courseCode,
          paymentPlan,
          depositAmount: actualDeposit,
        }
      }
    })

    log.info('enrollments.create', `Enrolled student ${studentId} in ${courseCode}`, {
      enrollmentId: enrollment.id,
      createdBy: user.id
    })

    return NextResponse.json(
      { data: enrollment, error: null },
      { status: 201 }
    )

  } catch (error) {
    await logError({ context: 'enrollments.create', message: 'Failed to create enrollment', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi đăng ký khoá học' } },
      { status: 500 }
    )
  }
}

// ─── GET /api/enrollments — Danh sách enrollment ─────────
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'staff'])

    const { searchParams } = request.nextUrl
    const studentId = searchParams.get('studentId')

    const where = studentId ? { studentId } : {}

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        course: true,
        student: {
          include: { user: { select: { fullName: true } } }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    })

    return NextResponse.json({ data: enrollments, error: null })

  } catch (error) {
    await logError({ context: 'enrollments.list', message: 'Failed to fetch enrollments', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
