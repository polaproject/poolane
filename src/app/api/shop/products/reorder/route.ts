import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'

const reorderSchema = z.object({
  productId: z.string().uuid(),
  direction: z.enum(['up', 'down']),
})

/**
 * PATCH /api/shop/products/reorder — swap displayOrder của product với
 * neighbor (1 product trên hoặc dưới). Atomic via transaction.
 *
 * Logic: lấy tất cả product sort by displayOrder ASC. Tìm index của
 * productId. Swap với index-1 (up) hoặc index+1 (down). No-op nếu ở biên.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole(['admin'])
    const body = await request.json()
    const parsed = reorderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_INPUT', message: 'Tham số không hợp lệ' } },
        { status: 400 }
      )
    }
    const { productId, direction } = parsed.data

    // Lấy toàn bộ sorted theo displayOrder ASC để tìm neighbor
    const all = await prisma.product.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      select: { id: true, displayOrder: true },
    })
    const idx = all.findIndex(p => p.id === productId)
    if (idx === -1) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy sản phẩm' } },
        { status: 404 }
      )
    }
    const neighborIdx = direction === 'up' ? idx - 1 : idx + 1
    if (neighborIdx < 0 || neighborIdx >= all.length) {
      // Đã ở biên — no-op (không lỗi, FE biết stop)
      return NextResponse.json({ data: { swapped: false }, error: null })
    }

    const current = all[idx]
    const neighbor = all[neighborIdx]

    // Swap displayOrder qua transaction để atomicity
    await prisma.$transaction([
      prisma.product.update({
        where: { id: current.id },
        data: { displayOrder: neighbor.displayOrder },
      }),
      prisma.product.update({
        where: { id: neighbor.id },
        data: { displayOrder: current.displayOrder },
      }),
    ])

    // Audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'product.reorder',
        entityType: 'product',
        entityId: productId,
        beforeData: { displayOrder: current.displayOrder },
        afterData: { displayOrder: neighbor.displayOrder, direction },
      },
    })
    log.info('shop.products.reorder', `Reordered ${productId} ${direction}`, { userId: user.id })

    return NextResponse.json({ data: { swapped: true }, error: null })
  } catch (error) {
    await logError({ context: 'shop.products.reorder', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
