'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { WidgetConfig } from '@/lib/dashboard/types'
import type { TransformedResult } from '@/lib/dashboard/query-builder'
import { formatValue, type GlobalFormatSettings } from '@/lib/dashboard/format'
import { getColumnMeta } from '@/lib/dashboard/schema-registry'

interface Props {
  config: WidgetConfig
  data: TransformedResult
  globalFormat: GlobalFormatSettings
  /** Pre-fetched previous-period value (optional) */
  compareValue?: number | null
}

export function KpiCardWidget({ config, data, globalFormat, compareValue }: Props) {
  const valueCfg = config.values[0]
  const cm = valueCfg ? getColumnMeta(valueCfg.table, valueCfg.column) : null

  // Sum all rows (KPI = single number, ignore dimensions)
  const total = data.cells
    .filter(c => c.valueAlias === 'v_0')
    .reduce((acc, c) => acc + (typeof c.value === 'number' ? c.value : 0), 0)

  const display = formatValue(total, {
    perWidgetOverride: valueCfg?.formatOverride ?? null,
    columnMeta: cm,
    global: globalFormat,
  })

  let deltaPercent: number | null = null
  let trend: 'up' | 'down' | 'flat' = 'flat'
  if (compareValue !== undefined && compareValue !== null && compareValue !== 0) {
    deltaPercent = ((total - compareValue) / Math.abs(compareValue)) * 100
    trend = deltaPercent > 0.5 ? 'up' : deltaPercent < -0.5 ? 'down' : 'flat'
  }

  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-foreground/55'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div className="flex flex-col items-center justify-center h-full py-6 px-4">
      <p className="text-xs uppercase tracking-widest text-foreground/55 mb-2">
        {valueCfg
          ? `${valueCfg.agg === 'count' ? 'Số lượng' : valueCfg.agg === 'sum' ? 'Tổng' : valueCfg.agg} ${valueCfg.alias ?? cm?.vietnameseName ?? valueCfg.column}`
          : 'KPI'}
      </p>
      <p className="lqg-numeric-sans text-4xl sm:text-5xl text-foreground font-bold tabular-nums">
        {display}
      </p>
      {deltaPercent !== null && (
        <div className={`mt-3 flex items-center gap-1 text-sm font-medium ${trendColor}`}>
          <TrendIcon className="h-4 w-4" strokeWidth={2.5} />
          <span>{Math.abs(deltaPercent).toFixed(1)}% {trend === 'up' ? 'tăng' : trend === 'down' ? 'giảm' : 'không đổi'}</span>
        </div>
      )}
      <p className="text-xs text-foreground/35 mt-2">{data.executionTimeMs}ms</p>
    </div>
  )
}
