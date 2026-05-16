'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts'
import type { WidgetConfig } from '@/lib/dashboard/types'
import type { TransformedResult } from '@/lib/dashboard/query-builder'
import { formatValue, type GlobalFormatSettings } from '@/lib/dashboard/format'
import { getColumnMeta } from '@/lib/dashboard/schema-registry'

interface Props {
  config: WidgetConfig
  data: TransformedResult
  globalFormat: GlobalFormatSettings
}

const COLORS = [
  'var(--accent, #C8A84B)',
  'var(--mist, #7FA8B5)',
  '#5C8A6E',
  '#D89B3A',
  '#B5483C',
  '#9B91D6',
  '#E89B7A',
]

export function ChartWidget({ config, data, globalFormat }: Props) {
  const subtype = config.visualization.chartSubtype ?? 'bar'
  const valueCfg = config.values[0]
  const cm = valueCfg ? getColumnMeta(valueCfg.table, valueCfg.column) : null

  // Transform data into chart-friendly shape
  // For bar/line/area: rows = X axis, columns = series
  // For pie: rows = labels, single value
  const chartData = useMemo(() => {
    if (subtype === 'pie') {
      // Pie: 1 row dim, ignore columns
      return data.rows.map(rowVals => {
        const rowKey = rowVals.join('|')
        const cell = data.cells.find(c => c.rowKey === rowKey && c.valueAlias === 'v_0')
        return {
          name: rowVals.join(' / '),
          value: typeof cell?.value === 'number' ? cell.value : 0,
        }
      })
    }
    // Bar/line/area: X = rows, series = columns
    return data.rows.map(rowVals => {
      const rowKey = rowVals.join('|')
      const point: Record<string, string | number> = { name: rowVals.join(' / ') }
      if (data.columns.length > 0) {
        data.columns.forEach(colVals => {
          const colKey = colVals.join('|')
          const cell = data.cells.find(c => c.rowKey === rowKey && c.colKey === colKey && c.valueAlias === 'v_0')
          point[colVals.join(' / ')] = typeof cell?.value === 'number' ? cell.value : 0
        })
      } else {
        const cell = data.cells.find(c => c.rowKey === rowKey && c.valueAlias === 'v_0')
        point['value'] = typeof cell?.value === 'number' ? cell.value : 0
      }
      return point
    })
  }, [data, subtype])

  const seriesKeys = useMemo(() => {
    if (subtype === 'pie') return ['value']
    if (data.columns.length === 0) return ['value']
    return data.columns.map(c => c.join(' / '))
  }, [data, subtype])

  if (chartData.length === 0) {
    return <div className="text-center py-12 text-foreground/55 text-sm">Không có dữ liệu.</div>
  }

  const tooltipFormatter = (value: unknown): string => {
    if (value === null || value === undefined) return '—'
    const num = typeof value === 'number' ? value : Number(value)
    return formatValue(num, {
      perWidgetOverride: valueCfg?.formatOverride ?? null,
      columnMeta: cm,
      global: globalFormat,
    })
  }

  return (
    <div className="w-full h-full min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        {subtype === 'bar' || subtype === 'stacked_bar' ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--foreground)" opacity={0.08} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--foreground)' }} />
            <Tooltip formatter={tooltipFormatter} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--foreground)', borderRadius: 8 }} />
            <Legend />
            {seriesKeys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} stackId={subtype === 'stacked_bar' ? 'a' : undefined} />
            ))}
          </BarChart>
        ) : subtype === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--foreground)" opacity={0.08} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--foreground)' }} />
            <Tooltip formatter={tooltipFormatter} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--foreground)', borderRadius: 8 }} />
            <Legend />
            {seriesKeys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        ) : subtype === 'area' ? (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--foreground)" opacity={0.08} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--foreground)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--foreground)' }} />
            <Tooltip formatter={tooltipFormatter} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--foreground)', borderRadius: 8 }} />
            <Legend />
            {seriesKeys.map((k, i) => (
              <Area key={k} type="monotone" dataKey={k} stackId="a" stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.6} />
            ))}
          </AreaChart>
        ) : (
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="75%" label>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={tooltipFormatter} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--foreground)', borderRadius: 8 }} />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
