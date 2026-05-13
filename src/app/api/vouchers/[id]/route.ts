import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { updateVoucherSchema } from '@/lib/validations/voucher'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireRole(['admin', 'staff'])
    const { id } = await params
    const v = await prisma.voucher.findUnique({
      where: { id },
      include: {
        usages: { orderBy: { usedAt: 'desc' }, take: 50 }
      }
    })
    if (!v) return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy' } }, { status: 404 })
    return NextResponse.json({ data: v, error: null })
  } catch (error) {
    await logError({ context: 'voucher.get', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin'])
    const { id } = await params
    const body = await request.json()
    const parsed = updateVoucherSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } }, { status: 400 })
    }
    const input = parsed.data
    const data: Record<string, unknown> = {}
    if (input.description !== undefined) data.description = input.description || null
    if (input.discountValue !== undefined) data.discountValue = input.discountValue
    if (input.maxUses !== undefined) data.maxUses = input.maxUses
    if (input.validFrom !== undefined) data.validFrom = input.validFrom ? new Date(input.validFrom) : null
    if (input.validUntil !== undefined) data.validUntil = input.validUntil ? new Date(input.validUntil) : null
    if (input.isActive !== undefined) data.isActive = input.isActive

    const updated = await prisma.voucher.update({ where: { id }, data })
    await prisma.auditLog.create({
      data: {
        userId: user.id, role: user.role,
        action: 'voucher.update', entityType: 'voucher', entityId: id,
        afterData: data as Record<string, unknown> as never,
      }
    })
    return NextResponse.json({ data: updated, error: null })
  } catch (error) {
    await logError({ context: 'voucher.update', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
