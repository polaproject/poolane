import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { ABSENCE_ALERT_THRESHOLDS, POOL_TICKET } from '@/config/constants'
import { getDemoStudentIds } from '@/lib/demo-account'

// Phase 15 — Rule-based dropout prediction (no LLM)
// Cải thiện vs Phase 12: thêm `recommendation` per HV (priority + action + suggestion + template)

type RiskFactor = { factor: string; weight: number; detail: string }

type Priority = 'critical' | 'high' | 'medium'
type ActionType = 'call' | 'message' | 'offer_pack' | 'assess_skill' | 'follow_up'

interface Recommendation {
  priority: Priority
  action: ActionType
  reason: string
  suggestion: string
  templateMessage: string
}

function calculateRiskScore(factors: RiskFactor[]): number {
  return Math.min(100, factors.reduce((sum, f) => sum + f.weight, 0))
}

/**
 * Decision tree dựa trên combo factors → recommendation cụ thể.
 * Order matters: check critical patterns first.
 */
function generateRecommendation(args: {
  fullName: string
  daysSince: number
  hasDebt: boolean
  debtAmount: number
  sessionsLeft: number | null
  hasTicket: boolean
  recentAttendance: number
  extensionUsed: number
  persistentWeakSkill: string | null
}): Recommendation {
  const { fullName, daysSince, hasDebt, debtAmount, sessionsLeft, hasTicket, extensionUsed, persistentWeakSkill } = args

  // CRITICAL — Vắng lâu + nợ học phí
  if (daysSince > ABSENCE_ALERT_THRESHOLDS.RED_DAYS && hasDebt) {
    return {
      priority: 'critical',
      action: 'call',
      reason: `Vắng ${daysSince} ngày + còn nợ ${debtAmount.toLocaleString('vi-VN')}đ`,
      suggestion: 'Gọi điện hỏi thăm trực tiếp + nhắc đóng nốt học phí. Có thể đề xuất giãn thời hạn nếu khó khăn.',
      templateMessage: `Chào ${fullName} 🌊\n\nLớp Poolane đây! Bạn không xuống nước đã ${daysSince} ngày, lớp lo có gì không ổn. Bạn rảnh có thể gọi mình trao đổi không? Lớp luôn linh động về thời gian học và thanh toán cho học viên có hoàn cảnh khó.\n\nMong tin bạn 💙`,
    }
  }

  // CRITICAL — Vắng lâu + vé hết
  if (daysSince > ABSENCE_ALERT_THRESHOLDS.RED_DAYS && (!hasTicket || sessionsLeft === 0)) {
    return {
      priority: 'critical',
      action: 'offer_pack',
      reason: `Vắng ${daysSince} ngày + vé bơi đã hết`,
      suggestion: 'Liên hệ — đề xuất pack "Quay lại 5 buổi giảm 20%" hoặc voucher comeback. Vé hết là lý do phổ biến HV ngừng học.',
      templateMessage: `Chào ${fullName} 🌊\n\nLớp thấy vé bơi của bạn đã hết và lâu rồi chưa gặp. Lớp tặng bạn voucher giảm 20% nếu mua pack 5 buổi quay lại học trong tuần này. Bạn nghĩ sao?\n\nLớp luôn để dành chỗ cho bạn 💙`,
    }
  }

  // HIGH — Vắng 14-21 ngày + skill yếu kéo dài
  if (daysSince > ABSENCE_ALERT_THRESHOLDS.YELLOW_DAYS && persistentWeakSkill) {
    return {
      priority: 'high',
      action: 'assess_skill',
      reason: `Vắng ${daysSince} ngày + kỹ năng "${persistentWeakSkill}" yếu lặp lại 3+ buổi`,
      suggestion: `HV có thể nản vì kẹt ở "${persistentWeakSkill}". Đề xuất 1 buổi 1-1 cải thiện riêng kỹ năng này.`,
      templateMessage: `Chào ${fullName} 🌊\n\nLớp thấy bạn đã hơi lâu chưa xuống nước. Lớp nhận thấy "${persistentWeakSkill}" của bạn hơi mắc — có khi nào bạn muốn 1 buổi 1-1 riêng để vượt qua không? Lớp sẽ tận tình hỗ trợ.\n\nMong tin bạn 💙`,
    }
  }

  // HIGH — Extension > 10 buổi
  if (extensionUsed > 10) {
    return {
      priority: 'high',
      action: 'assess_skill',
      reason: `Đã ôn luyện ${extensionUsed} buổi — vẫn chưa tốt nghiệp`,
      suggestion: 'Cần đánh giá lại toàn diện. Có thể HV cần chuyển hướng (vd dạy thêm kỹ năng nền tảng) hoặc tạm dừng học.',
      templateMessage: `Chào ${fullName} 🌊\n\nBạn đã ôn luyện ${extensionUsed} buổi rồi — lớp muốn ngồi lại cùng bạn xem có nên điều chỉnh approach không. Bơi không phải đua, có khi đường ngắn chưa hợp với mình. Lớp dành 30 phút trao đổi miễn phí nhé?\n\n💙`,
    }
  }

  // MEDIUM — Vé hết + chưa hết khoá
  if (!hasTicket || sessionsLeft === 0) {
    return {
      priority: 'medium',
      action: 'offer_pack',
      reason: 'Vé bơi đã hết',
      suggestion: 'Đề xuất mua thêm vé. HV có thể quên hoặc đợi đến khi xếp lịch.',
      templateMessage: `Chào ${fullName} 🌊\n\nVé bơi của bạn đã hết rồi. Nhớ mua thêm để tiếp tục các buổi tới nha! Lớp đang đợi bạn 💙\n\nXem các loại vé: https://poolane.vn/student/shop`,
    }
  }

  if (sessionsLeft !== null && sessionsLeft <= POOL_TICKET.LOW_STOCK_ALERT) {
    return {
      priority: 'medium',
      action: 'offer_pack',
      reason: `Vé chỉ còn ${sessionsLeft} buổi`,
      suggestion: 'Nhắc HV mua tiếp để không bị gián đoạn lịch học.',
      templateMessage: `Chào ${fullName} 🌊\n\nVé bơi còn ${sessionsLeft} buổi thôi nha. Mua thêm trước để không phải ngừng học tuần sau nhé 💙\n\nhttps://poolane.vn/student/shop`,
    }
  }

  // MEDIUM — Vắng 14-21 ngày + skill OK
  if (daysSince > ABSENCE_ALERT_THRESHOLDS.YELLOW_DAYS) {
    return {
      priority: 'medium',
      action: 'message',
      reason: `Vắng ${daysSince} ngày`,
      suggestion: 'Nhắc nhở nhẹ nhàng. HV có thể đang bận công việc, không có vấn đề lớn.',
      templateMessage: `Chào ${fullName} 🌊\n\nLớp lâu rồi chưa gặp bạn dưới nước. Bạn vẫn ổn chứ? Khi nào sẵn sàng, lớp luôn đợi bạn quay lại 💙`,
    }
  }

  // Default MEDIUM — follow up
  return {
    priority: 'medium',
    action: 'follow_up',
    reason: 'Theo dõi thêm 1 tuần',
    suggestion: 'Chưa cần action ngay. Đợi 1 tuần xem có signal mạnh hơn không.',
    templateMessage: '',
  }
}

export async function GET() {
  try {
    await requireRole(['admin', 'staff'])

    const now = new Date()

    // Phase 15.2: Exclude demo accounts khỏi dropout prediction (analytics integrity)
    const demoStudentIds = await getDemoStudentIds(prisma)

    // Lấy học viên đang active/extension/enrolled
    const students = await prisma.student.findMany({
      where: {
        status: { in: ['active', 'extension', 'enrolled'] },
        id: { notIn: demoStudentIds },
      },
      include: {
        user: { select: { fullName: true, phone: true } },
        enrollments: {
          where: { status: { in: ['active', 'extension'] } },
          include: { course: true },
        },
        poolTickets: {
          where: { isActive: true },
          orderBy: { purchasedAt: 'desc' },
          take: 1,
        },
        attendances: {
          where: { createdAt: { gte: new Date(now.getTime() - 30 * 86400000) } },
          select: { status: true },
        },
        assessments: {
          orderBy: { sessionNumber: 'desc' },
          take: 3,
          include: { scores: true },
        },
      },
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
      const debtAmount = student.enrollments.reduce(
        (sum, e) => sum + Math.max(0, e.course.price - e.totalPaid),
        0
      )
      const hasDebt = debtAmount > 0
      if (hasDebt) {
        factors.push({ factor: 'Còn nợ học phí', weight: 20, detail: `Nợ ${debtAmount.toLocaleString('vi-VN')}đ` })
      }

      // 3. Vé bơi sắp hết
      const ticket = student.poolTickets[0]
      const sessionsLeft = ticket ? ticket.maxSessions - ticket.sessionsUsed : null
      const hasTicket = !!ticket
      if (!hasTicket) {
        factors.push({ factor: 'Không có vé', weight: 15, detail: 'Chưa có vé bơi hợp lệ' })
      } else if (sessionsLeft !== null && sessionsLeft <= POOL_TICKET.LOW_STOCK_ALERT) {
        factors.push({ factor: 'Vé sắp hết', weight: 15, detail: `Còn ${sessionsLeft} buổi vé` })
      }

      // 4. Tần suất thấp
      const recentAttendance = student.attendances.filter(a => a.status !== 'absent').length
      const expectedSessions = 4
      if (recentAttendance < expectedSessions * 0.5) {
        factors.push({
          factor: 'Tần suất thấp',
          weight: 20,
          detail: `Chỉ đến ${recentAttendance} lần trong 30 ngày qua`,
        })
      }

      // 5. Ôn luyện quá lâu
      let extensionUsed = 0
      if (student.status === 'extension') {
        const enrollment = student.enrollments[0]
        if (enrollment) {
          extensionUsed = enrollment.extensionSessionsUsed
          const extensionDays = extensionUsed > 10 ? 50 : extensionUsed > 5 ? 30 : 0
          if (extensionDays > 0) {
            factors.push({
              factor: 'Ôn luyện lâu',
              weight: extensionDays > 30 ? 20 : 10,
              detail: `${extensionUsed} buổi ôn luyện`,
            })
          }
        }
      }

      // 6. Persistent weak skill — kỹ năng ≤2 lặp lại 3+ assessments gần nhất
      let persistentWeakSkill: string | null = null
      if (student.assessments.length >= 3) {
        // Collect skills appearing ≤2 across all 3 assessments
        const weakSkillCounts: Record<string, number> = {}
        for (const a of student.assessments) {
          for (const sc of a.scores) {
            if (sc.score <= 2) {
              weakSkillCounts[sc.skillKey] = (weakSkillCounts[sc.skillKey] ?? 0) + 1
            }
          }
        }
        const persistentKey = Object.entries(weakSkillCounts).find(([_, count]) => count >= 3)?.[0]
        if (persistentKey) {
          persistentWeakSkill = persistentKey
          factors.push({
            factor: 'Kỹ năng yếu kéo dài',
            weight: 15,
            detail: `${persistentKey} ≤ 2 trong 3 buổi gần nhất`,
          })
        }
      }

      const riskScore = calculateRiskScore(factors)
      const riskLevel: 'low' | 'medium' | 'high' =
        riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low'

      const recommendation = generateRecommendation({
        fullName: student.user.fullName,
        daysSince,
        hasDebt,
        debtAmount,
        sessionsLeft,
        hasTicket,
        recentAttendance,
        extensionUsed,
        persistentWeakSkill,
      })

      return {
        studentId: student.id,
        fullName: student.user.fullName,
        phone: student.user.phone,
        status: student.status,
        riskScore,
        riskLevel,
        factors,
        recommendation,
        // Legacy: giữ suggestedAction cho backward compat
        suggestedAction: recommendation.suggestion,
      }
    })

    // Sort theo priority sau đó risk score
    const priorityOrder: Record<Priority, number> = { critical: 3, high: 2, medium: 1 }
    results.sort((a, b) => {
      const pa = priorityOrder[a.recommendation.priority] ?? 0
      const pb = priorityOrder[b.recommendation.priority] ?? 0
      if (pa !== pb) return pb - pa
      return b.riskScore - a.riskScore
    })

    // Group by priority
    const grouped = {
      critical: results.filter(r => r.recommendation.priority === 'critical'),
      high: results.filter(r => r.recommendation.priority === 'high'),
      medium: results.filter(r => r.recommendation.priority === 'medium'),
    }

    const summary = {
      total: results.length,
      critical: grouped.critical.length,
      high: grouped.high.length,
      medium: grouped.medium.length,
      // Legacy summary cho backward compat
      highRisk: results.filter(r => r.riskLevel === 'high').length,
      mediumRisk: results.filter(r => r.riskLevel === 'medium').length,
      low: results.filter(r => r.riskLevel === 'low').length,
    }

    return NextResponse.json({
      data: { students: results, grouped, summary },
      error: null,
    })
  } catch (error) {
    await logError({ context: 'ai.dropout-risk', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 }
    )
  }
}
