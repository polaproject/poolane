import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { reverseTransactionSchema } from '@/lib/validations/transaction'

type Params = { params: Promise<{ paymentId: string }> }

/**
 * POST /api/admin/transactions/[paymentId]/reverse — Admin đảo bút toán.
 *
 * KHÔNG xoá Payment gốc — chỉ tạo Payment NEW với:
 *   - amount = -original.amount (negate)
 *   - isReversal = true
 *   - notes link tới original.id + lý do
 *   - excludeFromRevenue inherit từ original
 *
 * Forward-only audit: lịch sử nguyên vẹn, doanh thu tự balance (positive + negative).
 *
 * Quy tắc:
 *   - Không đảo Payment đã là reversal (chống infinite chain)
 *   - Không đảo lại Payment đã có reversal khác (1 Payment chỉ đảo được 1 lần)
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin'])
    const { paymentId } = await params
    const body = await request.json()
    const parsed = reverseTransactionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Lý do không hợp lệ',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      )
    }

    const { reason } = parsed.data

    const original = await prisma.payment.findUnique({ where: { id: paymentId } })
    if (!original) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy giao dịch' } },
        { status: 404 },
      )
    }

    if (original.isReversal) {
      return NextResponse.json(
        {
          data: null,
          error: { code: 'IS_REVERSAL', message: 'Không thể đảo bút toán đảo' },
        },
        { status: 409 },
      )
    }

    // Check đã có reversal cho payment này chưa (idempotency)
    const existingReversal = await prisma.payment.findFirst({
      where: {
        isReversal: true,
        studentId: original.studentId,
        notes: { contains: original.id.slice(0, 8).toUpperCase() },
      },
    })
    if (existingReversal) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'ALREADY_REVERSED',
            message: 'Giao dịch này đã có bút toán đảo',
          },
        },
        { status: 409 },
      )
    }

    const reversal = await prisma.$transaction(async (tx) => {
      const r = await tx.payment.create({
        data: {
          studentId: original.studentId,
          amount: -original.amount,
          type: original.type,
          referenceType: original.referenceType,
          referenceId: original.referenceId,
          paymentMethod: original.paymentMethod,
          recordedBy: user.id,
          notes: `Đảo bút toán ${original.id.slice(0, 8).toUpperCase()}: ${reason}`,
          isReversal: true,
          excludeFromRevenue: original.excludeFromRevenue,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          role: 'admin',
          action: 'payment.reverse',
          entityType: 'payment',
          entityId: r.id,
          beforeData: {
            originalPaymentId: original.id,
            originalAmount: original.amount,
            originalType: original.type,
          },
          afterData: {
            reversalId: r.id,
            amount: -original.amount,
            reason,
          },
        },
      })

      return r
    })

    log.info('payment.reverse', `Reversed payment ${original.id} by ${user.id}`, {
      reversalId: reversal.id,
      amount: reversal.amount,
    })

    return NextResponse.json({ data: { reversal }, error: null })
  } catch (error) {
    await logError({
      context: 'payment.reverse',
      message: 'Failed to reverse payment',
      error,
    })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 },
    )
  }
}
