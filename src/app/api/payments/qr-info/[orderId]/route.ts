import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { buildMemo, buildQRInfo } from '@/lib/payments/vietqr'

type Params = { params: Promise<{ orderId: string }> }

// ─── GET /api/payments/qr-info/[orderId] ───
// Trả QR info để student render QR + thông tin chuyển khoản
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth()
    const { orderId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        student: { select: { id: true, userId: true, user: { select: { fullName: true } } } },
        orderItems: { include: { product: { select: { name: true } } } },
      }
    })

    if (!order) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy đơn hàng' } }, { status: 404 })
    }

    // Student chỉ pay đơn của mình
    if (user.role === 'student' && order.student.userId !== user.id) {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN' } }, { status: 403 })
    }

    if (order.status !== 'approved') {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_STATUS', message: `Đơn ở trạng thái ${order.status}, không thể thanh toán` } },
        { status: 400 }
      )
    }

    const memo = buildMemo(order.id)
    const qrInfo = buildQRInfo(order.finalAmount, memo)
    const orderInfo = order.orderItems.length === 1
      ? order.orderItems[0].product.name
      : `${order.orderItems.length} sản phẩm`

    return NextResponse.json({
      data: {
        ...qrInfo,
        orderInfo,
        studentName: order.student.user.fullName,
      },
      error: null
    })

  } catch (error) {
    await logError({ context: 'qr_info.get', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
