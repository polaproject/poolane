import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['student'])
    const { id } = await params

    const student = await prisma.student.findFirst({ where: { userId: user.id } })
    if (!student) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ học viên' } },
        { status: 404 }
      )
    }

    // Verify ownership trước khi mở transaction
    const orderCheck = await prisma.order.findUnique({
      where: { id },
      select: { studentId: true },
    })
    if (!orderCheck || orderCheck.studentId !== student.id) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy đơn hàng' } },
        { status: 404 }
      )
    }

    // Đặt status check VÀ update trong cùng transaction để tránh race condition
    // (admin có thể approve/pay đơn đúng lúc HV huỷ)
    let previousStatus: string
    try {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id },
          include: { orderItems: { include: { product: { select: { type: true, stockQuantity: true } } } } },
        })

        if (!order) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' })

        if (order.status !== 'pending' && order.status !== 'approved') {
          const msg =
            order.status === 'paid' || order.status === 'fulfilled'
              ? 'Đơn đã thanh toán — vui lòng liên hệ lớp để được hỗ trợ'
              : 'Đơn hàng đã huỷ trước đó'
          throw Object.assign(new Error(msg), { code: 'CANNOT_CANCEL', message: msg, status: 409 })
        }

        previousStatus = order.status

        await tx.order.update({ where: { id }, data: { status: 'cancelled' } })

        // Hoàn stock cho đơn đã duyệt (approved đã trừ stock khi admin duyệt)
        if (order.status === 'approved') {
          for (const item of order.orderItems) {
            if (item.product.type === 'physical' && item.product.stockQuantity !== null) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stockQuantity: { increment: item.quantity } },
              })
            }
          }
        }
      })
    } catch (txErr) {
      const e = txErr as { code?: string; message?: string; status?: number }
      if (e.code === 'CANNOT_CANCEL' || e.code === 'NOT_FOUND') {
        return NextResponse.json(
          { data: null, error: { code: e.code, message: e.message ?? 'Không thể huỷ đơn' } },
          { status: e.status ?? 409 },
        )
      }
      throw txErr
    }

    // Notify admin (fire-and-forget — không để lỗi notification phá request chính)
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
    if (admin) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          senderId: user.id,
          type: 'general',
          title: `${user.fullName} đã huỷ đơn hàng`,
          body: `Đơn #${id.slice(0, 8).toUpperCase()} vừa bị học viên huỷ (trước: ${previousStatus! === 'approved' ? 'đã duyệt' : 'chờ duyệt'})`,
          actionUrl: '/admin/shop/orders',
          metadata: { orderId: id, cancelledBy: user.id },
        },
      }).catch(() => null) // notification fail không block response
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'order.student_cancel',
        entityType: 'order',
        entityId: id,
        beforeData: { status: previousStatus! },
        afterData: { status: 'cancelled' },
      },
    }).catch(() => null)

    return NextResponse.json({ data: { status: 'cancelled' }, error: null })
  } catch (error) {
    await logError({ context: 'student.orders.cancel', message: 'Failed to cancel order', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
