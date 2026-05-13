'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { toast } from 'sonner'
import { Send, Loader2, Users, User } from 'lucide-react'

export default function BroadcastPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState<number | null>(null)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) { toast.error('Nhập tiêu đề và nội dung'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, targetType }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error(data.error?.message ?? 'Có lỗi xảy ra')
        return
      }
      setSent(data.data.sent)
      toast.success(`Đã gửi đến ${data.data.sent} học viên!`)
      setTitle('')
      setBody('')
    } catch { toast.error('Không thể kết nối') }
    finally { setLoading(false) }
  }

  const TEMPLATES = [
    { label: '📅 Nhắc lịch học', title: 'Đừng quên đăng ký buổi học tuần này!', body: 'Tuần mới bắt đầu rồi, nhớ vào app đăng ký buổi học nhé bạn! Lịch học đang có nhiều ca trống đó 🌊' },
    { label: '🎉 Thông báo sự kiện', title: 'Sự kiện đặc biệt tuần này!', body: 'Poolane có hoạt động đặc biệt trong buổi học tuần này. Đừng bỏ lỡ nhé! Chi tiết sẽ được thông báo tại bể 😊' },
    { label: '🏊 Khuyến khích', title: 'Tiếp tục cố gắng nhé!', body: 'Chào tất cả bơi thủ Poolane! Mỗi buổi học là một bước tiến. Hẹn gặp bạn ở bể nhé 💙' },
  ]

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Gửi thông báo</h1>
        <p className="text-sm text-[#1C2B4A]/50 mt-1">Broadcast đến toàn bộ học viên đang học</p>
      </div>

      {/* Templates */}
      <div className="mb-5">
        <p className="text-xs font-medium text-[#1C2B4A]/50 uppercase tracking-wider mb-2">Mẫu nhanh</p>
        <div className="flex gap-2 flex-wrap">
          {TEMPLATES.map(t => (
            <button
              key={t.label}
              onClick={() => { setTitle(t.title); setBody(t.body) }}
              className="text-xs px-3 py-1.5 bg-white border border-[#1C2B4A]/15 rounded-lg hover:border-[#1C2B4A]/40 transition-colors"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        {/* Target */}
        <Card className="border-[#1C2B4A]/10 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-6">
            <h2 className="text-sm font-semibold text-[#1C2B4A]">Gửi đến</h2>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'all', label: 'Tất cả học viên', icon: Users, desc: 'Học viên đang học + ôn luyện' },
                { value: 'specific', label: 'Chọn cụ thể', icon: User, desc: 'Chọn từng học viên' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTargetType(opt.value as 'all' | 'specific')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    targetType === opt.value
                      ? 'bg-[#1C2B4A] border-[#1C2B4A] text-white'
                      : 'border-[#1C2B4A]/15 hover:border-[#1C2B4A]/30'
                  }`}
                >
                  <opt.icon className={`w-4 h-4 mb-1.5 ${targetType === opt.value ? 'text-white' : 'text-[#1C2B4A]/60'}`} />
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className={`text-xs mt-0.5 ${targetType === opt.value ? 'text-white/60' : 'text-[#1C2B4A]/40'}`}>{opt.desc}</p>
                </button>
              ))}
            </div>
            {targetType === 'specific' && (
              <p className="text-xs text-[#5B8E9F] mt-3">
                💡 Tính năng chọn học viên cụ thể sẽ có trong update tiếp theo
              </p>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        <Card className="border-[#1C2B4A]/10 shadow-sm">
          <CardContent className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Tiêu đề <span className="text-red-500">*</span></Label>
              <input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề thông báo..."
                required
                className="w-full h-9 px-3 text-sm rounded-lg border border-[#1C2B4A]/15 focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Nội dung <span className="text-red-500">*</span></Label>
              <textarea
                id="body"
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Nhập nội dung thông báo..."
                rows={4}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#1C2B4A]/15 focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 resize-none"
              />
            </div>

            {/* Preview */}
            {(title || body) && (
              <div className="bg-[#F6F1EA] rounded-xl p-3 border border-[#1C2B4A]/8">
                <p className="text-xs text-[#1C2B4A]/40 uppercase tracking-wider mb-1.5">Xem trước</p>
                <div className="flex gap-2">
                  <span className="text-lg">💙</span>
                  <div>
                    <p className="font-semibold text-sm text-[#1C2B4A]">{title || '...'}</p>
                    <p className="text-xs text-[#1C2B4A]/60 mt-0.5">{body || '...'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={loading || !title || !body}
          className="w-full bg-[#1C2B4A] text-[#F6F1EA] hover:bg-[#1C2B4A]/90 h-11"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang gửi...</>
            : <><Send className="w-4 h-4 mr-2" />Gửi thông báo</>
          }
        </Button>

        {sent !== null && (
          <p className="text-center text-sm text-green-600">
            ✓ Đã gửi thành công đến {sent} học viên
          </p>
        )}
      </form>
    </div>
  )
}
