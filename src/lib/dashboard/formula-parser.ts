/**
 * Safe formula parser cho calculated fields.
 * Sử dụng expr-eval với whitelist function set.
 *
 * Cho phép:
 *   - Toán tử: + - * / % ^
 *   - Hàm: abs, ceil, floor, round, min, max, sqrt
 *   - Reference biến qua alias của PivotValue (vd: revenue, count_students)
 *
 * Cấm:
 *   - Function call ngoài whitelist
 *   - Property access (o.x)
 *   - String concat
 *   - Comparison / logic operators (and, or, ...)
 */

import { Parser } from 'expr-eval'

const ALLOWED_FUNCTIONS = ['abs', 'ceil', 'floor', 'round', 'min', 'max', 'sqrt']

/**
 * Tạo Parser instance cấu hình tối thiểu.
 * Tắt tất cả toán tử nguy hiểm.
 */
function createSafeParser(): Parser {
  const parser = new Parser({
    operators: {
      add: true,
      subtract: true,
      multiply: true,
      divide: true,
      remainder: true,
      power: true,
      // Tắt:
      concatenate: false,
      conditional: false,
      logical: false,
      comparison: false,
      'in': false,
      assignment: false,
    },
  })
  return parser
}

export interface FormulaValidationResult {
  ok: boolean
  error?: string
  /** Các alias được formula reference đến */
  variables?: string[]
}

/**
 * Validate formula syntax + whitelist check.
 * KHÔNG execute — chỉ parse + inspect.
 */
export function validateFormula(formula: string, availableAliases: string[]): FormulaValidationResult {
  if (!formula.trim()) return { ok: false, error: 'Công thức trống' }
  if (formula.length > 500) return { ok: false, error: 'Công thức quá dài (max 500 ký tự)' }

  try {
    const parser = createSafeParser()
    const expr = parser.parse(formula)
    const usedVars = expr.variables()
    // Kiểm tra mọi biến phải là alias hợp lệ HOẶC function whitelisted
    const unknownVars = usedVars.filter(v => !availableAliases.includes(v))
    if (unknownVars.length > 0) {
      return {
        ok: false,
        error: `Biến không hợp lệ: ${unknownVars.join(', ')}. Available: ${availableAliases.join(', ')}`,
      }
    }
    // Kiểm tra functions
    const tokens = (expr as unknown as { tokens: Array<{ type?: string; value?: unknown }> }).tokens ?? []
    for (const tok of tokens) {
      if (tok.type === 'IFUNCALL' || tok.type === 'IFUNDEF') {
        const fnName = String(tok.value ?? '')
        if (!ALLOWED_FUNCTIONS.includes(fnName)) {
          return { ok: false, error: `Hàm '${fnName}' không được phép. Allowed: ${ALLOWED_FUNCTIONS.join(', ')}` }
        }
      }
    }
    return { ok: true, variables: usedVars }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Cú pháp không hợp lệ' }
  }
}

/**
 * Evaluate formula với context. Trả về number hoặc null nếu lỗi (div by 0, NaN, ...).
 */
export function evaluateFormula(
  formula: string,
  context: Record<string, number>,
): number | null {
  try {
    const parser = createSafeParser()
    const expr = parser.parse(formula)
    const result = expr.evaluate(context)
    if (typeof result !== 'number' || !Number.isFinite(result)) return null
    return result
  } catch {
    return null
  }
}
