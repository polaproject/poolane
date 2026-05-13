'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus, Check, X, Target, Loader2 } from 'lucide-react'
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
    toast.success(status === 'achieved' ? '🎉 Đã đạt mục tiêu!' : 'Đã cập nhật')
    loadGoals()
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-heading text-2xl text-[#1C2B4A]">Mục tiêu cá nhân</h1>
          <p className="text-xs text-[#1C2B4A]/50 mt-0.5">{goals.length} mục tiêu đang theo dõi</p>
        </div>
        <Button
          size="sm"
          className="bg-[#1C2B4A] text-[#F6F1EA]"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4 mr-1" /> Thêm
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-[#1C2B4A]/10 p-4 mb-4 shadow-sm">
          <textarea
            value={newGoal}
            onChange={e => setNewGoal(e.target.value)}
            placeholder="Mục tiêu của bạn... Ví dụ: Bơi được 50m liên tục không nghỉ"
            rows={3}
            className="w-full text-sm px-3 py-2 rounded-lg border border-[#1C2B4A]/15 resize-none focus:outline-none mb-3"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-[#1C2B4A]/50 mb-1 block">Hạn (tuỳ chọn)</label>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                className="w-full h-8 px-3 text-sm rounded-lg border border-[#1C2B4A]/15 focus:outline-none" />
            </div>
            <div className="flex gap-2 items-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Huỷ</Button>
              <Button size="sm" className="bg-[#1C2B4A] text-[#F6F1EA]"
                disabled={adding || !newGoal.trim()} onClick={handleAdd}>
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#1C2B4A]/40" /></div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12 text-[#1C2B4A]/40">
          <Target className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p>Chưa có mục tiêu nào</p>
          <p className="text-xs mt-1">Đặt mục tiêu để theo dõi tiến độ của bạn</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map(goal => (
            <div key={goal.id} className="bg-white rounded-2xl border border-[#1C2B4A]/8 p-4 shadow-sm">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#5B8E9F]/15 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-[#5B8E9F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1C2B4A] leading-relaxed">{goal.goalText}</p>
                  {goal.targetDate && (
                    <p className="text-xs text-[#1C2B4A]/40 mt-1">
                      🗓 Hạn: {format(new Date(goal.targetDate), 'dd/MM/yyyy')}
                    </p>
                  )}
                  <p className="text-xs text-[#1C2B4A]/30 mt-0.5">
                    Đặt ngày {format(new Date(goal.createdAt), 'dd/MM', { locale: vi })}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => updateStatus(goal.id, 'achieved')}
                    className="w-7 h-7 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center hover:bg-green-100"
                    title="Đã đạt">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </button>
                  <button onClick={() => updateStatus(goal.id, 'abandoned')}
                    className="w-7 h-7 rounded-lg bg-[#F6F1EA] border border-[#1C2B4A]/10 flex items-center justify-center hover:bg-red-50"
                    title="Bỏ qua">
                    <X className="w-3.5 h-3.5 text-[#1C2B4A]/40" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
