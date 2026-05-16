/**
 * Format library cho dashboard values.
 * Resolve priority: per-widget override → column default (from registry) → global settings → fallback.
 */

import type { AmountStyle, ColumnFormat } from './types'
import type { ColumnMeta } from './schema-registry'

export interface GlobalFormatSettings {
  amountStyle: AmountStyle
  percentDecimals: number
  thousandSeparator: '.' | ','
}

export const DEFAULT_GLOBAL_FORMAT: GlobalFormatSettings = {
  amountStyle: 'vn_full',
  percentDecimals: 1,
  thousandSeparator: '.',
}

/** Format số VND theo style đã chọn */
export function formatAmount(
  value: number | null | undefined,
  style: AmountStyle = 'vn_full',
  thousandSep: '.' | ',' = '.',
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  switch (style) {
    case 'vn_compact': {
      // 1.300.000 → 1,3M; 32.000.000 → 32M; 950.000 → 950k
      if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1).replace('.', ',')}B`
      if (abs >= 1_000_000) {
        const m = abs / 1_000_000
        return `${sign}${(m >= 10 ? m.toFixed(0) : m.toFixed(1).replace('.', ','))}M`
      }
      if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}k`
      return `${sign}${abs}`
    }
    case 'no_symbol':
      return `${sign}${formatThousand(abs, thousandSep)}`
    case 'us':
      return `${sign}$${formatThousand(abs, ',')}`
    case 'vn_full':
    default:
      return `${sign}${formatThousand(abs, thousandSep)}đ`
  }
}

function formatThousand(value: number, sep: '.' | ','): string {
  const fixed = Math.round(value).toString()
  return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, sep)
}

/** Format % với số decimal đã chọn */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return `${value.toFixed(decimals)}%`
}

/** Format date đơn giản DD/MM/YYYY */
export function formatDate(value: string | Date | null | undefined, pattern = 'DD/MM/YYYY'): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  if (isNaN(d.getTime())) return '—'
  const pad = (n: number) => n.toString().padStart(2, '0')
  return pattern
    .replace('DD', pad(d.getDate()))
    .replace('MM', pad(d.getMonth() + 1))
    .replace('YYYY', d.getFullYear().toString())
    .replace('YY', d.getFullYear().toString().slice(-2))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
}

/**
 * Resolve format cuối cùng cho 1 cell:
 *   per-widget override > column default > global > fallback
 */
export function resolveFormat(
  perWidgetOverride: ColumnFormat | null | undefined,
  columnMeta: ColumnMeta | null | undefined,
  global: GlobalFormatSettings = DEFAULT_GLOBAL_FORMAT,
): { type: 'number' | 'currency' | 'percent' | 'date' | 'text'; format: ColumnFormat; global: GlobalFormatSettings } {
  const columnDefault = columnMeta?.defaultFormat
  const fmt: ColumnFormat = {
    ...columnDefault,
    ...perWidgetOverride,
  }
  let type: 'number' | 'currency' | 'percent' | 'date' | 'text' = fmt.type ?? 'text'
  // Auto-detect nếu type chưa set
  if (!fmt.type) {
    if (columnMeta?.type === 'number') type = 'number'
    else if (columnMeta?.type === 'date') type = 'date'
  }
  return { type, format: fmt, global }
}

/** Top-level format function — gọi từ widget renderer */
export function formatValue(
  value: number | string | Date | null | undefined,
  options: {
    perWidgetOverride?: ColumnFormat | null
    columnMeta?: ColumnMeta | null
    global?: GlobalFormatSettings
  } = {},
): string {
  if (value === null || value === undefined) return '—'
  const { type, format, global } = resolveFormat(
    options.perWidgetOverride,
    options.columnMeta,
    options.global ?? DEFAULT_GLOBAL_FORMAT,
  )

  const num = typeof value === 'number' ? value : Number(value)

  switch (type) {
    case 'currency':
      return formatAmount(num, format.amountStyle ?? global.amountStyle, global.thousandSeparator)
    case 'percent':
      return formatPercent(num, format.decimals ?? global.percentDecimals)
    case 'number': {
      if (!Number.isFinite(num)) return String(value)
      const decimals = format.decimals ?? 0
      const formatted = decimals > 0 ? num.toFixed(decimals) : Math.round(num).toString()
      const [intPart, decPart] = formatted.split('.')
      const sep = global.thousandSeparator
      const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep)
      const decSep = sep === '.' ? ',' : '.'
      const result = decPart ? `${intFormatted}${decSep}${decPart}` : intFormatted
      return `${format.prefix ?? ''}${result}${format.suffix ?? ''}`
    }
    case 'date':
      return formatDate(value as string | Date, format.dateFormat)
    case 'text':
    default:
      return String(value)
  }
}
