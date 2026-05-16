'use client'

import { useMemo } from 'react'
import type { WidgetConfig } from '@/lib/dashboard/types'
import type { TransformedResult } from '@/lib/dashboard/query-builder'
import { formatValue, type GlobalFormatSettings } from '@/lib/dashboard/format'
import { getColumnMeta } from '@/lib/dashboard/schema-registry'

interface Props {
  config: WidgetConfig
  data: TransformedResult
  globalFormat: GlobalFormatSettings
  onCellClick?: (rowKey: string, colKey: string) => void
}

export function HeatmapWidget({ config, data, globalFormat, onCellClick }: Props) {
  const valueCfg = config.values[0]
  const cm = valueCfg ? getColumnMeta(valueCfg.table, valueCfg.column) : null

  const { cellMap, max, min } = useMemo(() => {
    const map = new Map<string, number>()
    let max = -Infinity
    let min = Infinity
    for (const c of data.cells) {
      if (c.valueAlias !== 'v_0') continue
      const num = typeof c.value === 'number' ? c.value : 0
      map.set(`${c.rowKey}::${c.colKey}`, num)
      if (num > max) max = num
      if (num < min) min = num
    }
    return { cellMap: map, max, min }
  }, [data])

  function getBgColor(value: number): string {
    if (max === min) return 'rgba(200, 168, 75, 0.15)'
    const t = (value - min) / (max - min)
    // accent (gold) — opacity 0.05 → 0.85
    const opacity = 0.05 + t * 0.80
    return `rgba(200, 168, 75, ${opacity.toFixed(3)})`
  }

  function getTextColor(value: number): string {
    if (max === min) return 'inherit'
    const t = (value - min) / (max - min)
    return t > 0.55 ? '#0F1B33' : 'inherit'
  }

  if (data.rows.length === 0 || data.columns.length === 0) {
    return (
      <div className="text-center py-12 text-foreground/55 text-sm">
        Heatmap cần ít nhất 1 chiều Row + 1 chiều Column.
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="px-3 py-2 bg-paper-tint/60 text-left text-xs uppercase tracking-wide text-foreground/55 sticky left-0">
              {config.rows[0]?.alias ?? config.rows[0]?.column ?? ''}
            </th>
            {data.columns.map((colVals, ci) => (
              <th key={ci} className="px-3 py-2 bg-paper-tint/60 text-center text-xs font-semibold text-foreground">
                {colVals.join(' / ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((rowVals, ri) => {
            const rowKey = rowVals.join('|')
            return (
              <tr key={ri}>
                <th className="px-3 py-2 text-left text-sm font-medium text-foreground sticky left-0 bg-paper">
                  {rowVals.join(' / ')}
                </th>
                {data.columns.map((colVals, ci) => {
                  const colKey = colVals.join('|')
                  const value = cellMap.get(`${rowKey}::${colKey}`) ?? 0
                  return (
                    <td
                      key={ci}
                      onClick={() => onCellClick?.(rowKey, colKey)}
                      className="px-3 py-2 text-center text-sm tabular-nums cursor-pointer transition"
                      style={{ backgroundColor: getBgColor(value), color: getTextColor(value) }}
                    >
                      {formatValue(value, {
                        perWidgetOverride: valueCfg?.formatOverride ?? null,
                        columnMeta: cm,
                        global: globalFormat,
                      })}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-xs text-foreground/40 mt-2 px-3">
        {data.rowCount} dòng · {data.executionTimeMs}ms · min {formatValue(min, { perWidgetOverride: valueCfg?.formatOverride ?? null, columnMeta: cm, global: globalFormat })} · max {formatValue(max, { perWidgetOverride: valueCfg?.formatOverride ?? null, columnMeta: cm, global: globalFormat })}
      </p>
    </div>
  )
}
