import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { createProductSchema, productListQuerySchema } from '@/lib/validations/product'

// ─── GET /api/shop/products ─────────────────────────────
export async function GET(request: NextRequest) {
  try {
    // Phase 12 security fix: yêu cầu auth — student/staff/admin đều xem được nhưng phải login
    await requireRole(['admin', 'staff', 'student'])
    const { searchParams } = request.nextUrl
    const query = productListQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
    })

    if (!query.success) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_QUERY', message: 'Tham số không hợp lệ', details: query.error.flatten() } },
        { status: 400 }
      )
    }

    const { page, pageSize, search, type, isActive } = query.data

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (type) where.type = type
    if (isActive !== undefined) where.isActive = isActive === 'true'
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        // Sort theo displayOrder admin set (ASC = đầu danh sách). Fallback createdAt khi tie.
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.product.count({ where })
    ])

    // Tính số đã bán mỗi product = SUM(orderItem.quantity) WHERE order.status
    // IN ('paid', 'fulfilled'). Bỏ pending/approved/cancelled (chưa thực sự
    // bán xong). Group theo productId rồi map ngược về items.
    const productIds = items.map(i => i.id)
    const soldGroups = productIds.length > 0
      ? await prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            productId: { in: productIds },
            order: { status: { in: ['paid', 'fulfilled'] } },
          },
          _sum: { quantity: true },
        })
      : []
    const soldMap = new Map(soldGroups.map(g => [g.productId, g._sum.quantity ?? 0]))
    const itemsWithSold = items.map(it => ({ ...it, soldCount: soldMap.get(it.id) ?? 0 }))

    return NextResponse.json({
      data: {
        items: itemsWithSold,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      error: null
    })
  } catch (error) {
    await logError({ context: 'shop.products.list', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi tải sản phẩm' } },
      { status: 500 }
    )
  }
}

// ─── POST /api/shop/products — Tạo sản phẩm (admin only) ─
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin'])

    const body = await request.json()
    const parsed = createProductSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const input = parsed.data

    // Check SKU trùng
    const existing = await prisma.product.findUnique({ where: { sku: input.sku } })
    if (existing) {
      return NextResponse.json(
        { data: null, error: { code: 'DUPLICATE_SKU', message: 'Mã SKU này đã tồn tại' } },
        { status: 409 }
      )
    }

    // Validate linkedCourseId tồn tại (nếu có)
    if (input.linkedCourseId) {
      const course = await prisma.course.findUnique({ where: { id: input.linkedCourseId } })
      if (!course) {
        return NextResponse.json(
          { data: null, error: { code: 'COURSE_NOT_FOUND', message: 'Không tìm thấy khoá học để liên kết' } },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.create({
      data: {
        name: input.name,
        sku: input.sku,
        type: input.type,
        price: input.price,
        cost: input.cost ?? null,
        description: input.description || null,
        photos: input.photos ?? [],
        linkedCourseId: input.linkedCourseId ?? null,
        sessionsCount: input.sessionsCount ?? null,
        stockQuantity: input.type === 'physical' ? (input.stockQuantity ?? 0) : null,
        lowStockThreshold: input.lowStockThreshold ?? 3,
        isActive: true,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'product.create',
        entityType: 'product',
        entityId: product.id,
        afterData: { sku: product.sku, name: product.name, type: product.type, price: product.price },
      }
    })

    log.info('shop.products.create', `Created product ${product.sku}`, { productId: product.id, createdBy: user.id })

    return NextResponse.json({ data: product, error: null }, { status: 201 })
  } catch (error) {
    await logError({ context: 'shop.products.create', message: 'Failed to create product', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi tạo sản phẩm' } },
      { status: 500 }
    )
  }
}
