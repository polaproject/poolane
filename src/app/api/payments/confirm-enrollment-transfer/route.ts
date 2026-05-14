import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { logError } from '@/lib/logger'
import { z } from 'zod'
import { confirmEnrollmentTransferShared } from '@/lib/payments/shared-confirm'

const schema = z.object({
  enrollmentId: z.string().uuid(),
  amount: z.number().int().positive(),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(300).optional(),
})

// ─── POST /api/payments/confirm-enrollment-transfer ───
// Admin xác nhận đã nhận học phí qua chuyển khoản
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const result = await confirmEnrollmentTransferShared(parsed.data.enrollmentId, {
      amount: parsed.data.amount,
      referenceNumber: parsed.data.referenceNumber,
      recordedBy: user.id,
      recordedByRole: user.role as 'admin' | 'staff',
      notes: parsed.data.notes,
      source: 'manual',
    })

    if (!result.ok) {
      return NextResponse.json(
        { data: null, error: { code: result.code, message: result.message } },
        { status: result.code === 'NOT_FOUND' ? 404 : result.code === 'INVALID_STATUS' || result.code === 'PAID_FULL' ? 409 : 400 }
      )
    }

    return NextResponse.json({ data: { paymentId: result.paymentId, enrollmentId: parsed.data.enrollmentId }, error: null })

  } catch (error) {
    await logError({ context: 'payment.confirm_enrollment_transfer', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
