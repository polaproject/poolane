import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError, log } from '@/lib/logger'
import { z } from 'zod'

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
  })).min(1),
  voucherCode: z.string().optional(),
  noteFromStudent: z.string().max(300).optional(),
  paymentPlan: z.enum(['A_full', 'B_course_first', 'C_deposit']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])
    const body = await request.json()
    const parsed = createOrderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } }, { status: 400 })
    }

    const { items, voucherCode, noteFromStudent, paymentPlan } = parsed.data

    // Lấy studentId
    const studentId = body.studentId || (
      user.role === 'student'
        ? (await prisma.student.findFirst({ where: { userId: user.id } }))?.id
        : null
    )
    if (!studentId) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ học viên' } }, { status: 404 })
    }

    // Load products
    const productIds = items.map(i => i.productId)
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } })

    if (products.length !== productIds.length) {
      return NextResponse.json({ data: null, error: { code: 'PRODUCT_NOT_FOUND', message: 'Một số sản phẩm không tồn tại' } }, { status: 404 })
    }

    // Kiểm tra stock cho physical products
    for (const item of items) {
      const product = products.find(p => p.id === item.productId)!
      if (product.type === 'physical' && product.stockQuantity !== null) {
        if (product.stockQuantity < item.quantity) {
          return NextResponse.json({ data: null, error: { code: 'OUT_OF_STOCK', message: `${product.name} không đủ hàng` } }, { status: 400 })
        }
      }
    }

    // Tính tổng tiền
    let totalAmount = 0
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId)!
      const lineTotal = product.price * item.quantity
      totalAmount += lineTotal
      return { productId: item.productId, quantity: item.quantity, unitPrice: product.price, lineTotal }
    })

    // Voucher
    let discountAmount = 0
    let voucherId: string | null = null
    if (voucherCode) {
      const voucher = await prisma.voucher.findFirst({
        where: {
          code: voucherCode,
          isActive: true,
          AND: [
            { OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }] },
            { OR: [{ maxUses: null }, { usedCount: { lt: prisma.voucher.fields.maxUses } }] },
            { OR: [{ validFrom: null }, { validFrom: { lte: new Date() } }] },
            { OR: [{ appliesTo: 'any' }, { appliesTo: 'shop_only' }] },
          ],
        }
      })
      if (voucher) {
        voucherId = voucher.id
        discountAmount = voucher.discountType === 'percent'
          ? Math.floor(totalAmount * (voucher.discountValue / 100))
          : Math.min(voucher.discountValue, totalAmount)
      }
    }

    const finalAmount = totalAmount - discountAmount

    // Tạo order trong transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          studentId,
          totalAmount,
          voucherCode: voucherCode || null,
          discountAmount,
          finalAmount,
          status: 'pending',
          noteFromStudent: noteFromStudent || null,
          paymentPlan: paymentPlan || null,
          orderItems: { create: orderItems }
        },
        include: { orderItems: { include: { product: true } } }
      })

      // Track voucher usage
      if (voucherId) {
        await tx.voucherUsage.create({
          data: { voucherId, studentId, orderId: newOrder.id }
        })
        await tx.voucher.update({
          where: { id: voucherId },
          data: { usedCount: { increment: 1 } }
        })
      }

      // Thông báo cho admin/staff
      const admins = await tx.user.findMany({ where: { role: { in: ['admin', 'staff'] }, isActive: true }, select: { id: true } })
      const student = await tx.student.findUnique({ where: { id: studentId }, include: { user: { select: { fullName: true } } } })

      await tx.notification.createMany({
        data: admins.map(a => ({
          userId: a.id,
          studentId,
          type: 'general',
          title: `Đơn hàng mới từ ${student?.user.fullName}`,
          body: `${newOrder.orderItems.length} sản phẩm · ${finalAmount.toLocaleString('vi-VN')}đ · Chờ duyệt`,
          metadata: { orderId: newOrder.id, finalAmount }
        }))
      })

      return newOrder
    })

    log.info('shop.orders.create', `Order ${order.id} created`, { studentId, total: finalAmount })
    return NextResponse.json({ data: order, error: null }, { status: 201 })

  } catch (error) {
    await logError({ context: 'shop.orders.create', message: 'Failed to create order', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])
    const status = request.nextUrl.searchParams.get('status')
    const studentId = request.nextUrl.searchParams.get('studentId')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (status) where.status = status
    if (user.role === 'student') {
      const student = await prisma.student.findFirst({ where: { userId: user.id } })
      if (student) where.studentId = student.id
    } else if (studentId) {
      where.studentId = studentId
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        orderItems: { include: { product: true } }
      },
      take: 50
    })

    return NextResponse.json({ data: orders, error: null })
  } catch (error) {
    await logError({ context: 'shop.orders.list', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
