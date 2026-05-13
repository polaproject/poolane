import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { updateProductSchema } from '@/lib/validations/product'

type Params = { params: Promise<{ id: string }> }

// ─── GET /api/shop/products/[id] ────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: {
          select: { id: true, quantity: true, order: { select: { id: true, status: true, createdAt: true } } },
          take: 10,
          orderBy: { order: { createdAt: 'desc' } },
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy sản phẩm' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: product, error: null })
  } catch (error) {
    await logError({ context: 'shop.products.get', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}

// ─── PATCH /api/shop/products/[id] ──────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin'])
    const { id } = await params

    const body = await request.json()
    const parsed = updateProductSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy sản phẩm' } },
        { status: 404 }
      )
    }

    const input = parsed.data

    // Nếu đổi SKU → check duplicate
    if (input.sku && input.sku !== existing.sku) {
      const duplicate = await prisma.product.findUnique({ where: { sku: input.sku } })
      if (duplicate) {
        return NextResponse.json(
          { data: null, error: { code: 'DUPLICATE_SKU', message: 'Mã SKU này đã được sản phẩm khác sử dụng' } },
          { status: 409 }
        )
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    const fields = ['name', 'sku', 'type', 'price', 'cost', 'description', 'photos',
      'linkedCourseId', 'sessionsCount', 'stockQuantity', 'lowStockThreshold', 'isActive'] as const
    for (const f of fields) {
      if (f in input && (input as Record<string, unknown>)[f] !== undefined) {
        updateData[f] = (input as Record<string, unknown>)[f]
      }
    }

    const beforeData: Record<string, unknown> = {}
    for (const k of Object.keys(updateData)) {
      beforeData[k] = (existing as Record<string, unknown>)[k]
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'product.update',
        entityType: 'product',
        entityId: id,
        beforeData: beforeData as Record<string, string | null>,
        afterData: updateData as Record<string, string | null>,
      }
    })

    log.info('shop.products.update', `Updated product ${id}`, { updatedBy: user.id, fields: Object.keys(updateData) })

    return NextResponse.json({ data: updated, error: null })
  } catch (error) {
    await logError({ context: 'shop.products.update', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi cập nhật' } },
      { status: 500 }
    )
  }
}

// ─── DELETE /api/shop/products/[id] — Soft delete ───────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin'])
    const { id } = await params

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy sản phẩm' } },
        { status: 404 }
      )
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'product.deactivate',
        entityType: 'product',
        entityId: id,
        beforeData: { isActive: existing.isActive },
        afterData: { isActive: false },
      }
    })

    log.warn('shop.products.delete', `Deactivated product ${id}`, { deactivatedBy: user.id })

    return NextResponse.json({ data: { id }, error: null })
  } catch (error) {
    await logError({ context: 'shop.products.delete', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
