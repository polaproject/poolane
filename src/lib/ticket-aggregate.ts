import { POOL_TICKET } from '@/config/constants'

export interface TicketLite {
  id: string
  ticketType: string
  totalSessions: number
  maxSessions: number
  sessionsUsed: number
  pricePaid: number
  purchasedAt: Date
  isActive: boolean
}

export interface TicketAggregate {
  /** Tổng buổi còn lại từ MỌI active ticket. 0 nếu không có ticket nào. */
  sessionsLeft: number
  /** Tổng buổi đã dùng từ MỌI active ticket. */
  sessionsUsed: number
  /** Tổng max buổi từ MỌI active ticket — dùng cho progress bar. */
  maxSessions: number
  /** Số ticket active. */
  ticketCount: number
  /** True nếu KHÔNG có active ticket nào. */
  isNoTicket: boolean
  /** True nếu tổng buổi còn ≤ LOW_STOCK_ALERT (cảnh báo vàng). */
  isLow: boolean
  /** True nếu tổng buổi còn = 0 (hết vé). */
  isOutOfTicket: boolean
  /** Ticket cũ nhất active — dùng cho display "loại vé chính". */
  primaryTicket: TicketLite | null
  /** Toàn bộ active tickets — sort by purchasedAt asc (oldest first). */
  activeTickets: TicketLite[]
}

const TICKET_TYPE_LABELS: Record<string, string> = {
  first: 'Vé lần đầu',
  single: 'Vé lẻ',
  subsequent: 'Vé tiếp theo',
  weekly: 'Vé tuần',
  monthly: 'Vé tháng',
  daily: 'Vé ngày',
}

export function getTicketLabel(ticketType: string): string {
  return TICKET_TYPE_LABELS[ticketType] || 'Vé bơi'
}

/**
 * Aggregate session info across all active pool tickets của 1 HV.
 *
 * Lý do tồn tại (Phase 18.5 bug fix): trước đây UI dùng `poolTickets[0]` →
 * khi HV có 2+ active tickets (vd admin manual create vé first + HV mua vé
 * lẻ qua shop), chỉ hiển thị 1 ticket → user thấy "1 buổi" thay vì tổng 13.
 *
 * Helper này gộp tổng sessions còn lại để UI hiển thị đúng. Attendance API
 * vẫn deduct newest-first (không thay đổi backend semantics).
 */
export function getTicketAggregate(tickets: TicketLite[]): TicketAggregate {
  const active = tickets
    .filter(t => t.isActive)
    .sort((a, b) => a.purchasedAt.getTime() - b.purchasedAt.getTime())

  const sessionsLeft = active.reduce((sum, t) => sum + (t.maxSessions - t.sessionsUsed), 0)
  const sessionsUsed = active.reduce((sum, t) => sum + t.sessionsUsed, 0)
  const maxSessions = active.reduce((sum, t) => sum + t.maxSessions, 0)

  return {
    sessionsLeft,
    sessionsUsed,
    maxSessions,
    ticketCount: active.length,
    isNoTicket: active.length === 0,
    isLow: active.length > 0 && sessionsLeft <= POOL_TICKET.LOW_STOCK_ALERT && sessionsLeft > 0,
    isOutOfTicket: active.length > 0 && sessionsLeft === 0,
    primaryTicket: active[0] ?? null,
    activeTickets: active,
  }
}

/**
 * Trả mảng string cho từng active ticket: ["Vé lần đầu 12/12", "Vé lẻ 3/3"].
 * Format: "{label} {sessionsLeft}/{maxSessions}".
 *
 * UI nên render join(' · ') khi breakdown.length >= 2 — khi chỉ 1 ticket thì
 * không cần breakdown vì số tổng đã rõ.
 */
export function getTicketBreakdown(agg: TicketAggregate): string[] {
  return agg.activeTickets.map(t => {
    const left = t.maxSessions - t.sessionsUsed
    return `${getTicketLabel(t.ticketType)} ${left}/${t.maxSessions}`
  })
}
