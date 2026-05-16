/**
 * Query Builder — chuyển WidgetConfig thành SQL an toàn + execute via Prisma.
 *
 * Safety:
 *   - Mọi identifier (table, column) phải có trong SCHEMA_REGISTRY (whitelist)
 *   - Mọi value đi qua parameterized query ($1, $2, ...) — không string interpolation
 *   - statement_timeout 10s ở DB level (cancel runaway query)
 *   - LIMIT 10000 rows
 */

import { prisma } from '@/lib/prisma'
import { evaluateFormula } from './formula-parser'
import { getColumnMeta, type ColumnMeta } from './schema-registry'
import { QUERY_LIMITS } from './safety'
import type {
  WidgetConfig, PivotField, PivotValue, PivotFilter, TimeRange,
  AggregationOp,
} from './types'

// ─── Identifier quoting ───
function quoteIdent(name: string): string {
  // PostgreSQL: dùng double-quote. Validate name chỉ chứa [a-z0-9_]
  if (!/^[a-z][a-z0-9_]*$/i.test(name)) {
    throw new Error(`Invalid identifier: ${name}`)
  }
  return `"${name}"`
}

function tableAlias(idx: number): string {
  return `t${idx}`
}

// ─── Field rendering ───
function renderFieldExpr(field: PivotField, aliasMap: Map<string, string>): string {
  const tAlias = aliasMap.get(field.table)
  if (!tAlias) throw new Error(`Table not in alias map: ${field.table}`)
  const colMeta = getColumnMeta(field.table, field.column)
  if (!colMeta) throw new Error(`Column not in registry: ${field.table}.${field.column}`)

  const baseCol = `${tAlias}.${quoteIdent(field.column)}`

  if (field.dateGranularity && colMeta.type === 'date') {
    return `date_trunc('${field.dateGranularity}', ${baseCol})`
  }
  return baseCol
}

function renderAggregation(value: PivotValue, aliasMap: Map<string, string>): string {
  const fieldExpr = renderFieldExpr(value, aliasMap)
  const aggMap: Record<AggregationOp, string> = {
    sum: 'SUM',
    count: 'COUNT',
    count_distinct: 'COUNT(DISTINCT',
    avg: 'AVG',
    min: 'MIN',
    max: 'MAX',
  }
  if (value.agg === 'count_distinct') {
    return `COUNT(DISTINCT ${fieldExpr})`
  }
  return `${aggMap[value.agg]}(${fieldExpr})`
}

// ─── Filter rendering ───
function renderFilter(
  filter: PivotFilter,
  aliasMap: Map<string, string>,
  params: unknown[],
): string {
  const fieldExpr = renderFieldExpr(filter.field, aliasMap)
  const op = filter.op
  const v = filter.value

  switch (op) {
    case 'eq':
      params.push(v)
      return `${fieldExpr} = $${params.length}`
    case 'neq':
      params.push(v)
      return `${fieldExpr} <> $${params.length}`
    case 'gt':
      params.push(v)
      return `${fieldExpr} > $${params.length}`
    case 'gte':
      params.push(v)
      return `${fieldExpr} >= $${params.length}`
    case 'lt':
      params.push(v)
      return `${fieldExpr} < $${params.length}`
    case 'lte':
      params.push(v)
      return `${fieldExpr} <= $${params.length}`
    case 'in': {
      if (!Array.isArray(v) || v.length === 0) return '1=0'
      const placeholders = v.map(item => {
        params.push(item)
        return `$${params.length}`
      }).join(', ')
      return `${fieldExpr} IN (${placeholders})`
    }
    case 'not_in': {
      if (!Array.isArray(v) || v.length === 0) return '1=1'
      const placeholders = v.map(item => {
        params.push(item)
        return `$${params.length}`
      }).join(', ')
      return `${fieldExpr} NOT IN (${placeholders})`
    }
    case 'between': {
      if (!Array.isArray(v) || v.length !== 2) return '1=0'
      params.push(v[0])
      const p1 = params.length
      params.push(v[1])
      const p2 = params.length
      return `${fieldExpr} BETWEEN $${p1} AND $${p2}`
    }
    case 'contains':
      params.push(`%${String(v ?? '')}%`)
      return `${fieldExpr} ILIKE $${params.length}`
    case 'is_null':
      return `${fieldExpr} IS NULL`
    case 'not_null':
      return `${fieldExpr} IS NOT NULL`
    default:
      throw new Error(`Unknown filter op: ${op as string}`)
  }
}

// ─── Time range to filter ───
function timeRangeToFilters(timeRange: TimeRange | undefined): PivotFilter[] {
  if (!timeRange || !timeRange.field) return []
  if (timeRange.preset === 'all') return []

  const now = new Date()
  let from: Date | null = null
  let to: Date | null = null

  switch (timeRange.preset) {
    case '7d':
      from = new Date(now.getTime() - 7 * 24 * 3600 * 1000)
      to = now
      break
    case '30d':
      from = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
      to = now
      break
    case '90d':
      from = new Date(now.getTime() - 90 * 24 * 3600 * 1000)
      to = now
      break
    case 'this_month':
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      to = now
      break
    case 'last_month':
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      to = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3)
      from = new Date(now.getFullYear(), q * 3, 1)
      to = now
      break
    }
    case 'this_year':
      from = new Date(now.getFullYear(), 0, 1)
      to = now
      break
    case 'custom':
      if (timeRange.from) from = new Date(timeRange.from)
      if (timeRange.to) to = new Date(timeRange.to)
      break
  }

  const filters: PivotFilter[] = []
  if (from) filters.push({ field: timeRange.field, op: 'gte', value: from.toISOString() })
  if (to) filters.push({ field: timeRange.field, op: 'lt', value: to.toISOString() })
  return filters
}

// ─── Build SQL ───
export interface BuildResult {
  sql: string
  params: unknown[]
  fieldAliases: {
    rows: string[]      // alias cho row dims, ['r_0', 'r_1', ...]
    columns: string[]   // alias cho col dims, ['c_0', ...]
    values: string[]    // alias cho values, ['v_0', ...]
  }
}

function buildSql(config: WidgetConfig, timeRange?: TimeRange): BuildResult {
  const params: unknown[] = []

  // Map table → alias
  const aliasMap = new Map<string, string>()
  aliasMap.set(config.rootTable, tableAlias(0))
  let aliasIdx = 1
  for (const join of config.joins) {
    if (!aliasMap.has(join.toTable)) {
      aliasMap.set(join.toTable, tableAlias(aliasIdx++))
    }
    if (!aliasMap.has(join.fromTable)) {
      aliasMap.set(join.fromTable, tableAlias(aliasIdx++))
    }
  }

  // SELECT
  const selectParts: string[] = []
  const fieldAliases = { rows: [] as string[], columns: [] as string[], values: [] as string[] }

  config.rows.forEach((f, i) => {
    const alias = `r_${i}`
    selectParts.push(`${renderFieldExpr(f, aliasMap)} AS ${alias}`)
    fieldAliases.rows.push(alias)
  })
  config.columns.forEach((f, i) => {
    const alias = `c_${i}`
    selectParts.push(`${renderFieldExpr(f, aliasMap)} AS ${alias}`)
    fieldAliases.columns.push(alias)
  })
  config.values.forEach((v, i) => {
    const alias = `v_${i}`
    selectParts.push(`${renderAggregation(v, aliasMap)} AS ${alias}`)
    fieldAliases.values.push(alias)
  })

  if (selectParts.length === 0) {
    // KPI rỗng or empty config — return constant 0
    selectParts.push('0 AS dummy')
  }

  // FROM + JOIN
  const fromParts: string[] = [`${quoteIdent(config.rootTable)} ${tableAlias(0)}`]
  for (const join of config.joins) {
    const fromAlias = aliasMap.get(join.fromTable)
    const toAlias = aliasMap.get(join.toTable)
    if (!fromAlias || !toAlias) continue
    const onClauses = join.on.map(c => {
      return `${fromAlias}.${quoteIdent(c.from)} = ${toAlias}.${quoteIdent(c.to)}`
    }).join(' AND ')
    const joinType = join.type === 'left' ? 'LEFT JOIN' : 'INNER JOIN'
    fromParts.push(`${joinType} ${quoteIdent(join.toTable)} ${toAlias} ON ${onClauses}`)
  }

  // WHERE — filters + slicers + time range
  const allFilters = [...config.filters, ...timeRangeToFilters(timeRange)]
  const whereParts = allFilters.map(f => renderFilter(f, aliasMap, params))

  // GROUP BY — group by all row/col dims (positional)
  const groupByCount = config.rows.length + config.columns.length
  const groupByClause = groupByCount > 0
    ? `GROUP BY ${Array.from({ length: groupByCount }, (_, i) => i + 1).join(', ')}`
    : ''

  // ORDER BY — sort rows asc by default
  let orderByClause = ''
  if (config.sort && config.sort.length > 0) {
    const sortParts = config.sort.map(s => {
      // s.field = alias name (r_0, c_0, v_0)
      if (!/^[rcv]_\d+$/.test(s.field)) return null
      return `${s.field} ${s.dir.toUpperCase()}`
    }).filter(Boolean) as string[]
    if (sortParts.length > 0) orderByClause = `ORDER BY ${sortParts.join(', ')}`
  } else if (groupByCount > 0) {
    orderByClause = `ORDER BY ${Array.from({ length: groupByCount }, (_, i) => i + 1).join(', ')}`
  }

  // LIMIT
  const limit = Math.min(config.topN ?? QUERY_LIMITS.MAX_ROWS, QUERY_LIMITS.MAX_ROWS)

  const sql = [
    `SELECT ${selectParts.join(', ')}`,
    `FROM ${fromParts.join('\n  ')}`,
    whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '',
    groupByClause,
    orderByClause,
    `LIMIT ${limit}`,
  ].filter(Boolean).join('\n')

  return { sql, params, fieldAliases }
}

// ─── Execute query ───
export interface QueryExecResult {
  rows: Record<string, unknown>[]
  executionTimeMs: number
  truncated: boolean
  sql: string  // for debugging
}

export async function executeWidgetQuery(
  config: WidgetConfig,
  timeRange?: TimeRange,
): Promise<QueryExecResult> {
  const { sql, params } = buildSql(config, timeRange)
  const start = Date.now()

  // Use transaction to set statement_timeout LOCAL
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = ${QUERY_LIMITS.STATEMENT_TIMEOUT_MS}`)
    return tx.$queryRawUnsafe<Record<string, unknown>[]>(sql, ...params)
  })

  const executionTimeMs = Date.now() - start
  const truncated = result.length >= QUERY_LIMITS.MAX_ROWS
  return { rows: result, executionTimeMs, truncated, sql }
}

// ─── Transform raw rows → PivotResult ───
export interface TransformedResult {
  rows: string[][]
  columns: string[][]
  cells: Array<{ rowKey: string; colKey: string; valueAlias: string; value: number | string | null }>
  rowCount: number
  executionTimeMs: number
  truncated: boolean
}

export function transformToPivot(
  rawRows: Record<string, unknown>[],
  config: WidgetConfig,
  executionTimeMs: number,
  truncated: boolean,
): TransformedResult {
  const rowFieldCount = config.rows.length
  const colFieldCount = config.columns.length
  const valueAliases = config.values.map((_, i) => `v_${i}`)
  const calcAliases = config.calculatedFields.map(c => c.alias)

  // Unique row + col combinations
  const rowSet = new Map<string, string[]>()
  const colSet = new Map<string, string[]>()
  const cells: TransformedResult['cells'] = []

  for (const row of rawRows) {
    const rowVals = Array.from({ length: rowFieldCount }, (_, i) => String(row[`r_${i}`] ?? ''))
    const colVals = Array.from({ length: colFieldCount }, (_, i) => String(row[`c_${i}`] ?? ''))
    const rowKey = rowVals.join('|')
    const colKey = colVals.join('|')
    if (!rowSet.has(rowKey)) rowSet.set(rowKey, rowVals)
    if (!colSet.has(colKey)) colSet.set(colKey, colVals)

    // Build context for calculated fields
    const ctx: Record<string, number> = {}
    valueAliases.forEach((alias, i) => {
      const raw = row[alias]
      const num = typeof raw === 'bigint' ? Number(raw) : Number(raw)
      ctx[config.values[i].alias ?? `value_${i}`] = Number.isFinite(num) ? num : 0
      cells.push({ rowKey, colKey, valueAlias: alias, value: Number.isFinite(num) ? num : null })
    })
    // Evaluate calculated fields
    config.calculatedFields.forEach((cf, i) => {
      const result = evaluateFormula(cf.formula, ctx)
      cells.push({ rowKey, colKey, valueAlias: calcAliases[i], value: result })
    })
  }

  return {
    rows: Array.from(rowSet.values()),
    columns: Array.from(colSet.values()),
    cells,
    rowCount: rawRows.length,
    executionTimeMs,
    truncated,
  }
}

/**
 * Top-level: chạy 1 widget config, trả về pivot result đầy đủ.
 */
export async function runWidget(
  config: WidgetConfig,
  timeRange?: TimeRange,
): Promise<TransformedResult & { sql: string }> {
  const exec = await executeWidgetQuery(config, timeRange)
  const transformed = transformToPivot(exec.rows, config, exec.executionTimeMs, exec.truncated)
  return { ...transformed, sql: exec.sql }
}

// Re-export helper cho external use
export { getColumnMeta }
export type { ColumnMeta }
