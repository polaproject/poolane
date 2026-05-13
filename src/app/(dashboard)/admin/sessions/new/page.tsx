'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewSessionPage() {
  const router = useRouter()
  const params = useSearchParams()

  const [date, setDate] = useState(params.get('date') ?? new Date().toISOString().split('T')[0])
  const [timeSlot, setTimeSlot] = useState<'morning' | 'evening'>(
    (params.get('slot') as 'morning' | 'evening') ?? 'evening'
  )
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, timeSlot, notes }),
      })

      const result = await res.json()

      if (!res.ok || result.error) {
        toast.error(result.error?.message ?? 'Có lỗi xảy ra')
        return
      }

      toast.success('Đã tạo buổi học thành công!')
      router.push('/admin/schedule')

    } catch {
      toast.error('Không thể kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/schedule"><ArrowLeft className="w-4 h-4 mr-1" /> Lịch học</Link>
        </Button>
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Tạo buổi học</h1>
      </div>

      <Card className="border-[#1C2B4A]/10 shadow-sm">
        <CardHeader className="pb-2 pt-5 px-6">
          <h2 className="text-base font-semibold text-[#1C2B4A]">Thông tin buổi học</h2>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Ngày học <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Ca học <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'morning', label: 'Ca Sáng', time: '5:30 – 7:30', max: 5 },
                  { value: 'evening', label: 'Ca Chiều', time: '18:00 – 20:00', max: 7 },
                ].map(slot => (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => setTimeSlot(slot.value as 'morning' | 'evening')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      timeSlot === slot.value
                        ? 'bg-[#1C2B4A] border-[#1C2B4A] text-white'
                        : 'bg-white border-[#1C2B4A]/15 text-[#1C2B4A] hover:border-[#1C2B4A]/40'
                    }`}
                  >
                    <p className="font-semibold text-sm">{slot.label}</p>
                    <p className={`text-xs mt-0.5 ${timeSlot === slot.value ? 'text-white/60' : 'text-[#1C2B4A]/50'}`}>
                      {slot.time} · Tối đa {slot.max} người
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Ghi chú (tuỳ chọn)</Label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Ví dụ: Tập trung kỹ năng thở hôm nay..."
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" asChild className="flex-1">
                <Link href="/admin/schedule">Huỷ</Link>
              </Button>
              <Button
                type="submit"
                disabled={loading || !date}
                className="flex-1 bg-[#1C2B4A] text-[#F6F1EA] hover:bg-[#1C2B4A]/90"
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang tạo...</> : 'Tạo buổi học'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
