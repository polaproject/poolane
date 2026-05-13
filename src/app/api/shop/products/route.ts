import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { z } from 'zod'

const createProductSchema = z.object({
  name: z.string().min(2).max(100),
  sku: z.string().min(2).max(50),
  type: z.enum(['course', 'improvement_pack', 'service', 'physical']),
  price: z.number().int().positive(),
  cost: z.number().int().min(0).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(1).optional(),
  description: z.string().max(1000).optional(),
  sessionsCount: z.number().int().min(1).optional(),
})

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    })
    return NextResponse.json({ data: products, error: null })
  } catch (error) {
    await logError({ context: 'shop.products.list', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin'])
    const body = await request.json()
    const parsed = createProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() } }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name: parsed.data.name,
        sku: parsed.data.sku,
        type: parsed.data.type,
        price: parsed.data.price,
        cost: parsed.data.cost,
        stockQuantity: parsed.data.stockQuantity,
        lowStockThreshold: parsed.data.lowStockThreshold ?? 3,
        description: parsed.data.description,
        sessionsCount: parsed.data.sessionsCount,
        photos: [],
        isActive: true,
      }
    })

    return NextResponse.json({ data: product, error: null }, { status: 201 })
  } catch (error) {
    await logError({ context: 'shop.products.create', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
