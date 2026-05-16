'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { X, Loader2, Save, Plus, Trash2, BarChart, Table, Grid3X3, Hash } from 'lucide-react'
import type {
  WidgetConfig, WidgetType, TimeRange, PivotField, PivotValue, PivotFilter,
  AggregationOp, FilterOp, ChartSubtype, DateGranularity,
} from '@/lib/dashboard/types'
import type { TransformedResult } from '@/lib/dashboard/query-builder'
import type { GlobalFormatSettings } from '@/lib/dashboard/format'
import type { TableMeta, ColumnMeta } from '@/lib/dashboard/schema-registry'
import { WidgetRenderer } from '@/components/dashboard/widgets/WidgetRenderer'

interface WidgetData {
  id: string
  title: string
  type: WidgetType
  config: WidgetConfig
  position: { x: number; y: number; w: number; h: number }
}

interface Props {
  dashboardId: string
  initial: WidgetData | null
  timeRange: TimeRange
  globalFormat: GlobalFormatSettings
  onClose: () => void
  onSaved: (widget: WidgetData) => void
}

const AGG_LABELS: Record<AggregationOp, string> = {
  sum: 'Tổng',
  count: 'Đếm',
  count_distinct: 'Đếm khác biệt',
  avg: 'Trung bình',
  min: 'Min',
  max: 'Max',
}

const FILTER_OP_LABELS: Record<FilterOp, string> = {
  eq: '=', neq: '≠', gt: '>', gte: '≥', lt: '<', lte: '≤',
  in: 'thuộc', not_in: 'không thuộc',
  between: 'giữa', contains: 'chứa',
  is_null: 'rỗng', not_null: 'có giá trị',
}

const WIDGET_TYPES: Array<{ value: WidgetType; label: string; icon: typeof BarChart }> = [
  { value: 'pivot',   label: 'Bảng pivot', icon: Table },
  { value: 'chart',   label: 'Biểu đồ',    icon: BarChart },
  { value: 'heatmap', label: 'Heatmap',     icon: Grid3X3 },
  { value: 'kpi',     label: 'KPI lớn',     icon: Hash },
]

const CHART_SUBTYPES: Array<{ value: ChartSubtype; label: string }> = [
  { value: 'bar',         label: 'Cột' },
  { value: 'stacked_bar', label: 'Cột chồng' },
  { value: 'line',        label: 'Đường' },
  { value: 'area',        label: 'Vùng' },
  { value: 'pie',         label: 'Tròn' },
]

const DATE_GRANS: Array<{ value: DateGranularity; label: string }> = [
  { value: 'day',     label: 'Theo ngày' },
  { value: 'week',    label: 'Theo tuần' },
  { value: 'month',   label: 'Theo tháng' },
  { value: 'quarter', label: 'Theo quý' },
  { value: 'year',    label: 'Theo năm' },
]

function emptyConfig(): WidgetConfig {
  return {
    rootTable: '',
    joins: [],
    rows: [],
    columns: [],
    values: [],
    calculatedFields: [],
    filters: [],
    sort: [],
    visualization: { type: 'pivot' },
  }
}

export function WidgetBuilderModal({ dashboardId, initial, timeRange, globalFormat, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(initial?.title ?? 'Widget mới')
  const [config, setConfig] = useState<WidgetConfig>(initial?.config ?? emptyConfig())
  const [schema, setSchema] = useState<TableMeta[] | null>(null)
  const [previewData, setPreviewData] = useState<TransformedResult | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Fetch schema once
  useEffect(() => {
    fetch('/api/admin/dashboards/schema')
      .then(r => r.json())
      .then(j => setSchema(j.data ?? null))
      .catch(() => toast.error('Không tải được schema'))
  }, [])

  const rootTableMeta = useMemo(() => schema?.find(t => t.name === config.rootTable) ?? null, [schema, config.rootTable])

  // Debounced preview
  useEffect(() => {
    if (!config.rootTable || (config.values.length === 0 && config.visualization.type !== 'pivot')) return
    setPreviewLoading(true)
    setPreviewError(null)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/admin/dashboards/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config, timeRange }),
        })
        const json = await res.json()
        if (!res.ok) {
          setPreviewError(json.error?.message ?? 'Lỗi')
          setPreviewData(null)
        } else {
          setPreviewData(json.data as TransformedResult)
          setPreviewError(null)
        }
      } catch {
        setPreviewError('Lỗi kết nối')
      } finally {
        setPreviewLoading(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [config, timeRange])

  async function save() {
    if (!config.rootTable) {
      toast.error('Chọn bảng gốc trước')
      return
    }
    setSaving(true)
    try {
      const url = initial
        ? `/api/admin/dashboards/${dashboardId}/widgets/${initial.id}`
        : `/api/admin/dashboards/${dashboardId}/widgets`
      const res = await fetch(url, {
        method: initial ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type: config.visualization.type,
          config,
          position: initial?.position ?? { x: 0, y: 0, w: 6, h: 4 },
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Không lưu được')
        return
      }
      toast.success(initial ? 'Đã cập nhật' : 'Đã thêm widget')
      onSaved({
        id: json.data.id,
        title: json.data.title,
        type: json.data.type,
        config: json.data.config,
        position: json.data.position,
      })
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setSaving(false)
    }
  }

  function addRow(field: PivotField) {
    setConfig(c => ({ ...c, rows: [...c.rows, field] }))
  }
  function addColumn(field: PivotField) {
    setConfig(c => ({ ...c, columns: [...c.columns, field] }))
  }
  function addValue(field: PivotField, agg: AggregationOp) {
    setConfig(c => ({ ...c, values: [...c.values, { ...field, agg }] }))
  }
  function addFilter() {
    if (!rootTableMeta) return
    const col = rootTableMeta.columns[0]
    if (!col) return
    setConfig(c => ({
      ...c,
      filters: [...c.filters, { field: { table: rootTableMeta.name, column: col.name }, op: 'eq', value: '' }],
    }))
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-paper rounded-card-xl ring-1 ring-foreground/15 w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3 border-b border-foreground/10 flex items-center gap-3">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Tên widget"
            className="flex-1 px-3 py-2 text-base font-semibold bg-paper-tint/40 ring-1 ring-foreground/10 rounded-md focus:ring-accent/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={save}
            disabled={saving || !config.rootTable}
            className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2 rounded-pill text-sm hover:bg-accent/90 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 rounded-md text-foreground/55 hover:text-foreground hover:bg-foreground/8"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_minmax(400px,1.2fr)] divide-x divide-foreground/10 overflow-hidden">
          {/* Left: Field picker */}
          <FieldPicker
            schema={schema}
            rootTable={config.rootTable}
            onSelectRoot={t => setConfig(c => ({ ...c, rootTable: t, rows: [], columns: [], values: [], filters: [], joins: [] }))}
            onAddRow={addRow}
            onAddColumn={addColumn}
            onAddValue={addValue}
          />

          {/* Middle: Config */}
          <div className="overflow-y-auto p-4 space-y-4">
            {/* Visualization type */}
            <div>
              <p className="text-xs uppercase tracking-wider text-foreground/55 mb-2 font-semibold">Loại hiển thị</p>
              <div className="grid grid-cols-2 gap-2">
                {WIDGET_TYPES.map(wt => {
                  const Icon = wt.icon
                  const active = config.visualization.type === wt.value
                  return (
                    <button
                      key={wt.value}
                      type="button"
                      onClick={() => setConfig(c => ({ ...c, visualization: { ...c.visualization, type: wt.value } }))}
                      className={[
                        'px-3 py-2 rounded-md ring-1 transition text-xs flex items-center gap-1.5',
                        active ? 'bg-accent/15 ring-accent text-foreground font-semibold' : 'bg-paper-tint/40 ring-foreground/10 text-foreground/70 hover:ring-foreground/25',
                      ].join(' ')}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {wt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {config.visualization.type === 'chart' && (
              <div>
                <p className="text-xs uppercase tracking-wider text-foreground/55 mb-2 font-semibold">Kiểu biểu đồ</p>
                <div className="flex gap-1 flex-wrap">
                  {CHART_SUBTYPES.map(s => {
                    const active = config.visualization.chartSubtype === s.value
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setConfig(c => ({ ...c, visualization: { ...c.visualization, chartSubtype: s.value } }))}
                        className={[
                          'px-2.5 py-1 rounded-pill text-xs ring-1',
                          active ? 'bg-accent/15 ring-accent' : 'bg-paper-tint/40 ring-foreground/10 hover:ring-foreground/25',
                        ].join(' ')}
                      >
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Rows */}
            <DropZone
              label="ROWS (chiều dọc)"
              fields={config.rows}
              onRemove={i => setConfig(c => ({ ...c, rows: c.rows.filter((_, idx) => idx !== i) }))}
              onSetGranularity={(i, g) => setConfig(c => ({
                ...c,
                rows: c.rows.map((r, idx) => idx === i ? { ...r, dateGranularity: g } : r),
              }))}
              schema={schema}
            />
            {/* Columns */}
            <DropZone
              label="COLUMNS (chiều ngang)"
              fields={config.columns}
              onRemove={i => setConfig(c => ({ ...c, columns: c.columns.filter((_, idx) => idx !== i) }))}
              onSetGranularity={(i, g) => setConfig(c => ({
                ...c,
                columns: c.columns.map((col, idx) => idx === i ? { ...col, dateGranularity: g } : col),
              }))}
              schema={schema}
            />
            {/* Values */}
            <ValueZone
              values={config.values}
              schema={schema}
              onUpdate={(i, agg) => setConfig(c => ({
                ...c,
                values: c.values.map((v, idx) => idx === i ? { ...v, agg } : v),
              }))}
              onRemove={i => setConfig(c => ({ ...c, values: c.values.filter((_, idx) => idx !== i) }))}
            />

            {/* Filters */}
            <FilterZone
              filters={config.filters}
              rootTableMeta={rootTableMeta}
              schema={schema}
              onAdd={addFilter}
              onUpdate={(i, next) => setConfig(c => ({ ...c, filters: c.filters.map((f, idx) => idx === i ? next : f) }))}
              onRemove={i => setConfig(c => ({ ...c, filters: c.filters.filter((_, idx) => idx !== i) }))}
            />
          </div>

          {/* Right: Preview */}
          <div className="overflow-y-auto p-4 bg-paper-tint/20">
            <p className="text-xs uppercase tracking-wider text-foreground/55 mb-3 font-semibold">PREVIEW</p>
            {!config.rootTable ? (
              <div className="text-center py-12 text-foreground/55 text-sm">Chọn bảng gốc bên trái để bắt đầu.</div>
            ) : previewLoading ? (
              <div className="flex items-center justify-center h-40 text-foreground/55"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : previewError ? (
              <div className="text-danger text-sm bg-danger/10 px-3 py-2 rounded-md">{previewError}</div>
            ) : previewData ? (
              <WidgetRenderer config={config} data={previewData} globalFormat={globalFormat} />
            ) : (
              <div className="text-center py-12 text-foreground/55 text-sm">Cấu hình values để xem preview.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Field Picker ───
function FieldPicker({
  schema, rootTable, onSelectRoot, onAddRow, onAddColumn, onAddValue,
}: {
  schema: TableMeta[] | null
  rootTable: string
  onSelectRoot: (table: string) => void
  onAddRow: (f: PivotField) => void
  onAddColumn: (f: PivotField) => void
  onAddValue: (f: PivotField, agg: AggregationOp) => void
}) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    if (!schema) return []
    const q = search.trim().toLowerCase()
    if (!q) return schema
    return schema.map(t => ({
      ...t,
      columns: t.columns.filter(c =>
        c.name.toLowerCase().includes(q) || c.vietnameseName.toLowerCase().includes(q)
      ),
    })).filter(t => t.columns.length > 0 || t.name.toLowerCase().includes(q) || t.vietnameseName.toLowerCase().includes(q))
  }, [schema, search])

  return (
    <div className="overflow-y-auto p-3 space-y-3">
      <p className="text-xs uppercase tracking-wider text-foreground/55 font-semibold">Bảng dữ liệu</p>
      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Tìm bảng/cột..."
        className="w-full px-2 py-1.5 text-xs bg-paper-tint/40 ring-1 ring-foreground/10 rounded-md focus:ring-accent/40 focus:outline-none"
      />
      {filtered.length === 0 && <p className="text-xs text-foreground/55">Đang tải...</p>}
      {filtered.map(table => {
        const isRoot = table.name === rootTable
        return (
          <div key={table.name} className="text-xs">
            <button
              type="button"
              onClick={() => onSelectRoot(table.name)}
              className={[
                'w-full text-left px-2 py-1.5 rounded-md font-semibold transition',
                isRoot ? 'bg-accent/15 text-foreground ring-1 ring-accent/40' : 'text-foreground/85 hover:bg-foreground/5',
              ].join(' ')}
              title={table.description}
            >
              {table.vietnameseName}
              <span className="text-foreground/45 font-normal font-mono text-[10px] ml-1">{table.name}</span>
            </button>
            {isRoot && (
              <div className="ml-2 mt-1 space-y-0.5">
                {table.columns.map(col => (
                  <FieldRow
                    key={col.name}
                    table={table.name}
                    column={col}
                    onAddRow={() => onAddRow({ table: table.name, column: col.name })}
                    onAddColumn={() => onAddColumn({ table: table.name, column: col.name })}
                    onAddValue={(agg) => onAddValue({ table: table.name, column: col.name }, agg)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function FieldRow({ table, column, onAddRow, onAddColumn, onAddValue }: {
  table: string
  column: ColumnMeta
  onAddRow: () => void
  onAddColumn: () => void
  onAddValue: (agg: AggregationOp) => void
}) {
  void table
  const [open, setOpen] = useState(false)
  return (
    <div className="text-[11px]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title={column.description}
        className="w-full text-left px-2 py-1 rounded hover:bg-foreground/5 flex items-center justify-between gap-1"
      >
        <span className="text-foreground/80 truncate">{column.vietnameseName}</span>
        <code className="text-foreground/35 font-mono text-[9px] flex-shrink-0">{column.type}</code>
      </button>
      {open && (
        <div className="ml-2 mb-1 grid grid-cols-3 gap-1 pt-1">
          <button type="button" onClick={onAddRow} className="text-[10px] px-1.5 py-0.5 rounded bg-mist/20 hover:bg-mist/30 text-foreground/80">+Row</button>
          <button type="button" onClick={onAddColumn} className="text-[10px] px-1.5 py-0.5 rounded bg-mist/20 hover:bg-mist/30 text-foreground/80">+Col</button>
          {column.type === 'number' ? (
            <button type="button" onClick={() => onAddValue(column.defaultAggregation ?? 'sum')} className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 hover:bg-accent/30 text-foreground/80">+Σ</button>
          ) : (
            <button type="button" onClick={() => onAddValue('count')} className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 hover:bg-accent/30 text-foreground/80">+Đếm</button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Drop zones (rows, columns) ───
function DropZone({ label, fields, onRemove, onSetGranularity, schema }: {
  label: string
  fields: PivotField[]
  onRemove: (i: number) => void
  onSetGranularity: (i: number, g: DateGranularity) => void
  schema: TableMeta[] | null
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-foreground/55 mb-1.5 font-semibold">{label}</p>
      {fields.length === 0 ? (
        <div className="text-xs text-foreground/40 italic px-2 py-2 ring-1 ring-foreground/8 rounded-md">
          Click +Row hoặc +Col trong field picker bên trái
        </div>
      ) : (
        <div className="space-y-1">
          {fields.map((f, i) => {
            const col = schema?.find(t => t.name === f.table)?.columns.find(c => c.name === f.column)
            const isDate = col?.type === 'date'
            return (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 bg-paper-tint/40 ring-1 ring-foreground/10 rounded-md text-xs">
                <span className="text-foreground/85 flex-1 truncate">{col?.vietnameseName ?? f.column}</span>
                {isDate && (
                  <select
                    value={f.dateGranularity ?? 'month'}
                    onChange={e => onSetGranularity(i, e.target.value as DateGranularity)}
                    className="text-[10px] bg-transparent ring-1 ring-foreground/10 rounded px-1 py-0.5"
                  >
                    {DATE_GRANS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                )}
                <button type="button" onClick={() => onRemove(i)} aria-label="Xoá" className="text-foreground/45 hover:text-danger">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Value zone ───
function ValueZone({ values, schema, onUpdate, onRemove }: {
  values: PivotValue[]
  schema: TableMeta[] | null
  onUpdate: (i: number, agg: AggregationOp) => void
  onRemove: (i: number) => void
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-foreground/55 mb-1.5 font-semibold">VALUES (chỉ số đo)</p>
      {values.length === 0 ? (
        <div className="text-xs text-foreground/40 italic px-2 py-2 ring-1 ring-foreground/8 rounded-md">
          Click +Σ hoặc +Đếm trong field picker
        </div>
      ) : (
        <div className="space-y-1">
          {values.map((v, i) => {
            const col = schema?.find(t => t.name === v.table)?.columns.find(c => c.name === v.column)
            return (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 bg-accent/8 ring-1 ring-accent/20 rounded-md text-xs">
                <select
                  value={v.agg}
                  onChange={e => onUpdate(i, e.target.value as AggregationOp)}
                  className="text-[10px] bg-transparent ring-1 ring-foreground/15 rounded px-1 py-0.5 font-semibold"
                >
                  {Object.entries(AGG_LABELS).map(([k, lbl]) => (
                    <option key={k} value={k}>{lbl}</option>
                  ))}
                </select>
                <span className="text-foreground/85 flex-1 truncate">{col?.vietnameseName ?? v.column}</span>
                <button type="button" onClick={() => onRemove(i)} aria-label="Xoá" className="text-foreground/45 hover:text-danger">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Filter zone ───
function FilterZone({ filters, rootTableMeta, schema, onAdd, onUpdate, onRemove }: {
  filters: PivotFilter[]
  rootTableMeta: TableMeta | null
  schema: TableMeta[] | null
  onAdd: () => void
  onUpdate: (i: number, next: PivotFilter) => void
  onRemove: (i: number) => void
}) {
  void schema
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs uppercase tracking-wider text-foreground/55 font-semibold">FILTERS</p>
        <button
          type="button"
          onClick={onAdd}
          disabled={!rootTableMeta}
          className="text-[10px] inline-flex items-center gap-0.5 text-accent hover:underline disabled:opacity-50"
        >
          <Plus className="h-2.5 w-2.5" /> Thêm
        </button>
      </div>
      <div className="space-y-1">
        {filters.map((f, i) => {
          const col = rootTableMeta?.columns.find(c => c.name === f.field.column)
          return (
            <div key={i} className="flex items-center gap-1 px-2 py-1.5 bg-paper-tint/40 ring-1 ring-foreground/10 rounded-md text-xs">
              <select
                value={f.field.column}
                onChange={e => onUpdate(i, { ...f, field: { ...f.field, column: e.target.value } })}
                className="text-[10px] bg-transparent ring-1 ring-foreground/15 rounded px-1 py-0.5 max-w-[80px]"
              >
                {rootTableMeta?.columns.map(c => <option key={c.name} value={c.name}>{c.vietnameseName}</option>)}
              </select>
              <select
                value={f.op}
                onChange={e => onUpdate(i, { ...f, op: e.target.value as FilterOp })}
                className="text-[10px] bg-transparent ring-1 ring-foreground/15 rounded px-1 py-0.5"
              >
                {Object.entries(FILTER_OP_LABELS).map(([k, lbl]) => <option key={k} value={k}>{lbl}</option>)}
              </select>
              {!['is_null', 'not_null'].includes(f.op) && (
                col?.enumValues ? (
                  <select
                    value={Array.isArray(f.value) ? '' : String(f.value ?? '')}
                    onChange={e => onUpdate(i, { ...f, value: e.target.value })}
                    className="text-[10px] bg-transparent ring-1 ring-foreground/15 rounded px-1 py-0.5 flex-1"
                  >
                    <option value="">--</option>
                    {col.enumValues.map(ev => <option key={ev.value} value={ev.value}>{ev.label}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={Array.isArray(f.value) ? f.value.join(',') : String(f.value ?? '')}
                    onChange={e => onUpdate(i, { ...f, value: ['in', 'not_in'].includes(f.op) ? e.target.value.split(',').map(s => s.trim()) : e.target.value })}
                    placeholder="..."
                    className="text-[10px] bg-transparent ring-1 ring-foreground/15 rounded px-1 py-0.5 flex-1 min-w-[60px]"
                  />
                )
              )}
              <button type="button" onClick={() => onRemove(i)} className="text-foreground/45 hover:text-danger">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
