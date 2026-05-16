'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus, Home, Trash2, Loader2, Settings as SettingsIcon, GripVertical,
} from 'lucide-react'
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout'
import type { WidgetConfig, TimeRange, WidgetType } from '@/lib/dashboard/types'
import type { TransformedResult } from '@/lib/dashboard/query-builder'
import type { GlobalFormatSettings } from '@/lib/dashboard/format'
import { WidgetRenderer } from '@/components/dashboard/widgets/WidgetRenderer'
import { WidgetBuilderModal } from './WidgetBuilderModal'
import { DashboardTimeControl } from './DashboardTimeControl'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface WidgetData {
  id: string
  title: string
  type: WidgetType
  config: WidgetConfig
  position: { x: number; y: number; w: number; h: number }
}

interface DashboardData {
  id: string
  name: string
  description: string | null
  isHome: boolean
  layout: unknown
  slicers: unknown
  timeRange: TimeRange
  widgets: WidgetData[]
}

interface Props {
  dashboard: DashboardData
  globalFormat: GlobalFormatSettings
}

interface WidgetState {
  loading: boolean
  data: TransformedResult | null
  error: string | null
}

/** Default position cho widget mới — append cuối, half-width */
const DEFAULT_NEW_WIDGET_POSITION = { x: 0, y: Infinity, w: 6, h: 5 }

export function DashboardViewClient({ dashboard: initial, globalFormat }: Props) {
  const router = useRouter()
  const [dashboard, setDashboard] = useState(initial)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingWidget, setEditingWidget] = useState<WidgetData | null>(null)
  const [widgetStates, setWidgetStates] = useState<Record<string, WidgetState>>({})
  const [timeRange, setTimeRange] = useState<TimeRange>(
    initial.timeRange && typeof initial.timeRange === 'object' && 'preset' in initial.timeRange
      ? initial.timeRange
      : { preset: '30d' },
  )

  // Debounce timer cho PATCH layout — tránh spam khi user drag liên tục
  const saveLayoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch data cho 1 widget
  const fetchWidgetData = useCallback(async (widget: WidgetData) => {
    setWidgetStates(prev => ({ ...prev, [widget.id]: { loading: true, data: null, error: null } }))
    try {
      const res = await fetch('/api/admin/dashboards/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: widget.config, timeRange }),
      })
      const json = await res.json()
      if (!res.ok) {
        setWidgetStates(prev => ({ ...prev, [widget.id]: { loading: false, data: null, error: json.error?.message ?? 'Lỗi' } }))
        return
      }
      setWidgetStates(prev => ({ ...prev, [widget.id]: { loading: false, data: json.data as TransformedResult, error: null } }))
    } catch {
      setWidgetStates(prev => ({ ...prev, [widget.id]: { loading: false, data: null, error: 'Lỗi kết nối' } }))
    }
  }, [timeRange])

  // Re-fetch all widgets khi timeRange / widget list thay đổi
  useEffect(() => {
    for (const w of dashboard.widgets) fetchWidgetData(w)
  }, [dashboard.widgets, fetchWidgetData])

  async function deleteWidget(widgetId: string) {
    if (!confirm('Xoá widget này?')) return
    const res = await fetch(`/api/admin/dashboards/${dashboard.id}/widgets/${widgetId}`, { method: 'DELETE' })
    if (res.ok) {
      setDashboard(prev => ({ ...prev, widgets: prev.widgets.filter(w => w.id !== widgetId) }))
      toast.success('Đã xoá widget')
    } else {
      toast.error('Không xoá được')
    }
  }

  async function setAsHome() {
    const res = await fetch(`/api/admin/dashboards/${dashboard.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHome: !dashboard.isHome }),
    })
    if (res.ok) {
      setDashboard(prev => ({ ...prev, isHome: !prev.isHome }))
      toast.success(dashboard.isHome ? 'Đã bỏ Home' : 'Đã đặt làm Home')
    } else {
      toast.error('Không cập nhật được')
    }
  }

  async function deleteDashboard() {
    if (!confirm(`Xoá dashboard "${dashboard.name}"? Không thể khôi phục.`)) return
    const res = await fetch(`/api/admin/dashboards/${dashboard.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Đã xoá')
      router.push('/admin/dashboards')
    } else {
      toast.error('Không xoá được')
    }
  }

  function handleWidgetSaved(widget: WidgetData) {
    if (editingWidget) {
      setDashboard(prev => ({
        ...prev,
        widgets: prev.widgets.map(w => w.id === widget.id ? widget : w),
      }))
    } else {
      setDashboard(prev => ({ ...prev, widgets: [...prev.widgets, widget] }))
    }
    setShowBuilder(false)
    setEditingWidget(null)
  }

  /**
   * Build layout object cho ResponsiveGridLayout. lg breakpoint chính,
   * smaller breakpoints auto-flow theo logic library.
   */
  const layouts = useMemo(() => ({
    lg: dashboard.widgets.map(w => ({
      i: w.id,
      x: w.position?.x ?? 0,
      y: w.position?.y ?? 0,
      w: w.position?.w ?? 6,
      h: w.position?.h ?? 5,
      minW: 3, minH: 3,
    })),
  }), [dashboard.widgets])

  /**
   * Khi user drag/resize xong (onLayoutChange fire mỗi tick), update state +
   * debounce PATCH server 500ms. Tránh spam khi user kéo liên tục.
   */
  function handleLayoutChange(currentLayout: Layout[]) {
    // Update widget positions in state (optimistic)
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => {
        const item = currentLayout.find(l => l.i === w.id)
        if (!item) return w
        return { ...w, position: { x: item.x, y: item.y, w: item.w, h: item.h } }
      }),
    }))

    // Debounced PATCH
    if (saveLayoutTimer.current) clearTimeout(saveLayoutTimer.current)
    saveLayoutTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/dashboards/${dashboard.id}/layout`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: currentLayout.map(l => ({ id: l.i, x: l.x, y: l.y, w: l.w, h: l.h })),
          }),
        })
        if (!res.ok) toast.error('Không lưu được vị trí')
      } catch {
        toast.error('Lỗi kết nối khi lưu vị trí')
      }
    }, 600)
  }

  return (
    <div className="space-y-4">
      {/* Top controls */}
      <div className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/10 p-4 flex flex-wrap items-center gap-3">
        <DashboardTimeControl value={timeRange} onChange={setTimeRange} />
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => { setEditingWidget(null); setShowBuilder(true) }}
          className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-3 py-1.5 rounded-pill text-xs hover:bg-accent/90 transition shadow-cta"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> Thêm widget
        </button>
        <button
          type="button"
          onClick={setAsHome}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-pill ring-1 ring-foreground/15 hover:ring-accent/40 text-xs"
        >
          <Home className="h-3 w-3" />
          {dashboard.isHome ? 'Bỏ Home' : 'Đặt Home'}
        </button>
        <button
          type="button"
          onClick={deleteDashboard}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-pill ring-1 ring-foreground/15 hover:ring-danger/40 text-xs text-danger"
        >
          <Trash2 className="h-3 w-3" /> Xoá dashboard
        </button>
      </div>

      {/* Canvas */}
      {dashboard.widgets.length === 0 ? (
        <div className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/10 p-12 text-center">
          <p className="lqg-headline text-lg text-foreground mb-2">Chưa có widget</p>
          <p className="text-sm text-foreground/55 mb-4">Bấm &ldquo;Thêm widget&rdquo; để bắt đầu build pivot/chart/KPI.</p>
          <button
            type="button"
            onClick={() => { setEditingWidget(null); setShowBuilder(true) }}
            className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2 rounded-pill text-sm hover:bg-accent/90 transition shadow-cta"
          >
            <Plus className="h-4 w-4" /> Thêm widget đầu tiên
          </button>
        </div>
      ) : (
        <div className="dashboard-canvas relative rounded-card-lg ring-1 ring-foreground/10 p-2 sm:p-3 min-h-[400px] overflow-hidden">
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
            rowHeight={60}
            margin={[12, 12]}
            containerPadding={[0, 0]}
            isDraggable
            isResizable
            draggableHandle=".widget-drag-handle"
            draggableCancel=".widget-actions"
            compactType="vertical"
            onLayoutChange={handleLayoutChange}
          >
            {dashboard.widgets.map(widget => {
              const state = widgetStates[widget.id]
              return (
                <div
                  key={widget.id}
                  className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/10 overflow-hidden flex flex-col group"
                >
                  <div className="widget-drag-handle px-3 py-2 border-b border-foreground/8 flex items-center gap-2 cursor-move hover:bg-foreground/3 transition">
                    <GripVertical className="h-3.5 w-3.5 text-foreground/30 group-hover:text-foreground/55 transition" />
                    <h3 className="lqg-headline text-sm text-foreground flex-1 truncate">{widget.title}</h3>
                    <div className="widget-actions flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => { setEditingWidget(widget); setShowBuilder(true) }}
                        aria-label="Sửa widget"
                        className="p-1 rounded-md text-foreground/55 hover:text-foreground hover:bg-foreground/8"
                      >
                        <SettingsIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteWidget(widget.id)}
                        aria-label="Xoá widget"
                        className="p-1 rounded-md text-foreground/55 hover:text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-3 overflow-auto min-h-0">
                    {state?.loading ? (
                      <div className="flex items-center justify-center h-full text-foreground/55">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : state?.error ? (
                      <div className="text-center py-8 text-danger text-sm">{state.error}</div>
                    ) : state?.data ? (
                      <WidgetRenderer config={widget.config} data={state.data} globalFormat={globalFormat} />
                    ) : (
                      <div className="text-center py-8 text-foreground/55 text-sm">Đang chờ...</div>
                    )}
                  </div>
                </div>
              )
            })}
          </ResponsiveGridLayout>
        </div>
      )}

      {showBuilder && (
        <WidgetBuilderModal
          dashboardId={dashboard.id}
          initial={editingWidget}
          timeRange={timeRange}
          globalFormat={globalFormat}
          onClose={() => { setShowBuilder(false); setEditingWidget(null) }}
          onSaved={handleWidgetSaved}
        />
      )}
    </div>
  )
}

/** Default position cho widget mới (export để builder dùng) */
export { DEFAULT_NEW_WIDGET_POSITION }
