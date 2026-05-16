import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { verifyIpnSignature } from '@/lib/payments/momo'
import { sendEmail } from '@/lib/email/client'
import { paymentReceiptEmail } from '@/lib/email/templates'

// ─── POST /api/webhooks/momo — MoMo IPN callback ───
// MoMo gửi server-to-server sau khi user thanh toán
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    log.info('momo.ipn', 'IPN received', {
      orderId: body.orderId,
      resultCode: body.resultCode,
      transId: body.transId
    })

    // Verify signature
    if (!verifyIpnSignature(body)) {
      await logError({ context: 'momo.ipn', message: 'Invalid signature', inputData: body })
      return NextResponse.json({ resultCode: 5, message: 'Invalid signature' }, { status: 400 })
    }

    // Tìm GatewayTransaction
    const gt = await prisma.gatewayTransaction.findUnique({
      where: { requestId: body.requestId }
    })

    if (!gt) {
      await logError({ context: 'momo.ipn', message: 'Transaction not found', inputData: { requestId: body.requestId } })
      return NextResponse.json({ resultCode: 1, message: 'Transaction not found' }, { status: 404 })
    }

    // Idempotency: nếu đã processed thì return OK
    if (gt.status === 'success' || gt.status === 'failed') {
      log.info('momo.ipn', 'Already processed', { requestId: body.requestId })
      return NextResponse.json({ resultCode: 0, message: 'Already processed' })
    }

    const isSuccess = body.resultCode === 0

    if (!isSuccess) {
      await prisma.gatewayTransaction.update({
        where: { id: gt.id },
        data: {
          status: 'failed',
          rawResponse: body as never,
          errorMessage: body.message ?? 'Failed',
          completedAt: new Date(),
        }
      })
      log.warn('momo.ipn', `Payment failed: ${body.message}`)
      return NextResponse.json({ resultCode: 0, message: 'OK' })
    }

    // Success → process payment
    if (!gt.studentId || !gt.referenceType || !gt.referenceId) {
      await logError({ context: 'momo.ipn', message: 'Missing reference info', inputData: { gtId: gt.id } })
      return NextResponse.json({ resultCode: 0, message: 'OK but reference missing' })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Tạo Payment record
      const payment = await tx.payment.create({
        data: {
          studentId: gt.studentId!,
          amount: gt.amount,
          type: gt.referenceType === 'order' ? 'shop' : gt.referenceType === 'enrollment' ? 'course_fee' : 'adjustment',
          referenceType: gt.referenceType,
          referenceId: gt.referenceId,
          paymentMethod: 'card',
          referenceNumber: String(body.transId),
          recordedBy: gt.studentId!, // HV tự thanh toán
          notes: `Thanh toán MoMo - ${gt.orderInfo}`,
          gatewayName: 'momo',
          gatewayTransactionId: String(body.transId),
          gatewayStatusCode: String(body.resultCode),
        }
      })

      // 2. Update GatewayTransaction
      await tx.gatewayTransaction.update({
        where: { id: gt.id },
        data: {
          status: 'success',
          rawResponse: body as never,
          paymentId: payment.id,
          completedAt: new Date(),
        }
      })

      // 3. Update Order/Enrollment status
      if (gt.referenceType === 'order') {
        const order = await tx.order.findUnique({
          where: { id: gt.referenceId! },
          include: { orderItems: { include: { product: true } } }
        })
        if (order) {
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'paid' }
          })

          // Auto-create ImprovementSessionPack
          for (const item of order.orderItems) {
            if (item.product.type === 'improvement_pack' && item.product.sessionsCount) {
              for (let i = 0; i < item.quantity; i++) {
                await tx.improvementSessionPack.create({
                  data: {
                    studentId: order.studentId,
                    orderId: order.id,
                    sessionsPurchased: item.product.sessionsCount,
                    expiresAt: new Date(Date.now() + 90 * 86400000),
                  }
                })
              }
            }
            // Trừ stock physical
            if (item.product.type === 'physical' && item.product.stockQuantity !== null) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stockQuantity: { decrement: item.quantity } }
              })
            }
          }
        }
      } else if (gt.referenceType === 'enrollment') {
        const enrollment = await tx.enrollment.findUnique({
          where: { id: gt.referenceId! },
          include: { course: true }
        })
        if (enrollment) {
          const newTotalPaid = enrollment.totalPaid + gt.amount
          await tx.enrollment.update({
            where: { id: enrollment.id },
            data: {
              totalPaid: newTotalPaid,
              paymentDeadline: newTotalPaid >= enrollment.course.price ? null : enrollment.paymentDeadline,
            }
          })
          // Auto-upgrade student status nếu đóng đủ
          if (newTotalPaid >= enrollment.course.price) {
            await tx.student.update({
              where: { id: enrollment.studentId },
              data: { status: 'active' }
            })
          }
        }
      }

      // 4. Notification cho HV
      const student = await tx.student.findUnique({
        where: { id: gt.studentId! },
        include: { user: { select: { fullName: true, email: true, id: true } } }
      })
      if (student) {
        await tx.notification.create({
          data: {
            userId: student.user.id,
            studentId: gt.studentId!,
            type: 'general',
            title: '✓ Thanh toán MoMo thành công',
            body: `Đã ghi nhận ${gt.amount.toLocaleString('vi-VN')}đ. Cảm ơn bạn 💙`,
            actionUrl: '/student/payments',
            metadata: { paymentId: payment.id, amount: gt.amount },
          }
        })
      }

      return { payment, student }
    })

    // Send email biên lai (fire-and-forget, sau transaction)
    if (result.student?.user.email && !result.student.user.email.endsWith('@poolane.local')) {
      const tmpl = paymentReceiptEmail({
        fullName: result.student.user.fullName,
        amount: gt.amount,
        type: 'Thanh toán MoMo',
        paymentMethod: 'MoMo',
        recordedAt: new Date(),
        referenceNumber: String(body.transId),
      })
      sendEmail({ to: result.student.user.email, ...tmpl }).catch(() => {})
    }

    log.info('momo.ipn', `Payment ${result.payment.id} created successfully`)
    return NextResponse.json({ resultCode: 0, message: 'Success' })

  } catch (error) {
    await logError({ context: 'momo.ipn', message: 'Webhook failed', error })
    return NextResponse.json({ resultCode: 99, message: 'Internal error' }, { status: 500 })
  }
}
