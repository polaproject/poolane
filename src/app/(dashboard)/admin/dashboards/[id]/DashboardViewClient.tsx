'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Home, Trash2, Loader2, Settings as SettingsIcon } from 'lucide-react'
import type { WidgetConfig, TimeRange, WidgetType } from '@/lib/dashboard/types'
import type { TransformedResult } from '@/lib/dashboard/query-builder'
import type { GlobalFormatSettings } from '@/lib/dashboard/format'
import { WidgetRenderer } from '@/components/dashboard/widgets/WidgetRenderer'
import { WidgetBuilderModal } from './WidgetBuilderModal'
import { DashboardTimeControl } from './DashboardTimeControl'

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

  // Re-fetch all widgets when timeRange or dashboard.widgets changes
  useEffect(() => {
    for (const w of dashboard.widgets) {
      fetchWidgetData(w)
    }
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

  return (
    <div className="space-y-4">
      {/* Top controls */}
      <div className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/10 p-4 flex flex-wrap items-center gap-3">
        <DashboardTimeControl
          value={timeRange}
          onChange={setTimeRange}
        />
        <div className="flex-1" />
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

      {/* Widgets grid */}
      {dashboard.widgets.length === 0 ? (
        <div className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/10 p-12 text-center">
          <p className="lqg-headline text-lg text-foreground mb-2">Chưa có widget</p>
          <p className="text-sm text-foreground/55 mb-4">Bấm &ldquo;Thêm widget&rdquo; để bắt đầu build pivot/chart.</p>
          <button
            type="button"
            onClick={() => { setEditingWidget(null); setShowBuilder(true) }}
            className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2 rounded-pill text-sm hover:bg-accent/90 transition"
          >
            <Plus className="h-4 w-4" /> Thêm widget đầu tiên
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {dashboard.widgets.map(widget => {
              const state = widgetStates[widget.id]
              return (
                <div key={widget.id} className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/10 overflow-hidden">
                  <div className="px-4 py-3 border-b border-foreground/8 flex items-center justify-between">
                    <h3 className="lqg-headline text-sm text-foreground">{widget.title}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => { setEditingWidget(widget); setShowBuilder(true) }}
                        aria-label="Sửa widget"
                        className="p-1.5 rounded-md text-foreground/55 hover:text-foreground hover:bg-foreground/8"
                      >
                        <SettingsIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteWidget(widget.id)}
                        aria-label="Xoá widget"
                        className="p-1.5 rounded-md text-foreground/55 hover:text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 min-h-[200px]">
                    {state?.loading ? (
                      <div className="flex items-center justify-center h-40 text-foreground/55">
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
          </div>
          <button
            type="button"
            onClick={() => { setEditingWidget(null); setShowBuilder(true) }}
            className="w-full rounded-card-lg ring-2 ring-dashed ring-foreground/15 hover:ring-accent/40 hover:bg-foreground/3 p-4 transition flex items-center justify-center gap-2 text-foreground/55"
          >
            <Plus className="h-4 w-4" /> Thêm widget
          </button>
        </>
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
