'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Check, X, Target, Loader2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

type Goal = {
  id: string
  goalText: string
  targetDate: string | null
  status: string
  createdAt: string
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [newGoal, setNewGoal] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const loadGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/skill-goals')
      const data = await res.json()
      if (data.data) setGoals(data.data)
    } catch { toast.error('Không thể tải mục tiêu') }
    finally { setLoading(false) }
  }, [])

   
  useEffect(() => { loadGoals() }, [loadGoals])

  async function handleAdd() {
    if (!newGoal.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/skill-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalText: newGoal, targetDate: targetDate || undefined }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { toast.error(data.error?.message ?? 'Lỗi'); return }
      toast.success('Đã thêm mục tiêu!')
      setNewGoal(''); setTargetDate(''); setShowForm(false)
      loadGoals()
    } catch { toast.error('Không thể kết nối') }
    finally { setAdding(false) }
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/skill-goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    toast.success(status === 'achieved' ? 'Đã đạt mục tiêu!' : 'Đã cập nhật')
    loadGoals()
  }

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-3xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2">{goals.length} mục tiêu đang theo dõi</p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Mục tiêu cá nhân</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2.5 rounded-pill text-sm hover:bg-accent/90 transition shadow-cta"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Thêm mục tiêu
          </button>
        </div>
      </div>

      <div className="-mt-6 max-w-3xl mx-auto space-y-3 relative z-10">
        {showForm && (
          <div className="rounded-card-lg bg-[var(--surface)] shadow-soft ring-1 ring-accent/40 p-5">
            <textarea
              value={newGoal}
              onChange={e => setNewGoal(e.target.value)}
              placeholder="Mục tiêu của bạn... Ví dụ: Bơi được 50m liên tục không nghỉ"
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-card bg-paper-tint/40 ring-1 ring-foreground/10 focus:ring-accent/40 focus:outline-none resize-none mb-3 transition"
            />
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs text-foreground/55 mb-1.5 block">Hạn (tuỳ chọn)</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-pill bg-paper-tint/40 ring-1 ring-foreground/10 focus:ring-accent/40 focus:outline-none transition"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 h-10 rounded-pill ring-1 ring-foreground/15 text-sm hover:bg-foreground/5 transition"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleAdd}
                  disabled={adding || !newGoal.trim()}
                  className="px-4 h-10 rounded-pill bg-ink text-paper text-sm font-semibold hover:bg-foreground/90 transition disabled:opacity-60 inline-flex items-center gap-1.5"
                >
                  {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={1.75} />
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <Target className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">Chưa có mục tiêu</p>
            <p className="text-sm text-foreground/55">Đặt mục tiêu để theo dõi tiến độ và giữ động lực.</p>
          </div>
        ) : (
          goals.map(goal => (
            <div key={goal.id} className="glass-card glass-card-hover p-5">
              <div className="flex gap-3">
                <div className="grid place-items-center h-10 w-10 rounded-pill bg-accent/15 shrink-0">
                  <Target className="h-4 w-4 text-accent" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{goal.goalText}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-foreground/55 flex-wrap">
                    {goal.targetDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" strokeWidth={1.75} /> Hạn {format(new Date(goal.targetDate), 'dd/MM/yyyy')}
                      </span>
                    )}
                    <span className="text-foreground/35">
                      Đặt {format(new Date(goal.createdAt), 'dd/MM', { locale: vi })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => updateStatus(goal.id, 'achieved')}
                    className="h-8 w-8 rounded-pill bg-success/15 ring-1 ring-success/30 grid place-items-center hover:bg-success/25 transition"
                    title="Đã đạt"
                  >
                    <Check className="h-4 w-4 text-success" strokeWidth={2.25} />
                  </button>
                  <button
                    onClick={() => updateStatus(goal.id, 'abandoned')}
                    className="h-8 w-8 rounded-pill bg-ink/5 ring-1 ring-foreground/10 grid place-items-center hover:bg-danger/10 hover:ring-danger/30 transition"
                    title="Bỏ qua"
                  >
                    <X className="h-4 w-4 text-foreground/55" strokeWidth={2.25} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
