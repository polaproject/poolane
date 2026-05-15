import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { log, logError } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron/auth'
import { getDemoStudentIds } from '@/lib/demo-account'

// ─── GET /api/cron/reconciliation — Daily 6am ───
// Đối chiếu dữ liệu, notify admin nếu có critical issues
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  try {
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart.getTime() + 86400000)

    // Phase 15.2: Exclude demo accounts khỏi reconciliation (analytics integrity)
    const demoStudentIds = await getDemoStudentIds(prisma)

    // Check 1: Order paid → có Payment?
    const recentPaidOrders = await prisma.order.findMany({
      where: {
        status: 'paid',
        createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
        studentId: { notIn: demoStudentIds },
      },
      select: { id: true, studentId: true }
    })

    let missingPayment = 0
    for (const o of recentPaidOrders) {
      const p = await prisma.payment.findFirst({
        where: { studentId: o.studentId, type: 'shop', referenceType: 'order', referenceId: o.id }
      })
      if (!p) missingPayment++
    }

    // Check 2: Sức chứa buổi học
    const sessionsToday = await prisma.classSession.findMany({
      where: { date: { gte: dayStart, lt: dayEnd } },
      include: { registrations: { where: { status: 'approved' }, select: { id: true } } }
    })
    const overcap = sessionsToday.filter(s => {
      const cap = s.timeSlot === 'morning' ? 5 : 7
      return s.registrations.length > cap
    })

    const critical = missingPayment > 0 || overcap.length > 0

    if (critical) {
      const admins = await prisma.user.findMany({ where: { role: 'admin', isActive: true }, select: { id: true } })
      const msg = [
        missingPayment > 0 && `${missingPayment} order paid thiếu Payment record`,
        overcap.length > 0 && `${overcap.length} buổi học vượt sức chứa`,
      ].filter(Boolean).join(' · ')

      await prisma.notification.createMany({
        data: admins.map(a => ({
          userId: a.id,
          type: 'general',
          title: '⚠️ Đối chiếu phát hiện vấn đề',
          body: msg,
          actionUrl: '/admin/reports',
        }))
      })
    }

    log.info('cron.reconciliation', `Reconciliation ${critical ? 'CRITICAL' : 'OK'}`, { missingPayment, overcap: overcap.length })
    return NextResponse.json({
      data: {
        status: critical ? 'critical' : 'ok',
        missingPayment,
        overcap: overcap.length,
      },
      error: null
    })

  } catch (error) {
    await logError({ context: 'cron.reconciliation', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
