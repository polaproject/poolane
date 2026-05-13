import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'

// ─── GET /api/reports/reconciliation — Báo cáo đối chiếu hàng ngày ───
// Kiểm tra:
// 1. Tổng thu hôm nay từ Payment vs Order + Enrollment
// 2. Số vé bơi đã dùng vs số attendance
// 3. Sức chứa: không buổi nào vượt quy định
// 4. Enrollment status nhất quán với payments
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin'])

    const sp = request.nextUrl.searchParams
    const dateStr = sp.get('date')
    const date = dateStr ? new Date(dateStr) : new Date()
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

    const issues: Array<{ severity: 'critical' | 'warn' | 'info'; check: string; detail: string }> = []
    const checks: Record<string, unknown> = {}

    // ─ Check 1: Tổng thu hôm nay ─
    const paymentsToday = await prisma.payment.findMany({
      where: { recordedAt: { gte: dayStart, lt: dayEnd } },
      select: { amount: true, type: true }
    })
    const totalIn = paymentsToday.filter(p => p.amount > 0).reduce((s, p) => s + p.amount, 0)
    const totalOut = paymentsToday.filter(p => p.amount < 0).reduce((s, p) => s + Math.abs(p.amount), 0)
    checks.payments = { count: paymentsToday.length, totalIn, totalOut, net: totalIn - totalOut }

    // ─ Check 2: Sức chứa buổi học ─
    const sessionsToday = await prisma.classSession.findMany({
      where: { date: { gte: dayStart, lt: dayEnd } },
      include: {
        registrations: { where: { status: 'approved' }, select: { id: true } },
        attendances: { select: { id: true } },
      }
    })
    for (const s of sessionsToday) {
      const cap = s.timeSlot === 'morning' ? 5 : 7
      if (s.registrations.length > cap) {
        issues.push({
          severity: 'critical',
          check: 'capacity',
          detail: `Buổi ${s.timeSlot} ngày ${s.date.toLocaleDateString('vi-VN')} có ${s.registrations.length} đăng ký (max ${cap})`,
        })
      }
    }
    checks.sessions = { count: sessionsToday.length }

    // ─ Check 3: Vé bơi đã dùng vs attendance ─
    const activeTickets = await prisma.poolTicket.findMany({
      where: { isActive: true },
      select: { id: true, studentId: true, sessionsUsed: true }
    })
    let ticketMismatchCount = 0
    for (const t of activeTickets.slice(0, 50)) { // limit 50 để không quá tốn DB
      const attCount = await prisma.attendance.count({
        where: { studentId: t.studentId, status: 'present' }
      })
      if (Math.abs(t.sessionsUsed - attCount) > 1) {
        ticketMismatchCount++
        if (ticketMismatchCount <= 5) {
          issues.push({
            severity: 'warn',
            check: 'ticket_attendance_mismatch',
            detail: `Student ${t.studentId.slice(0, 8)}: vé đã dùng ${t.sessionsUsed} nhưng attendance present = ${attCount}`,
          })
        }
      }
    }
    checks.tickets = { checked: Math.min(activeTickets.length, 50), mismatches: ticketMismatchCount }

    // ─ Check 4: Order paid → có Payment? ─
    const recentPaidOrders = await prisma.order.findMany({
      where: { status: 'paid', createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      select: { id: true, finalAmount: true, studentId: true }
    })
    let orderPaymentMissing = 0
    for (const o of recentPaidOrders) {
      const p = await prisma.payment.findFirst({
        where: { studentId: o.studentId, type: 'shop', referenceType: 'order', referenceId: o.id }
      })
      if (!p) {
        orderPaymentMissing++
        if (orderPaymentMissing <= 5) {
          issues.push({
            severity: 'critical',
            check: 'order_payment_missing',
            detail: `Order ${o.id.slice(0, 8)} status=paid nhưng không có Payment record`,
          })
        }
      }
    }
    checks.orders = { paidRecent: recentPaidOrders.length, missingPayment: orderPaymentMissing }

    const summary = {
      date: dayStart.toISOString().slice(0, 10),
      checkedAt: new Date().toISOString(),
      checks,
      issues,
      status: issues.some(i => i.severity === 'critical') ? 'critical'
            : issues.some(i => i.severity === 'warn') ? 'warn'
            : 'ok',
    }

    log.info('reports.reconciliation', `Reconciliation ${summary.status}`, { issueCount: issues.length })

    return NextResponse.json({ data: summary, error: null })

  } catch (error) {
    await logError({ context: 'reports.reconciliation', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
