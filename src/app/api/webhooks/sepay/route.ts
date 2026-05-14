import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import {
  verifySepayAuth,
  parseMemo,
  findOrderByShortId,
  findEnrollmentByShortId,
  isSepayIdProcessed,
  type SepayPayload,
} from '@/lib/payments/sepay'
import {
  confirmOrderTransfer,
  confirmEnrollmentTransferShared,
} from '@/lib/payments/shared-confirm'

// ─── POST /api/webhooks/sepay ───
// Sepay sẽ POST mỗi khi có giao dịch vào tài khoản đã liên kết.
// Trả về 200 cho mọi case xử lý được (kể cả unmatched) để Sepay không retry.
// Trả 401 nếu auth fail. Trả 500 nếu lỗi server thật sự.
export async function POST(request: NextRequest) {
  // Auth check
  if (!verifySepayAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await request.json() as SepayPayload

    // Chỉ xử lý tiền vào
    if (payload.transferType !== 'in') {
      log.info('sepay.webhook', 'Bỏ qua transferType=out', { sepayId: payload.id })
      return NextResponse.json({ success: true, skipped: 'transfer_out' })
    }

    // Idempotency
    if (await isSepayIdProcessed(payload.id)) {
      log.info('sepay.webhook', 'Duplicate sepayId, skip', { sepayId: payload.id })
      return NextResponse.json({ success: true, skipped: 'duplicate' })
    }

    const memo = parseMemo(payload.content)

    if (!memo) {
      // Không match memo → lưu unmatched
      await saveUnmatched(payload, 'no_memo')
      await notifyAdminUnmatched(payload, 'Không tìm thấy mã POLA/POLAE')
      return NextResponse.json({ success: true, matched: false, reason: 'no_memo' })
    }

    // Tìm order/enrollment match
    if (memo.type === 'order') {
      const orderId = await findOrderByShortId(memo.shortId)
      if (!orderId) {
        await saveUnmatched(payload, 'order_not_found')
        await notifyAdminUnmatched(payload, `Memo POLA${memo.shortId} không khớp đơn nào`)
        return NextResponse.json({ success: true, matched: false, reason: 'order_not_found' })
      }

      const result = await confirmOrderTransfer(orderId, {
        amount: payload.transferAmount,
        referenceNumber: payload.referenceCode || `POLA${memo.shortId}`,
        recordedBy: 'system',
        recordedByRole: 'system',
        notes: `Sepay tx ${payload.id} · ${payload.gateway ?? 'bank'} · ${payload.transactionDate}`,
        source: 'sepay',
      })

      if (!result.ok) {
        // Đơn không ở status approved (vd đã paid rồi) → lưu unmatched + notify
        await saveUnmatched(payload, `order_${result.code.toLowerCase()}`)
        await notifyAdminUnmatched(payload, `Đơn ${orderId.slice(0,8)} không thể auto-confirm: ${result.message}`)
        return NextResponse.json({ success: true, matched: false, reason: result.code })
      }

      // Record sepayId vào audit log để chống duplicate (đã có trong shared-confirm afterData nhưng add explicit field)
      await prisma.auditLog.create({
        data: {
          userId: null,
          role: 'system',
          action: 'sepay.webhook_processed',
          entityType: 'order',
          entityId: orderId,
          afterData: { sepayId: payload.id, paymentId: result.paymentId, amount: payload.transferAmount },
        }
      })

      log.info('sepay.webhook', `Auto-confirmed order ${orderId}`, { sepayId: payload.id, paymentId: result.paymentId })
      return NextResponse.json({ success: true, matched: true, type: 'order', orderId })
    }

    // type === 'enrollment'
    const enrollmentId = await findEnrollmentByShortId(memo.shortId)
    if (!enrollmentId) {
      await saveUnmatched(payload, 'enrollment_not_found')
      await notifyAdminUnmatched(payload, `Memo POLAE${memo.shortId} không khớp khoá nào`)
      return NextResponse.json({ success: true, matched: false, reason: 'enrollment_not_found' })
    }

    const result = await confirmEnrollmentTransferShared(enrollmentId, {
      amount: payload.transferAmount,
      referenceNumber: payload.referenceCode || `POLAE${memo.shortId}`,
      recordedBy: 'system',
      recordedByRole: 'system',
      notes: `Sepay tx ${payload.id} · ${payload.gateway ?? 'bank'} · ${payload.transactionDate}`,
      source: 'sepay',
    })

    if (!result.ok) {
      await saveUnmatched(payload, `enrollment_${result.code.toLowerCase()}`)
      await notifyAdminUnmatched(payload, `Khoá ${enrollmentId.slice(0,8)} không thể auto-confirm: ${result.message}`)
      return NextResponse.json({ success: true, matched: false, reason: result.code })
    }

    await prisma.auditLog.create({
      data: {
        userId: null,
        role: 'system',
        action: 'sepay.webhook_processed',
        entityType: 'enrollment',
        entityId: enrollmentId,
        afterData: { sepayId: payload.id, paymentId: result.paymentId, amount: payload.transferAmount },
      }
    })

    log.info('sepay.webhook', `Auto-confirmed enrollment ${enrollmentId}`, { sepayId: payload.id, paymentId: result.paymentId })
    return NextResponse.json({ success: true, matched: true, type: 'enrollment', enrollmentId })

  } catch (error) {
    await logError({ context: 'sepay.webhook', message: 'Failed', error })
    // Trả 500 → Sepay retry
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ─── Helpers ───
async function saveUnmatched(payload: SepayPayload, reasonCode: string) {
  try {
    await prisma.unmatchedTransaction.create({
      data: {
        sepayId: payload.id,
        gateway: payload.gateway ?? null,
        transactionDate: new Date(payload.transactionDate),
        accountNumber: payload.accountNumber ?? null,
        content: payload.content,
        amount: payload.transferAmount,
        referenceCode: payload.referenceCode ?? null,
        rawPayload: payload as never,
        status: 'pending',
        notes: `auto_reason=${reasonCode}`,
      }
    })
  } catch (e) {
    // Có thể trùng sepayId (unique) — không cần xử lý
    log.warn('sepay.unmatched', 'Failed save unmatched', { sepayId: payload.id, err: String(e) })
  }
}

async function notifyAdminUnmatched(payload: SepayPayload, reason: string) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['admin', 'staff'] }, isActive: true },
      select: { id: true }
    })
    if (admins.length === 0) return
    await prisma.notification.createMany({
      data: admins.map(a => ({
        userId: a.id,
        type: 'general',
        title: '⚠️ Giao dịch Sepay chưa khớp',
        body: `${payload.transferAmount.toLocaleString('vi-VN')}đ - ${reason}. Vào /admin/finance/unmatched để xử lý.`,
        actionUrl: '/admin/finance/unmatched',
      }))
    })
  } catch (e) {
    log.warn('sepay.notify', 'Failed notify admins', { err: String(e) })
  }
}
