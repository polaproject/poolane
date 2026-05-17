'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import {
  X, Loader2, Save, Plus, Trash2, BarChart, Table, Grid3X3, Hash,
  GripVertical, Search, ChevronRight, ChevronDown,
} from 'lucide-react'
import {
  DndContext, DragOverlay, useDroppable, useDraggable,
  closestCenter, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import type {
  WidgetConfig, WidgetType, TimeRange, PivotField, PivotValue, PivotFilter,
  AggregationOp, FilterOp, ChartSubtype, DateGranularity,
} from '@/lib/dashboard/types'
import type { TransformedResult } from '@/lib/dashboard/query-builder'
import type { GlobalFormatSettings } from '@/lib/dashboard/format'
import type { TableMeta, ColumnMeta } from '@/lib/dashboard/schema-registry'
import { WidgetRenderer } from '@/components/dashboard/widgets/WidgetRenderer'

// ─── Types ───
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

type ZoneId = 'rows' | 'columns' | 'values' | 'filters'

interface DragData {
  source: 'picker' | ZoneId
  table: string
  column: string
  /** Khi drag từ zone — index trong zone đó để di chuyển */
  fromIndex?: number
}

// ─── Constants ───
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
  { value: 'day',     label: 'Ngày' },
  { value: 'week',    label: 'Tuần' },
  { value: 'month',   label: 'Tháng' },
  { value: 'quarter', label: 'Quý' },
  { value: 'year',    label: 'Năm' },
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

function defaultAgg(col: ColumnMeta | undefined): AggregationOp {
  if (!col) return 'count'
  if (col.defaultAggregation) return col.defaultAggregation
  return col.type === 'number' ? 'sum' : 'count'
}

// ─── Main component ───
export function WidgetBuilderModal({ dashboardId, initial, timeRange, globalFormat, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(initial?.title ?? 'Widget mới')
  const [config, setConfig] = useState<WidgetConfig>(initial?.config ?? emptyConfig())
  const [schema, setSchema] = useState<TableMeta[] | null>(null)
  const [previewData, setPreviewData] = useState<TransformedResult | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)

  useEffect(() => {
    fetch('/api/admin/dashboards/schema')
      .then(r => r.json())
      .then(j => setSchema(j.data ?? null))
      .catch(() => toast.error('Không tải được schema'))
  }, [])

  const rootTableMeta = useMemo(() => schema?.find(t => t.name === config.rootTable) ?? null, [schema, config.rootTable])

  function getColMeta(table: string, column: string): ColumnMeta | undefined {
    return schema?.find(t => t.name === table)?.columns.find(c => c.name === column)
  }

  // Debounced live preview
  useEffect(() => {
    if (!config.rootTable || (config.values.length === 0 && config.visualization.type !== 'pivot')) {
      setPreviewData(null)
      return
    }
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
          // Default cho widget mới: append cuối canvas (y=9999 — react-grid-layout
          // sẽ compactType='vertical' đẩy về y khả dụng đầu tiên). Half-width 6 col.
          position: initial?.position ?? { x: 0, y: 9999, w: 6, h: 5 },
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

  function handleDragStart(e: DragStartEvent) {
    const data = e.active.data.current as DragData | undefined
    if (data) setActiveDrag(data)
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDrag(null)
    const drag = e.active.data.current as DragData | undefined
    const dropZone = e.over?.id as ZoneId | undefined
    if (!drag || !dropZone) return
    if (drag.source === dropZone) return  // dropped on same zone — no-op

    const col = getColMeta(drag.table, drag.column)
    if (!col) return
    const field: PivotField = { table: drag.table, column: drag.column }

    // Validate fromIndex hợp lệ khi source là zone
    const validFromIndex = typeof drag.fromIndex === 'number' && drag.fromIndex >= 0
    if (drag.source !== 'picker' && !validFromIndex) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[WidgetBuilder] drag from zone without valid fromIndex — abort', drag)
      }
      return
    }

    setConfig(c => {
      let next = { ...c }
      // Remove from source (mutually exclusive — if-else if để defensive khi dnd-kit gửi
      // data corrupt thì chỉ 1 nhánh fire, không xoá nhầm zone khác)
      if (drag.source === 'rows') {
        next = { ...next, rows: next.rows.filter((_, i) => i !== drag.fromIndex) }
      } else if (drag.source === 'columns') {
        next = { ...next, columns: next.columns.filter((_, i) => i !== drag.fromIndex) }
      } else if (drag.source === 'values') {
        next = { ...next, values: next.values.filter((_, i) => i !== drag.fromIndex) }
      } else if (drag.source === 'filters') {
        next = { ...next, filters: next.filters.filter((_, i) => i !== drag.fromIndex) }
      }
      // (source === 'picker' → không xoá gì)

      // Add to destination
      if (dropZone === 'rows') next = { ...next, rows: [...next.rows, field] }
      else if (dropZone === 'columns') next = { ...next, columns: [...next.columns, field] }
      else if (dropZone === 'values') {
        const v: PivotValue = { ...field, agg: defaultAgg(col) }
        next = { ...next, values: [...next.values, v] }
      } else if (dropZone === 'filters') {
        const f: PivotFilter = { field, op: 'eq', value: col.enumValues?.[0]?.value ?? '' }
        next = { ...next, filters: [...next.filters, f] }
      }
      return next
    })
  }

  return (
    <div className="fixed inset-0 left-0 lg:left-64 top-0 z-40 bg-black/45 backdrop-blur-sm flex items-center justify-center p-3 lg:p-5">
      <div className="relative bg-paper rounded-card-xl ring-1 ring-foreground/15 w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-foreground/10 flex items-center gap-3">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Tên widget"
            className="flex-1 px-3 py-1.5 text-sm font-semibold bg-paper-tint/40 ring-1 ring-foreground/10 rounded-md focus:ring-accent/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={save}
            disabled={saving || !config.rootTable}
            className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-3.5 py-1.5 rounded-pill text-sm hover:bg-accent/90 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Lưu
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-md text-foreground/55 hover:text-foreground hover:bg-foreground/8"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body với DndContext bao toàn bộ */}
        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDrag(null)}
          collisionDetection={closestCenter}
        >
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_minmax(0,1.1fr)] divide-x divide-foreground/10 overflow-hidden">
            {/* Left: Field picker */}
            <FieldPickerPanel
              schema={schema}
              rootTable={config.rootTable}
              onSelectRoot={t => setConfig(c => ({ ...c, rootTable: t, rows: [], columns: [], values: [], filters: [], joins: [] }))}
            />

            {/* Middle: Drop zones config */}
            <div className="overflow-y-auto p-3 space-y-3">
              {/* Visualization type */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-foreground/55 mb-1.5 font-semibold">Loại hiển thị</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {WIDGET_TYPES.map(wt => {
                    const Icon = wt.icon
                    const active = config.visualization.type === wt.value
                    return (
                      <button
                        key={wt.value}
                        type="button"
                        onClick={() => setConfig(c => ({ ...c, visualization: { ...c.visualization, type: wt.value } }))}
                        className={[
                          'px-2.5 py-1.5 rounded-md ring-1 transition text-xs flex items-center gap-1.5',
                          active ? 'bg-accent/15 ring-accent text-foreground font-semibold' : 'bg-paper-tint/40 ring-foreground/10 text-foreground/70 hover:ring-foreground/25',
                        ].join(' ')}
                      >
                        <Icon className="h-3 w-3" />
                        {wt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {config.visualization.type === 'chart' && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-foreground/55 mb-1.5 font-semibold">Kiểu biểu đồ</p>
                  <div className="flex gap-1 flex-wrap">
                    {CHART_SUBTYPES.map(s => {
                      const active = config.visualization.chartSubtype === s.value
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setConfig(c => ({ ...c, visualization: { ...c.visualization, chartSubtype: s.value } }))}
                          className={[
                            'px-2 py-0.5 rounded-pill text-[11px] ring-1',
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

              <DropZoneFieldsList
                id="rows"
                label="ROWS — chiều dọc"
                hint="Kéo field vào đây để thành nhóm theo dòng"
                fields={config.rows}
                getColMeta={getColMeta}
                onRemove={i => setConfig(c => ({ ...c, rows: c.rows.filter((_, idx) => idx !== i) }))}
                onSetGranularity={(i, g) => setConfig(c => ({
                  ...c,
                  rows: c.rows.map((r, idx) => idx === i ? { ...r, dateGranularity: g } : r),
                }))}
              />

              <DropZoneFieldsList
                id="columns"
                label="COLUMNS — chiều ngang"
                hint="Kéo field vào đây để thành nhóm theo cột"
                fields={config.columns}
                getColMeta={getColMeta}
                onRemove={i => setConfig(c => ({ ...c, columns: c.columns.filter((_, idx) => idx !== i) }))}
                onSetGranularity={(i, g) => setConfig(c => ({
                  ...c,
                  columns: c.columns.map((col, idx) => idx === i ? { ...col, dateGranularity: g } : col),
                }))}
              />

              <DropZoneValues
                values={config.values}
                getColMeta={getColMeta}
                onUpdate={(i, agg) => setConfig(c => ({
                  ...c,
                  values: c.values.map((v, idx) => idx === i ? { ...v, agg } : v),
                }))}
                onRemove={i => setConfig(c => ({ ...c, values: c.values.filter((_, idx) => idx !== i) }))}
              />

              <DropZoneFilters
                filters={config.filters}
                getColMeta={getColMeta}
                onUpdate={(i, next) => setConfig(c => ({ ...c, filters: c.filters.map((f, idx) => idx === i ? next : f) }))}
                onRemove={i => setConfig(c => ({ ...c, filters: c.filters.filter((_, idx) => idx !== i) }))}
              />
            </div>

            {/* Right: Preview */}
            <div className="overflow-y-auto p-3 bg-paper-tint/20">
              <p className="text-[10px] uppercase tracking-wider text-foreground/55 mb-2 font-semibold">PREVIEW</p>
              {!config.rootTable ? (
                <div className="text-center py-12 text-foreground/55 text-sm">
                  Chọn bảng gốc bên trái rồi kéo field vào các vùng để build pivot.
                </div>
              ) : previewLoading ? (
                <div className="flex items-center justify-center h-40 text-foreground/55"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : previewError ? (
                <div className="text-danger text-sm bg-danger/10 px-3 py-2 rounded-md">{previewError}</div>
              ) : previewData ? (
                <WidgetRenderer config={config} data={previewData} globalFormat={globalFormat} />
              ) : (
                <div className="text-center py-12 text-foreground/55 text-sm">
                  Kéo field vào VALUES để xem preview.
                </div>
              )}
            </div>
          </div>

          {/* Drag overlay — visual ghost theo cursor */}
          <DragOverlay dropAnimation={null}>
            {activeDrag ? (
              <div className="px-2.5 py-1.5 bg-accent text-ink rounded-md shadow-2xl ring-1 ring-ink/15 text-xs font-semibold inline-flex items-center gap-1.5 max-w-[200px]">
                <GripVertical className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{getColMeta(activeDrag.table, activeDrag.column)?.vietnameseName ?? activeDrag.column}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}

// ─── Field picker panel (left) ───
function FieldPickerPanel({ schema, rootTable, onSelectRoot }: {
  schema: TableMeta[] | null
  rootTable: string
  onSelectRoot: (t: string) => void
}) {
  const [search, setSearch] = useState('')
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())

  // Auto-expand rootTable
  useEffect(() => {
    if (rootTable) setExpandedTables(prev => new Set(prev).add(rootTable))
  }, [rootTable])

  const filtered = useMemo(() => {
    if (!schema) return []
    const q = search.trim().toLowerCase()
    if (!q) return schema
    return schema.map(t => ({
      ...t,
      columns: t.columns.filter(c =>
        c.name.toLowerCase().includes(q) || c.vietnameseName.toLowerCase().includes(q),
      ),
    })).filter(t =>
      t.columns.length > 0 ||
      t.name.toLowerCase().includes(q) ||
      t.vietnameseName.toLowerCase().includes(q),
    )
  }, [schema, search])

  function toggleTable(name: string) {
    setExpandedTables(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <div className="overflow-y-auto p-3 space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-foreground/55 font-semibold">Bảng dữ liệu</p>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground/45" />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm bảng/cột..."
          className="w-full pl-7 pr-2 py-1.5 text-xs bg-paper-tint/40 ring-1 ring-foreground/10 rounded-md focus:ring-accent/40 focus:outline-none"
        />
      </div>
      {filtered.length === 0 && (
        <p className="text-xs text-foreground/55 py-4 text-center">{schema ? 'Không tìm thấy' : 'Đang tải...'}</p>
      )}
      <div className="space-y-1">
        {filtered.map(table => {
          const isRoot = table.name === rootTable
          const isExpanded = expandedTables.has(table.name) || isRoot
          const ChevronIcon = isExpanded ? ChevronDown : ChevronRight
          return (
            <div key={table.name} className="text-xs">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => toggleTable(table.name)}
                  aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                  className="p-0.5 text-foreground/45 hover:text-foreground"
                >
                  <ChevronIcon className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectRoot(table.name)}
                  className={[
                    'flex-1 text-left px-2 py-1 rounded-md transition truncate',
                    isRoot
                      ? 'bg-accent/15 text-foreground ring-1 ring-accent/40 font-semibold'
                      : 'text-foreground/85 hover:bg-foreground/5 font-medium',
                  ].join(' ')}
                  title={`${table.description} — click để chọn làm bảng gốc`}
                >
                  {table.vietnameseName}
                </button>
              </div>
              {isExpanded && isRoot && (
                <div className="ml-3 mt-0.5 space-y-0.5 pl-2 border-l border-foreground/8">
                  {table.columns.map(col => (
                    <DraggableField
                      key={col.name}
                      table={table.name}
                      col={col}
                    />
                  ))}
                </div>
              )}
              {isExpanded && !isRoot && (
                <p className="ml-5 mt-0.5 text-[10px] text-foreground/45 italic">
                  Click tên bảng để chọn làm gốc
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Draggable field (in picker) ───
function DraggableField({ table, col }: { table: string; col: ColumnMeta }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `picker:${table}.${col.name}`,
    data: { source: 'picker', table, column: col.name } satisfies DragData,
  })
  const typeIcon = col.type === 'number' ? '#' : col.type === 'date' ? '📅' : col.type === 'enum' ? '⊟' : col.type === 'boolean' ? '✓' : 'A'
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      title={col.description}
      className={[
        'flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] cursor-grab active:cursor-grabbing transition',
        isDragging ? 'opacity-30' : 'hover:bg-accent/8',
      ].join(' ')}
    >
      <span className="text-foreground/35 font-mono text-[10px] w-3">{typeIcon}</span>
      <span className="text-foreground/85 truncate flex-1">{col.vietnameseName}</span>
    </div>
  )
}

// ─── Drop zone: rows / columns (PivotField list) ───
function DropZoneFieldsList({
  id, label, hint, fields, getColMeta, onRemove, onSetGranularity,
}: {
  id: ZoneId
  label: string
  hint: string
  fields: PivotField[]
  getColMeta: (t: string, c: string) => ColumnMeta | undefined
  onRemove: (i: number) => void
  onSetGranularity: (i: number, g: DateGranularity) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-foreground/55 mb-1 font-semibold">{label}</p>
      <div
        ref={setNodeRef}
        className={[
          'min-h-[42px] rounded-md ring-1 p-1.5 transition space-y-1',
          isOver
            ? 'ring-accent ring-2 bg-accent/15 shadow-soft'
            : fields.length === 0
              ? 'ring-dashed ring-foreground/15 bg-paper-tint/30'
              : 'ring-foreground/10 bg-paper-tint/30',
        ].join(' ')}
      >
        {fields.length === 0 && (
          <p className="text-[11px] text-foreground/40 italic px-1 py-1.5 text-center">{hint}</p>
        )}
        {fields.map((f, i) => {
          const col = getColMeta(f.table, f.column)
          const isDate = col?.type === 'date'
          return (
            <DraggableChip
              // Key include zone + field identity + index để React không reuse instance
              // nhầm khi field move giữa zones (vd rows[0] → columns[0] không phantom).
              key={`${id}:${f.table}.${f.column}:${i}`}
              zone={id}
              index={i}
              field={f}
              col={col}
              extra={
                isDate ? (
                  <select
                    value={f.dateGranularity ?? 'month'}
                    onChange={e => onSetGranularity(i, e.target.value as DateGranularity)}
                    onClick={e => e.stopPropagation()}
                    className="text-[10px] bg-transparent ring-1 ring-foreground/15 rounded px-1 py-0.5"
                  >
                    {DATE_GRANS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                ) : null
              }
              onRemove={() => onRemove(i)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── Drop zone: values (PivotValue list — có agg dropdown) ───
function DropZoneValues({
  values, getColMeta, onUpdate, onRemove,
}: {
  values: PivotValue[]
  getColMeta: (t: string, c: string) => ColumnMeta | undefined
  onUpdate: (i: number, agg: AggregationOp) => void
  onRemove: (i: number) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'values' })
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-foreground/55 mb-1 font-semibold">VALUES — chỉ số đo</p>
      <div
        ref={setNodeRef}
        className={[
          'min-h-[42px] rounded-md ring-1 p-1.5 transition space-y-1',
          isOver
            ? 'ring-accent ring-2 bg-accent/15 shadow-soft'
            : values.length === 0
              ? 'ring-dashed ring-foreground/15 bg-paper-tint/30'
              : 'ring-foreground/10 bg-paper-tint/30',
        ].join(' ')}
      >
        {values.length === 0 && (
          <p className="text-[11px] text-foreground/40 italic px-1 py-1.5 text-center">
            Kéo field số vào đây — tự động chọn SUM hoặc COUNT
          </p>
        )}
        {values.map((v, i) => {
          const col = getColMeta(v.table, v.column)
          return (
            <DraggableChip
              key={`values:${v.table}.${v.column}:${i}`}
              zone="values"
              index={i}
              field={v}
              col={col}
              accent
              prefix={
                <select
                  value={v.agg}
                  onChange={e => onUpdate(i, e.target.value as AggregationOp)}
                  onClick={e => e.stopPropagation()}
                  className="text-[10px] bg-transparent ring-1 ring-foreground/20 rounded px-1 py-0.5 font-semibold"
                >
                  {Object.entries(AGG_LABELS).map(([k, lbl]) => (
                    <option key={k} value={k}>{lbl}</option>
                  ))}
                </select>
              }
              onRemove={() => onRemove(i)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── Drop zone: filters ───
function DropZoneFilters({
  filters, getColMeta, onUpdate, onRemove,
}: {
  filters: PivotFilter[]
  getColMeta: (t: string, c: string) => ColumnMeta | undefined
  onUpdate: (i: number, next: PivotFilter) => void
  onRemove: (i: number) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'filters' })
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-foreground/55 mb-1 font-semibold">FILTERS</p>
      <div
        ref={setNodeRef}
        className={[
          'min-h-[42px] rounded-md ring-1 p-1.5 transition space-y-1',
          isOver
            ? 'ring-accent ring-2 bg-accent/15 shadow-soft'
            : filters.length === 0
              ? 'ring-dashed ring-foreground/15 bg-paper-tint/30'
              : 'ring-foreground/10 bg-paper-tint/30',
        ].join(' ')}
      >
        {filters.length === 0 && (
          <p className="text-[11px] text-foreground/40 italic px-1 py-1.5 text-center">
            Kéo field vào để thêm filter
          </p>
        )}
        {filters.map((f, i) => {
          const col = getColMeta(f.field.table, f.field.column)
          return (
            <div key={i} className="flex items-center gap-1 px-1.5 py-1 bg-paper ring-1 ring-foreground/10 rounded-md text-[11px]">
              <GripVertical className="h-3 w-3 text-foreground/30 flex-shrink-0" />
              <span className="text-foreground/85 font-medium truncate max-w-[100px]">
                {col?.vietnameseName ?? f.field.column}
              </span>
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
                    className="text-[10px] bg-transparent ring-1 ring-foreground/15 rounded px-1 py-0.5 flex-1 min-w-0"
                  >
                    <option value="">--</option>
                    {col.enumValues.map(ev => <option key={ev.value} value={ev.value}>{ev.label}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={Array.isArray(f.value) ? f.value.join(',') : String(f.value ?? '')}
                    onChange={e => onUpdate(i, { ...f, value: ['in', 'not_in'].includes(f.op) ? e.target.value.split(',').map(s => s.trim()) : e.target.value })}
                    placeholder="giá trị..."
                    className="text-[10px] bg-transparent ring-1 ring-foreground/15 rounded px-1 py-0.5 flex-1 min-w-0"
                  />
                )
              )}
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label="Xoá filter"
                className="text-foreground/45 hover:text-danger flex-shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Chip draggable trong drop zone ───
function DraggableChip({
  zone, index, field, col, prefix, extra, accent, onRemove,
}: {
  zone: ZoneId
  index: number
  field: PivotField
  col: ColumnMeta | undefined
  prefix?: React.ReactNode
  extra?: React.ReactNode
  accent?: boolean
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${zone}:${index}:${field.table}.${field.column}`,
    data: { source: zone, table: field.table, column: field.column, fromIndex: index } satisfies DragData,
  })
  return (
    <div
      ref={setNodeRef}
      className={[
        'flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px] transition',
        accent ? 'bg-accent/12 ring-1 ring-accent/30' : 'bg-paper ring-1 ring-foreground/10',
        isDragging ? 'opacity-30' : '',
      ].join(' ')}
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-foreground/35 hover:text-foreground/65 flex-shrink-0"
      >
        <GripVertical className="h-3 w-3" />
      </span>
      {prefix}
      <span className="text-foreground/85 font-medium truncate flex-1">
        {col?.vietnameseName ?? field.column}
      </span>
      {extra}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Xoá"
        className="text-foreground/45 hover:text-danger flex-shrink-0"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  )
}
