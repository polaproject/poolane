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
  onCellClick?: (rowKey: string, colKey: string, valueAlias: string) => void
}

/**
 * Cross-tab pivot table renderer.
 * Row dims left, column dims top, values in cells.
 */
export function PivotTableWidget({ config, data, globalFormat, onCellClick }: Props) {
  // Index cells by (rowKey, colKey, valueAlias) for fast lookup
  const cellIndex = useMemo(() => {
    const map = new Map<string, number | string | null>()
    for (const c of data.cells) {
      map.set(`${c.rowKey}::${c.colKey}::${c.valueAlias}`, c.value)
    }
    return map
  }, [data])

  const valueAliases = useMemo(() => {
    const v = config.values.map((_, i) => `v_${i}`)
    const c = config.calculatedFields.map(cf => cf.alias)
    return [...v, ...c]
  }, [config])

  const valueLabels = useMemo(() => {
    const labels = config.values.map((v, i) => {
      const cm = getColumnMeta(v.table, v.column)
      const baseName = v.alias ?? cm?.vietnameseName ?? v.column
      const aggLabels: Record<string, string> = {
        sum: 'Tổng', count: 'Số lượng', count_distinct: 'Số khác biệt',
        avg: 'TB', min: 'Min', max: 'Max',
      }
      return `${aggLabels[v.agg] ?? v.agg} ${baseName}`
    })
    const calcLabels = config.calculatedFields.map(cf => cf.alias)
    return [...labels, ...calcLabels]
  }, [config])

  if (data.rows.length === 0) {
    return (
      <div className="text-center py-12 text-foreground/55 text-sm">
        Không có dữ liệu phù hợp với cấu hình hiện tại.
      </div>
    )
  }

  const hasColumns = config.columns.length > 0
  const valueCount = valueAliases.length

  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          {/* Header row 1: column dimensions (if any) */}
          {hasColumns && (
            <tr className="border-b border-foreground/15">
              {config.rows.length > 0 && (
                <th colSpan={config.rows.length} className="px-3 py-2 text-left text-xs uppercase tracking-wide text-foreground/55 bg-paper-tint/40">
                  &nbsp;
                </th>
              )}
              {data.columns.map((colVals, ci) => (
                <th
                  key={ci}
                  colSpan={valueCount}
                  className="px-3 py-2 text-center text-xs font-semibold text-foreground bg-paper-tint/60 border-l border-foreground/10"
                >
                  {colVals.join(' / ')}
                </th>
              ))}
            </tr>
          )}
          {/* Header row 2: row dim names + value labels (per column group) */}
          <tr className="border-b border-foreground/15 bg-paper-tint/40">
            {config.rows.map((r, i) => {
              const cm = getColumnMeta(r.table, r.column)
              return (
                <th key={i} className="px-3 py-2 text-left text-xs uppercase tracking-wide text-foreground/65 font-semibold">
                  {r.alias ?? cm?.vietnameseName ?? r.column}
                </th>
              )
            })}
            {hasColumns
              ? data.columns.flatMap((_, ci) =>
                  valueLabels.map((label, vi) => (
                    <th
                      key={`${ci}-${vi}`}
                      className="px-3 py-2 text-right text-xs uppercase tracking-wide text-foreground/65 font-semibold border-l border-foreground/8"
                    >
                      {label}
                    </th>
                  )),
                )
              : valueLabels.map((label, vi) => (
                  <th key={vi} className="px-3 py-2 text-right text-xs uppercase tracking-wide text-foreground/65 font-semibold">
                    {label}
                  </th>
                ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((rowVals, ri) => {
            const rowKey = rowVals.join('|')
            return (
              <tr key={ri} className="border-b border-foreground/8 hover:bg-foreground/3">
                {rowVals.map((v, i) => (
                  <td key={i} className="px-3 py-2 text-foreground font-medium">{v || '—'}</td>
                ))}
                {hasColumns
                  ? data.columns.flatMap((colVals, ci) => {
                      const colKey = colVals.join('|')
                      return valueAliases.map((alias, vi) => {
                        const cellVal = cellIndex.get(`${rowKey}::${colKey}::${alias}`)
                        const valueCfg = config.values[vi]
                        const cm = valueCfg ? getColumnMeta(valueCfg.table, valueCfg.column) : null
                        return (
                          <td
                            key={`${ci}-${vi}`}
                            onClick={() => onCellClick?.(rowKey, colKey, alias)}
                            className="px-3 py-2 text-right text-foreground tabular-nums border-l border-foreground/5 cursor-pointer hover:bg-accent/5"
                          >
                            {formatValue(cellVal as number | null, {
                              perWidgetOverride: valueCfg?.formatOverride ?? null,
                              columnMeta: cm,
                              global: globalFormat,
                            })}
                          </td>
                        )
                      })
                    })
                  : valueAliases.map((alias, vi) => {
                      const cellVal = cellIndex.get(`${rowKey}::::${alias}`) ?? cellIndex.get(`${rowKey}::|::${alias}`)
                      // No-column case: colKey is empty string
                      const lookupVal = data.cells.find(c => c.rowKey === rowKey && c.valueAlias === alias)?.value
                      const valueCfg = config.values[vi]
                      const cm = valueCfg ? getColumnMeta(valueCfg.table, valueCfg.column) : null
                      return (
                        <td
                          key={vi}
                          onClick={() => onCellClick?.(rowKey, '', alias)}
                          className="px-3 py-2 text-right text-foreground tabular-nums cursor-pointer hover:bg-accent/5"
                        >
                          {formatValue(((cellVal ?? lookupVal) as number | null), {
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
      {data.truncated && (
        <p className="text-xs text-foreground/55 mt-2 px-3">
          ⚠ Đã giới hạn 10.000 dòng — có thể còn dữ liệu chưa hiển thị. Thêm filter để thu hẹp.
        </p>
      )}
      <p className="text-xs text-foreground/40 mt-1 px-3">
        {data.rowCount} dòng · {data.executionTimeMs}ms
      </p>
    </div>
  )
}
