import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { createVoucherSchema } from '@/lib/validations/voucher'

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'staff'])
    const status = request.nextUrl.searchParams.get('status')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const items = await prisma.voucher.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { usages: true } } }
    })
    return NextResponse.json({ data: items, error: null })
  } catch (error) {
    await logError({ context: 'vouchers.list', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin'])
    const body = await request.json()
    const parsed = createVoucherSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() } }, { status: 400 })
    }

    const code = parsed.data.code.toUpperCase()
    const existing = await prisma.voucher.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ data: null, error: { code: 'DUPLICATE_CODE', message: 'Mã voucher đã tồn tại' } }, { status: 409 })
    }

    const voucher = await prisma.voucher.create({
      data: {
        code,
        description: parsed.data.description || null,
        discountType: parsed.data.discountType,
        discountValue: parsed.data.discountValue,
        appliesTo: parsed.data.appliesTo,
        maxUses: parsed.data.maxUses ?? null,
        validFrom: parsed.data.validFrom ? new Date(parsed.data.validFrom) : null,
        validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
        isActive: parsed.data.isActive,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id, role: user.role,
        action: 'voucher.create', entityType: 'voucher', entityId: voucher.id,
        afterData: { code, discountType: voucher.discountType, value: voucher.discountValue },
      }
    })

    return NextResponse.json({ data: voucher, error: null }, { status: 201 })
  } catch (error) {
    await logError({ context: 'vouchers.create', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
