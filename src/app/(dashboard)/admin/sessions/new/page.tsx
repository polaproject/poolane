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
import { PageHeader } from '@/components/ui/PageHeader'

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
    <div className="ambient-bg min-h-screen">
      <div className="max-w-lg mx-auto">
        <Link href="/admin/schedule" className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Lịch học
        </Link>
        <PageHeader
          eyebrow="Lịch"
          title="Tạo buổi học"
          description="Thêm buổi học mới — sáng hoặc chiều — để học viên đăng ký."
          display
          className="mb-8"
        />

      <Card className="border-foreground/10 shadow-sm">
        <CardHeader className="pb-2 pt-5 px-6">
          <h2 className="text-base font-semibold text-foreground">Thông tin buổi học</h2>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Ngày học <span className="text-danger">*</span></Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Ca học <span className="text-danger">*</span></Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        ? 'bg-ink-soft border-ink text-white'
                        : 'bg-[var(--surface)] border-foreground/15 text-foreground hover:border-foreground/40'
                    }`}
                  >
                    <p className="font-semibold text-sm">{slot.label}</p>
                    <p className={`text-xs mt-0.5 ${timeSlot === slot.value ? 'text-white/60' : 'text-foreground/50'}`}>
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
                className="flex-1 bg-ink-soft text-paper hover:bg-foreground/90"
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang tạo...</> : 'Tạo buổi học'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
