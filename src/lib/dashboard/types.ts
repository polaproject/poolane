/**
 * Type definitions cho Dashboard BI Tool (Phase 17).
 * Mọi widget config + query input đều type-safe qua các type ở đây.
 */

export type AggregationOp =
  | 'sum'
  | 'count'
  | 'count_distinct'
  | 'avg'
  | 'min'
  | 'max'

export type FilterOp =
  | 'eq' | 'neq'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'in' | 'not_in'
  | 'between'
  | 'contains'
  | 'is_null' | 'not_null'

export type ChartSubtype = 'bar' | 'line' | 'pie' | 'area' | 'stacked_bar'

export type DateGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year'

export type WidgetType = 'pivot' | 'chart' | 'heatmap' | 'kpi'

export type AmountStyle = 'vn_full' | 'vn_compact' | 'no_symbol' | 'us'

export interface ColumnFormat {
  type?: 'number' | 'currency' | 'percent' | 'date' | 'text'
  decimals?: number
  prefix?: string
  suffix?: string
  amountStyle?: AmountStyle      // override global amount format
  dateFormat?: string            // 'DD/MM/YYYY' | 'MM/YYYY' | etc.
}

export interface PivotField {
  table: string                  // 'students' — table name (snake_case)
  column: string                 // 'status'
  alias?: string                 // display name override
  dateGranularity?: DateGranularity  // chỉ nếu column là date/datetime
}

export interface PivotValue extends PivotField {
  agg: AggregationOp
  formatOverride?: ColumnFormat | null  // null = dùng default
}

export interface PivotFilter {
  field: PivotField
  op: FilterOp
  value: string | number | boolean | string[] | number[] | null
}

export interface PivotJoin {
  fromTable: string
  toTable: string
  type: 'inner' | 'left'
  on: Array<{ from: string; to: string }>
}

export interface CalculatedField {
  alias: string
  formula: string                // '(revenue - refund) / count_students'
}

export type CompareMode = 'none' | 'prev_period' | 'mom' | 'yoy' | 'custom'

export interface TimeRange {
  preset?: '7d' | '30d' | '90d' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'all' | 'custom'
  from?: string                  // ISO date — chỉ khi preset='custom'
  to?: string
  compare?: CompareMode
  compareOffsetDays?: number     // chỉ khi compare='custom'
  field?: PivotField             // field date dùng để filter time (vd payments.recorded_at)
}

export interface WidgetConfig {
  rootTable: string              // bảng gốc của query
  joins: PivotJoin[]
  rows: PivotField[]             // pivot rows (group by)
  columns: PivotField[]          // pivot columns (group by)
  values: PivotValue[]
  calculatedFields: CalculatedField[]
  filters: PivotFilter[]
  sort: Array<{ field: string; dir: 'asc' | 'desc' }>
  topN?: number                  // limit rows
  visualization: {
    type: WidgetType
    chartSubtype?: ChartSubtype
    kpiCompare?: CompareMode
  }
}

// ─── Query result shape ───
export interface PivotResultCell {
  rowKey: string                 // serialized row values, e.g. "ECH"
  colKey: string                 // serialized col values, e.g. "2026-03"
  valueAlias: string             // alias của PivotValue
  value: number | string | null
}

export interface PivotResult {
  rows: string[][]               // unique row combinations
  columns: string[][]            // unique column combinations
  cells: PivotResultCell[]
  totals?: {
    rowTotals: Record<string, number>
    colTotals: Record<string, number>
    grandTotal: number
  }
  executionTimeMs: number
  rowCount: number
  truncated: boolean             // true nếu hit 10k limit
}

// ─── Dashboard-level types ───
export interface DashboardSlicer {
  field: PivotField
  op: FilterOp
  value: string | number | string[] | number[] | null
  label?: string
}

export interface DashboardLayoutItem {
  id: string                     // widget id
  x: number
  y: number
  w: number
  h: number
}

export interface DashboardData {
  id: string
  name: string
  description: string | null
  isHome: boolean
  layout: DashboardLayoutItem[]
  slicers: DashboardSlicer[]
  timeRange: TimeRange
  widgets: WidgetData[]
}

export interface WidgetData {
  id: string
  title: string
  type: WidgetType
  config: WidgetConfig
  position: { x: number; y: number; w: number; h: number }
}
