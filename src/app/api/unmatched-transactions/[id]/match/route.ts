import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { z } from 'zod'
import {
  confirmOrderTransfer,
  confirmEnrollmentTransferShared,
} from '@/lib/payments/shared-confirm'

type Params = { params: Promise<{ id: string }> }

const schema = z.object({
  type: z.enum(['order', 'enrollment']),
  targetId: z.string().uuid(),
  amount: z.number().int().positive().optional(),
  notes: z.string().max(300).optional(),
})

// ─── POST /api/unmatched-transactions/[id]/match ───
// Admin gán giao dịch unmatched vào order/enrollment cụ thể
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const { id } = await params

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } }, { status: 400 })
    }

    const tx = await prisma.unmatchedTransaction.findUnique({ where: { id } })
    if (!tx) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy giao dịch' } }, { status: 404 })
    }
    if (tx.status !== 'pending') {
      return NextResponse.json({ data: null, error: { code: 'ALREADY_PROCESSED', message: 'Giao dịch đã được xử lý' } }, { status: 409 })
    }

    const amount = parsed.data.amount ?? tx.amount
    const notes = parsed.data.notes
      ?? `Admin gán thủ công từ giao dịch unmatched ${id.slice(0, 8)} · gốc: ${tx.amount.toLocaleString('vi-VN')}đ`

    let result
    if (parsed.data.type === 'order') {
      result = await confirmOrderTransfer(parsed.data.targetId, {
        amount,
        referenceNumber: tx.referenceCode ?? null,
        recordedBy: user.id,
        recordedByRole: user.role as 'admin' | 'staff',
        notes,
        source: 'manual', // gán thủ công, không phải auto sepay
      })
    } else {
      result = await confirmEnrollmentTransferShared(parsed.data.targetId, {
        amount,
        referenceNumber: tx.referenceCode ?? null,
        recordedBy: user.id,
        recordedByRole: user.role as 'admin' | 'staff',
        notes,
        source: 'manual',
      })
    }

    if (!result.ok) {
      return NextResponse.json({ data: null, error: { code: result.code, message: result.message } }, { status: 409 })
    }

    // Update unmatched transaction
    await prisma.unmatchedTransaction.update({
      where: { id },
      data: {
        status: 'matched',
        matchedToType: parsed.data.type,
        matchedToId: parsed.data.targetId,
        matchedAt: new Date(),
        matchedBy: user.id,
      }
    })

    return NextResponse.json({ data: { paymentId: result.paymentId }, error: null })

  } catch (error) {
    await logError({ context: 'unmatched.match', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
