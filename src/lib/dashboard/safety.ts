/**
 * Safety limits cho query execution.
 * Tránh runaway query, OOM, hoặc DB lock.
 */

import type { WidgetConfig } from './types'

export const QUERY_LIMITS = {
  MAX_JOINS: 3,
  MAX_ROWS: 10000,
  STATEMENT_TIMEOUT_MS: 10_000,
  MAX_PIVOT_DIMENSIONS: 4,    // tổng rows + cols
  MAX_VALUES: 8,              // tổng values + calculated
}

export interface SafetyCheckResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate widget config trước khi build SQL.
 * Errors = block execution. Warnings = show UI but allow.
 */
export function checkWidgetSafety(config: WidgetConfig): SafetyCheckResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Joins
  if (config.joins.length > QUERY_LIMITS.MAX_JOINS) {
    errors.push(`Quá nhiều join (${config.joins.length} > ${QUERY_LIMITS.MAX_JOINS}). Giảm bớt để query nhanh hơn.`)
  } else if (config.joins.length >= 2) {
    warnings.push(`Join ${config.joins.length} bảng — query có thể chậm. Hãy thêm time range filter để giới hạn data.`)
  }

  // Dimensions
  const totalDims = config.rows.length + config.columns.length
  if (totalDims > QUERY_LIMITS.MAX_PIVOT_DIMENSIONS) {
    errors.push(`Quá nhiều chiều pivot (${totalDims} > ${QUERY_LIMITS.MAX_PIVOT_DIMENSIONS}). Pivot quá chi tiết sẽ khó đọc.`)
  }

  // Values
  const totalValues = config.values.length + config.calculatedFields.length
  if (totalValues === 0 && config.visualization.type !== 'pivot') {
    errors.push('Cần ít nhất 1 chỉ số (Value) để tính. Vd: COUNT(students.id), SUM(payments.amount).')
  }
  if (totalValues > QUERY_LIMITS.MAX_VALUES) {
    errors.push(`Quá nhiều chỉ số (${totalValues} > ${QUERY_LIMITS.MAX_VALUES}).`)
  }

  // KPI cần đúng 1 value (rows/cols rỗng)
  if (config.visualization.type === 'kpi') {
    if (config.rows.length > 0 || config.columns.length > 0) {
      warnings.push('KPI card chỉ hiển thị 1 số. Rows/Columns sẽ bị bỏ qua.')
    }
    if (totalValues !== 1) {
      errors.push('KPI card cần đúng 1 chỉ số.')
    }
  }

  // Heatmap cần đúng 2 dimensions + 1 value
  if (config.visualization.type === 'heatmap') {
    if (config.rows.length === 0 || config.columns.length === 0) {
      errors.push('Heatmap cần ít nhất 1 chiều Row + 1 chiều Column.')
    }
    if (totalValues !== 1) {
      errors.push('Heatmap chỉ render 1 chỉ số tại một thời điểm.')
    }
  }

  // Root table required
  if (!config.rootTable) {
    errors.push('Chưa chọn bảng gốc.')
  }

  return { ok: errors.length === 0, errors, warnings }
}

/**
 * Build PostgreSQL statement_timeout command (chạy trước query chính).
 * Cách an toàn để cancel query nếu vượt 10s.
 */
export function buildTimeoutStatement(): string {
  return `SET LOCAL statement_timeout = ${QUERY_LIMITS.STATEMENT_TIMEOUT_MS}`
}
