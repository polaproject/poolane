import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError, log } from '@/lib/logger'
import { z } from 'zod'
import { createPoolTicketsFromOrder } from '@/lib/payments/pool-ticket-from-order'

type Params = { params: Promise<{ id: string }> }

const updateOrderSchema = z.object({
  action: z.enum(['approve', 'reject', 'pay', 'fulfill', 'cancel']),
  fulfillmentNote: z.string().max(300).optional(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'card', 'other']).optional(),
  referenceNumber: z.string().max(100).optional(),
})

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const { id } = await params
    const body = await request.json()
    const parsed = updateOrderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } }, { status: 400 })
    }

    const { action, fulfillmentNote, paymentMethod, referenceNumber } = parsed.data
    const order = await prisma.order.findUnique({ where: { id }, include: { orderItems: { include: { product: true } } } })

    if (!order) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy đơn hàng' } }, { status: 404 })
    }

    // Đơn đã ở trạng thái cuối → không cho thao tác thêm
    if (order.status === 'fulfilled' || order.status === 'cancelled') {
      return NextResponse.json(
        { data: null, error: { code: 'ALREADY_FINALIZED', message: `Đơn hàng đã ${order.status === 'fulfilled' ? 'hoàn thành' : 'huỷ'}` } },
        { status: 409 }
      )
    }

    // Action 'pay' yêu cầu phương thức thanh toán
    if (action === 'pay' && !paymentMethod) {
      return NextResponse.json(
        { data: null, error: { code: 'PAYMENT_METHOD_REQUIRED', message: 'Vui lòng chọn phương thức thanh toán' } },
        { status: 400 }
      )
    }

    const statusMap: Record<string, string> = {
      approve: 'approved', reject: 'cancelled',
      pay: 'paid', fulfill: 'fulfilled', cancel: 'cancelled'
    }

    const newStatus = statusMap[action]

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: newStatus as 'approved' | 'cancelled' | 'paid' | 'fulfilled' | 'pending',
          ...(action === 'approve' ? { approvedAt: new Date(), approvedBy: user.id } : {}),
          ...(action === 'fulfill' ? { fulfilledAt: new Date(), fulfilledBy: user.id, fulfillmentNote } : {}),
        }
      })

      // Trừ stock khi duyệt đơn physical
      if (action === 'approve') {
        for (const item of order.orderItems) {
          if (item.product.type === 'physical' && item.product.stockQuantity !== null) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { decrement: item.quantity } }
            })
          }
        }
      }

      // Hoàn stock khi huỷ đơn đã duyệt (approved → cancelled). Đơn pending
      // chưa trừ stock nên không cần hoàn. Đơn paid/fulfilled không cho huỷ (đã
      // chặn ở guard `ALREADY_FINALIZED` phía trên + paid không có flow cancel).
      if (action === 'cancel' && order.status === 'approved') {
        for (const item of order.orderItems) {
          if (item.product.type === 'physical' && item.product.stockQuantity !== null) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { increment: item.quantity } }
            })
          }
        }
      }

      // Ghi nhận thanh toán vào bảng Payment khi action='pay'
      if (action === 'pay' && paymentMethod) {
        await tx.payment.create({
          data: {
            studentId: order.studentId,
            amount: order.finalAmount,
            type: 'shop',
            referenceType: 'order',
            referenceId: order.id,
            paymentMethod,
            referenceNumber: referenceNumber || null,
            recordedBy: user.id,
            notes: `Thanh toán đơn hàng Shop #${order.id.slice(0, 8).toUpperCase()}`,
          }
        })

        // Auto-create ImprovementSessionPack cho mỗi item type=improvement_pack
        for (const item of order.orderItems) {
          if (item.product.type === 'improvement_pack' && item.product.sessionsCount) {
            for (let i = 0; i < item.quantity; i++) {
              await tx.improvementSessionPack.create({
                data: {
                  studentId: order.studentId,
                  orderId: order.id,
                  sessionsPurchased: item.product.sessionsCount,
                  expiresAt: new Date(Date.now() + 90 * 86400000), // expire sau 90 ngày
                }
              })
            }
          }
        }

        // Auto-create PoolTicket cho item type='pool_ticket' (Phase 18.2 fix)
        await createPoolTicketsFromOrder(tx, {
          id: order.id,
          studentId: order.studentId,
          orderItems: order.orderItems.map(it => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            product: {
              type: it.product.type,
              sku: it.product.sku,
              sessionsCount: it.product.sessionsCount,
              name: it.product.name,
            },
          })),
        })
      }

      return updatedOrder
    })

    // Thông báo học viên
    const student = await prisma.student.findUnique({ where: { id: order.studentId }, select: { userId: true } })
    if (student) {
      const notifMap: Record<string, { title: string; body: string }> = {
        approve: { title: '✓ Đơn hàng được duyệt!', body: 'Đơn hàng của bạn đã được duyệt. Liên hệ lớp để thanh toán nhé 😊' },
        pay: { title: '💰 Đã ghi nhận thanh toán', body: 'Thanh toán đơn hàng đã được xác nhận!' },
        fulfill: { title: '📦 Đơn hàng hoàn thành', body: fulfillmentNote || 'Đơn hàng đã hoàn thành. Cảm ơn bạn!' },
        reject: { title: 'Đơn hàng không được duyệt', body: 'Đơn hàng của bạn không thể xử lý. Liên hệ lớp để biết thêm.' },
        cancel: { title: 'Đơn hàng đã huỷ', body: 'Đơn hàng đã được huỷ.' },
      }

      const notif = notifMap[action]
      if (notif) {
        await prisma.notification.create({
          data: {
            userId: student.userId,
            studentId: order.studentId,
            type: 'general',
            title: notif.title,
            body: notif.body,
            actionUrl: action === 'approve' ? `/student/shop/orders/${id}/pay` : '/student/shop/orders',
            metadata: { orderId: id, action }
          }
        })
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: `order.${action}`,
        entityType: 'order',
        entityId: id,
        beforeData: { status: order.status },
        afterData: { status: newStatus }
      }
    })

    log.info('shop.orders.update', `Order ${id} ${action}`, { processedBy: user.id })
    return NextResponse.json({ data: updated, error: null })

  } catch (error) {
    await logError({ context: 'shop.orders.update', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
