import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { ABSENCE_ALERT_THRESHOLDS, POOL_TICKET } from '@/config/constants'

// Rule-based dropout risk prediction (không cần ML model)
// Dự đoán dựa trên các tín hiệu: vắng học, vé bơi, nợ học phí, tiến độ kỹ năng

type RiskFactor = { factor: string; weight: number; detail: string }

function calculateRiskScore(factors: RiskFactor[]): number {
  return Math.min(100, factors.reduce((sum, f) => sum + f.weight, 0))
}

export async function GET() {
  try {
    await requireRole(['admin', 'staff'])

    const now = new Date()

    // Lấy học viên đang active/extension
    const students = await prisma.student.findMany({
      where: { status: { in: ['active', 'extension', 'enrolled'] } },
      include: {
        user: { select: { fullName: true, phone: true } },
        enrollments: {
          where: { status: { in: ['active', 'extension'] } },
          include: { course: true }
        },
        poolTickets: {
          where: { isActive: true },
          orderBy: { purchasedAt: 'desc' },
          take: 1
        },
        attendances: {
          where: { createdAt: { gte: new Date(now.getTime() - 30 * 86400000) } },
          select: { status: true }
        }
      }
    })

    const results = students.map(student => {
      const factors: RiskFactor[] = []

      // 1. Vắng học
      const daysSince = student.lastAttendedAt
        ? Math.floor((now.getTime() - student.lastAttendedAt.getTime()) / 86400000)
        : Math.floor((now.getTime() - student.createdAt.getTime()) / 86400000)

      if (daysSince > ABSENCE_ALERT_THRESHOLDS.RED_DAYS) {
        factors.push({ factor: 'Vắng lâu', weight: 40, detail: `${daysSince} ngày không đến bể` })
      } else if (daysSince > ABSENCE_ALERT_THRESHOLDS.YELLOW_DAYS) {
        factors.push({ factor: 'Vắng nhiều', weight: 25, detail: `${daysSince} ngày không đến bể` })
      }

      // 2. Nợ học phí
      const hasDebt = student.enrollments.some(e => e.totalPaid < e.course.price)
      if (hasDebt) {
        factors.push({ factor: 'Còn nợ học phí', weight: 20, detail: 'Chưa đóng đủ học phí' })
      }

      // 3. Vé bơi sắp hết
      const ticket = student.poolTickets[0]
      if (!ticket) {
        factors.push({ factor: 'Không có vé', weight: 15, detail: 'Chưa có vé bơi hợp lệ' })
      } else {
        const sessionsLeft = ticket.maxSessions - ticket.sessionsUsed
        if (sessionsLeft <= POOL_TICKET.LOW_STOCK_ALERT) {
          factors.push({ factor: 'Vé sắp hết', weight: 15, detail: `Còn ${sessionsLeft} buổi vé` })
        }
      }

      // 4. Tần suất thấp (< 1 lần/tuần trong 30 ngày qua)
      const recentAttendance = student.attendances.filter(a => a.status !== 'absent').length
      const expectedSessions = 4 // ~1 lần/tuần × 4 tuần
      if (recentAttendance < expectedSessions * 0.5) {
        factors.push({ factor: 'Tần suất thấp', weight: 20, detail: `Chỉ đến ${recentAttendance} lần trong 30 ngày qua` })
      }

      // 5. Ôn luyện quá lâu
      if (student.status === 'extension') {
        const enrollment = student.enrollments[0]
        if (enrollment) {
          const extensionDays = enrollment.extensionSessionsUsed > 10 ? 50 : enrollment.extensionSessionsUsed > 5 ? 30 : 0
          if (extensionDays > 0) {
            factors.push({ factor: 'Ôn luyện lâu', weight: extensionDays > 30 ? 20 : 10, detail: `${enrollment.extensionSessionsUsed} buổi ôn luyện` })
          }
        }
      }

      const riskScore = calculateRiskScore(factors)
      const riskLevel: 'low' | 'medium' | 'high' = riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low'

      return {
        studentId: student.id,
        fullName: student.user.fullName,
        phone: student.user.phone,
        status: student.status,
        riskScore,
        riskLevel,
        factors,
        suggestedAction: riskLevel === 'high'
          ? 'Liên hệ ngay — nguy cơ bỏ học cao'
          : riskLevel === 'medium'
            ? 'Nhắc nhở nhẹ nhàng'
            : 'Theo dõi bình thường',
      }
    })

    // Sắp xếp theo risk score giảm dần
    results.sort((a, b) => b.riskScore - a.riskScore)

    const summary = {
      total: results.length,
      high: results.filter(r => r.riskLevel === 'high').length,
      medium: results.filter(r => r.riskLevel === 'medium').length,
      low: results.filter(r => r.riskLevel === 'low').length,
    }

    return NextResponse.json({ data: { students: results, summary }, error: null })

  } catch (error) {
    await logError({ context: 'ai.dropout-risk', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
