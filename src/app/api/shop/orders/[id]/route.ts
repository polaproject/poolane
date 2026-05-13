import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError, log } from '@/lib/logger'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const updateOrderSchema = z.object({
  action: z.enum(['approve', 'reject', 'pay', 'fulfill', 'cancel']),
  fulfillmentNote: z.string().max(300).optional(),
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

    const { action, fulfillmentNote } = parsed.data
    const order = await prisma.order.findUnique({ where: { id }, include: { orderItems: { include: { product: true } } } })

    if (!order) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy đơn hàng' } }, { status: 404 })
    }

    const statusMap: Record<string, string> = {
      approve: 'approved', reject: 'cancelled',
      pay: 'paid', fulfill: 'fulfilled', cancel: 'cancelled'
    }

    const newStatus = statusMap[action]

    const updated = await prisma.order.update({
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
          await prisma.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } }
          })
        }
      }
    }

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
