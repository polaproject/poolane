'use client'

import type { WidgetConfig } from '@/lib/dashboard/types'
import type { TransformedResult } from '@/lib/dashboard/query-builder'
import type { GlobalFormatSettings } from '@/lib/dashboard/format'
import { PivotTableWidget } from './PivotTableWidget'
import { ChartWidget } from './ChartWidget'
import { KpiCardWidget } from './KpiCardWidget'
import { HeatmapWidget } from './HeatmapWidget'

interface Props {
  config: WidgetConfig
  data: TransformedResult
  globalFormat: GlobalFormatSettings
  compareValue?: number | null
  onCellClick?: (rowKey: string, colKey: string, valueAlias?: string) => void
}

export function WidgetRenderer({ config, data, globalFormat, compareValue, onCellClick }: Props) {
  const type = config.visualization.type
  switch (type) {
    case 'pivot':
      return (
        <PivotTableWidget
          config={config}
          data={data}
          globalFormat={globalFormat}
          onCellClick={onCellClick}
        />
      )
    case 'chart':
      return <ChartWidget config={config} data={data} globalFormat={globalFormat} />
    case 'kpi':
      return <KpiCardWidget config={config} data={data} globalFormat={globalFormat} compareValue={compareValue} />
    case 'heatmap':
      return (
        <HeatmapWidget
          config={config}
          data={data}
          globalFormat={globalFormat}
          onCellClick={(r, c) => onCellClick?.(r, c, 'v_0')}
        />
      )
    default:
      return <div className="text-foreground/55 text-sm">Loại widget không hỗ trợ: {type}</div>
  }
}
