'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus, Activity, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

type Log = {
  id: string
  date: string
  distanceMeters: number | null
  durationMinutes: number | null
  selfFeeling: number | null
  notes: string | null
}

const FEELING_LABELS = { 1: '😊 Tốt', 2: '😊 Khá', 3: '😐 Bình thường', 4: '😟 Mệt', 5: '😟 Rất mệt' }

export default function PracticeLogPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    distanceMeters: '', durationMinutes: '',
    selfFeeling: '1', notes: ''
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

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="font-heading text-2xl text-[#1C2B4A]">Nhật ký luyện tập</h1>
          <p className="text-xs text-[#1C2B4A]/50 mt-0.5">
            Tổng: {totalMeters.toLocaleString('vi-VN')}m · {totalMinutes} phút
          </p>
        </div>
        <Button size="sm" className="bg-[#1C2B4A] text-[#F6F1EA]" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" /> Ghi nhật ký
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-[#1C2B4A]/10 p-4 mb-4 shadow-sm space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-[#1C2B4A]/50 mb-1 block">Ngày</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full h-8 px-2 text-sm rounded-lg border border-[#1C2B4A]/15 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#1C2B4A]/50 mb-1 block">Mét bơi</label>
              <input type="number" placeholder="500" value={form.distanceMeters}
                onChange={e => setForm(p => ({ ...p, distanceMeters: e.target.value }))}
                className="w-full h-8 px-2 text-sm rounded-lg border border-[#1C2B4A]/15 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#1C2B4A]/50 mb-1 block">Phút</label>
              <input type="number" placeholder="45" value={form.durationMinutes}
                onChange={e => setForm(p => ({ ...p, durationMinutes: e.target.value }))}
                className="w-full h-8 px-2 text-sm rounded-lg border border-[#1C2B4A]/15 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#1C2B4A]/50 mb-1.5 block">Cảm giác hôm nay</label>
            <div className="flex gap-2">
              {[{v:'1',l:'😊 Tốt'},{v:'3',l:'😐 TB'},{v:'5',l:'😟 Mệt'}].map(f => (
                <button key={f.v} type="button" onClick={() => setForm(p => ({ ...p, selfFeeling: f.v }))}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${form.selfFeeling === f.v ? 'bg-[#1C2B4A] text-white border-[#1C2B4A]' : 'border-[#1C2B4A]/15 hover:border-[#1C2B4A]/40'}`}>
                  {f.l}
                </button>
              ))}
            </div>
          </div>
          <input placeholder="Ghi chú (tuỳ chọn)" value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            className="w-full h-8 px-3 text-sm rounded-lg border border-[#1C2B4A]/15 focus:outline-none" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} className="flex-1">Huỷ</Button>
            <Button type="submit" size="sm" disabled={adding} className="flex-1 bg-[#1C2B4A] text-[#F6F1EA]">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu'}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#1C2B4A]/40" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-[#1C2B4A]/40">
          <Activity className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p>Chưa có nhật ký nào</p>
          <p className="text-xs mt-1">Ghi lại mỗi buổi tập để theo dõi tiến độ</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="bg-white rounded-xl border border-[#1C2B4A]/8 px-4 py-3 flex items-center gap-4">
              <div className="text-center w-12 flex-shrink-0">
                <p className="text-lg font-heading text-[#1C2B4A]">{format(new Date(log.date), 'd')}</p>
                <p className="text-xs text-[#1C2B4A]/40">{format(new Date(log.date), 'MMM', { locale: vi })}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex gap-3 text-sm">
                  {log.distanceMeters && <span className="text-[#5B8E9F] font-medium">{log.distanceMeters}m</span>}
                  {log.durationMinutes && <span className="text-[#1C2B4A]/60">{log.durationMinutes} phút</span>}
                  {log.selfFeeling && <span>{log.selfFeeling <= 2 ? '😊' : log.selfFeeling === 3 ? '😐' : '😟'}</span>}
                </div>
                {log.notes && <p className="text-xs text-[#1C2B4A]/50 truncate mt-0.5">{log.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
