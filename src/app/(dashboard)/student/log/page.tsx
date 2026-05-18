'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Activity, Loader2, Smile, Meh, Frown } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Chip } from '@/components/ui/Chip'

type Log = {
  id: string
  date: string
  distanceMeters: number | null
  durationMinutes: number | null
  selfFeeling: number | null
  notes: string | null
}

export default function PracticeLogPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    distanceMeters: '', durationMinutes: '',
    selfFeeling: '1', notes: '',
  })

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/practice-logs')
      const data = await res.json()
      if (data.data) setLogs(data.data)
    } catch { toast.error('Không thể tải nhật ký') }
    finally { setLoading(false) }
  }, [])

   
  useEffect(() => { loadLogs() }, [loadLogs])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    try {
      const res = await fetch('/api/practice-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date,
          distanceMeters: form.distanceMeters ? parseInt(form.distanceMeters) : undefined,
          durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : undefined,
          selfFeeling: parseInt(form.selfFeeling),
          notes: form.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { toast.error(data.error?.message ?? 'Lỗi'); return }
      toast.success('Đã ghi nhật ký!')
      setShowForm(false)
      setForm({ date: new Date().toISOString().split('T')[0], distanceMeters: '', durationMinutes: '', selfFeeling: '1', notes: '' })
      loadLogs()
    } catch { toast.error('Không thể kết nối') }
    finally { setAdding(false) }
  }

  const totalMeters = logs.reduce((sum, l) => sum + (l.distanceMeters ?? 0), 0)
  const totalMinutes = logs.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0)

  const inputClass = 'w-full h-10 px-3 text-sm rounded-pill bg-paper-tint/40 ring-1 ring-foreground/10 focus:ring-accent/40 focus:outline-none transition'
  const feelingOptions = [
    { v: '1', icon: Smile, label: 'Tốt', tone: 'success' as const },
    { v: '3', icon: Meh,   label: 'TB',  tone: 'mist' as const },
    { v: '5', icon: Frown, label: 'Mệt', tone: 'warn' as const },
  ]

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-3xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2">
              Tổng {totalMeters.toLocaleString('vi-VN')}m · {totalMinutes} phút
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Nhật ký luyện tập</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2.5 rounded-pill text-sm hover:bg-accent/90 transition shadow-cta"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Ghi nhật ký
          </button>
        </div>
      </div>

      <div className="-mt-6 max-w-3xl mx-auto space-y-3 relative z-10">
        {showForm && (
          <form onSubmit={handleAdd} className="rounded-card-lg bg-[var(--surface)] shadow-soft ring-1 ring-accent/40 p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-foreground/55 mb-1.5 block">Ngày</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-foreground/55 mb-1.5 block">Mét bơi</label>
                <input
                  type="number"
                  placeholder="500"
                  value={form.distanceMeters}
                  onChange={e => setForm(p => ({ ...p, distanceMeters: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-foreground/55 mb-1.5 block">Thời gian (phút)</label>
                <input
                  type="number"
                  placeholder="45"
                  value={form.durationMinutes}
                  onChange={e => setForm(p => ({ ...p, durationMinutes: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-foreground/55 mb-2 block">Cảm giác hôm nay</label>
              <div className="flex gap-2">
                {feelingOptions.map(f => {
                  const F = f.icon
                  const active = form.selfFeeling === f.v
                  return (
                    <button
                      key={f.v}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, selfFeeling: f.v }))}
                      className={`flex-1 py-2.5 rounded-pill text-sm font-medium transition inline-flex items-center justify-center gap-1.5 ring-1 ${
                        active ? 'bg-ink text-paper ring-ink' : 'ring-foreground/15 hover:bg-foreground/5'
                      }`}
                    >
                      <F className="h-4 w-4" strokeWidth={1.75} /> {f.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <input
              placeholder="Ghi chú (tuỳ chọn)"
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className={inputClass}
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 h-10 rounded-pill ring-1 ring-foreground/15 text-sm hover:bg-foreground/5 transition"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={adding}
                className="flex-1 h-10 rounded-pill bg-ink text-paper text-sm font-semibold hover:bg-foreground/90 transition disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
              >
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu nhật ký'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={1.75} />
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <Activity className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">Chưa có nhật ký</p>
            <p className="text-sm text-foreground/55">Ghi lại mỗi buổi tập để theo dõi tiến độ.</p>
          </div>
        ) : (
          logs.map(log => {
            const feelingMeta = log.selfFeeling
              ? log.selfFeeling <= 2
                ? { icon: Smile, label: 'Tốt', variant: 'success' as const }
                : log.selfFeeling === 3
                  ? { icon: Meh, label: 'TB', variant: 'mist' as const }
                  : { icon: Frown, label: 'Mệt', variant: 'warn' as const }
              : null
            const F = feelingMeta?.icon
            return (
              <div key={log.id} className="glass-card glass-card-hover px-5 py-4 flex items-center gap-4">
                <div className="text-center w-12 shrink-0">
                  <p className="lqg-headline text-2xl text-foreground leading-none">
                    {format(new Date(log.date), 'd')}
                  </p>
                  <p className="text-[10px] tracking-widest uppercase text-foreground/45 mt-1">
                    {format(new Date(log.date), 'MMM', { locale: vi })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex gap-2 flex-wrap text-sm items-center">
                    {log.distanceMeters && (
                      <span className="text-accent font-medium">{log.distanceMeters}m</span>
                    )}
                    {log.durationMinutes && (
                      <span className="text-foreground/65">{log.durationMinutes} phút</span>
                    )}
                    {feelingMeta && F && (
                      <Chip variant={feelingMeta.variant} className="text-[10px]">
                        <F className="h-3 w-3" strokeWidth={2.25} /> {feelingMeta.label}
                      </Chip>
                    )}
                  </div>
                  {log.notes && (
                    <p className="text-xs text-foreground/55 truncate mt-1">{log.notes}</p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
