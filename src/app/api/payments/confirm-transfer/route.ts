import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { logError } from '@/lib/logger'
import { z } from 'zod'
import { confirmOrderTransfer } from '@/lib/payments/shared-confirm'

const schema = z.object({
  orderId: z.string().uuid(),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(300).optional(),
})

// ─── POST /api/payments/confirm-transfer ───
// Admin/staff đã đối chiếu sao kê và bấm xác nhận → tạo Payment + paid order
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } }, { status: 400 })
    }

    const result = await confirmOrderTransfer(parsed.data.orderId, {
      amount: 0, // shared dùng order.finalAmount, không cần input cho order
      referenceNumber: parsed.data.referenceNumber,
      recordedBy: user.id,
      recordedByRole: user.role as 'admin' | 'staff',
      notes: parsed.data.notes,
      source: 'manual',
    })

    if (!result.ok) {
      return NextResponse.json(
        { data: null, error: { code: result.code, message: result.message } },
        { status: result.code === 'NOT_FOUND' ? 404 : 409 }
      )
    }

    return NextResponse.json({ data: { paymentId: result.paymentId, orderId: parsed.data.orderId }, error: null })

  } catch (error) {
    await logError({ context: 'payment.confirm_transfer', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
