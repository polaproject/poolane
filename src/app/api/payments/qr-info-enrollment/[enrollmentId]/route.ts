import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { buildEnrollmentMemo, buildQRInfo } from '@/lib/payments/vietqr'

type Params = { params: Promise<{ enrollmentId: string }> }

// ─── GET /api/payments/qr-info-enrollment/[enrollmentId] ───
// Trả QR info cho học phí còn nợ
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const { enrollmentId } = await params

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: { select: { name: true, code: true, price: true } },
        student: { select: { id: true, userId: true, user: { select: { fullName: true } } } },
      }
    })

    if (!enrollment) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy khoá đăng ký' } }, { status: 404 })
    }

    // Student chỉ pay cho enrollment của mình
    if (user.role === 'student' && enrollment.student.userId !== user.id) {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN' } }, { status: 403 })
    }

    const debt = enrollment.course.price - enrollment.totalPaid
    if (debt <= 0) {
      return NextResponse.json(
        { data: null, error: { code: 'PAID_FULL', message: 'Khoá học đã đóng đủ học phí' } },
        { status: 400 }
      )
    }

    if (enrollment.status === 'cancelled' || enrollment.status === 'refunded') {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_STATUS', message: `Khoá ở trạng thái ${enrollment.status}, không thể thanh toán` } },
        { status: 400 }
      )
    }

    const memo = buildEnrollmentMemo(enrollment.id)
    const qrInfo = buildQRInfo(debt, memo)

    return NextResponse.json({
      data: {
        ...qrInfo,
        orderInfo: `Học phí ${enrollment.course.name} (${enrollment.course.code})`,
        studentName: enrollment.student.user.fullName,
        coursePrice: enrollment.course.price,
        totalPaid: enrollment.totalPaid,
        debt,
      },
      error: null
    })

  } catch (error) {
    await logError({ context: 'qr_info_enrollment.get', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
