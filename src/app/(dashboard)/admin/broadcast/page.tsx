'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Send, Loader2, Users, User, BellRing, CheckCircle2 } from 'lucide-react'

const TEMPLATES = [
  { label: 'Nhắc lịch học', title: 'Đừng quên đăng ký buổi học tuần này!', body: 'Tuần mới bắt đầu rồi, nhớ vào app đăng ký buổi học nhé bạn! Lịch học đang có nhiều ca trống đó.' },
  { label: 'Thông báo sự kiện', title: 'Sự kiện đặc biệt tuần này!', body: 'Poolane có hoạt động đặc biệt trong buổi học tuần này. Đừng bỏ lỡ nhé! Chi tiết sẽ được thông báo tại bể.' },
  { label: 'Khuyến khích', title: 'Tiếp tục cố gắng nhé!', body: 'Chào tất cả bơi thủ Poolane! Mỗi buổi học là một bước tiến. Hẹn gặp bạn ở bể.' },
]

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
      if (!res.ok || data.error) { toast.error(data.error?.message ?? 'Có lỗi xảy ra'); return }
      setSent(data.data.sent)
      toast.success(`Đã gửi đến ${data.data.sent} học viên`)
      setTitle('')
      setBody('')
    } catch { toast.error('Không thể kết nối') }
    finally { setLoading(false) }
  }

  const inputClass = 'w-full h-11 px-4 text-sm rounded-pill bg-paper-tint/40 ring-1 ring-foreground/10 focus:ring-accent/40 focus:outline-none transition'

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-2xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
            <BellRing className="h-3 w-3 text-accent" strokeWidth={1.75} /> Broadcast toàn lớp
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Gửi thông báo</h1>
        </div>
      </div>

      <div className="pl-5 pr-[5rem] sm:px-8 -mt-6 max-w-2xl mx-auto space-y-4 relative z-10">
        {/* Templates */}
        <div className="glass-card glass-card-hover p-4">
          <p className="eyebrow text-foreground/55 mb-2">Mẫu nhanh</p>
          <div className="flex gap-2 flex-wrap">
            {TEMPLATES.map(t => (
              <button
                key={t.label}
                onClick={() => { setTitle(t.title); setBody(t.body) }}
                className="text-xs px-3 py-1.5 rounded-pill bg-paper-tint/60 ring-1 ring-foreground/10 text-foreground hover:bg-paper-tint hover:ring-accent/40 transition"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          {/* Target */}
          <div className="glass-card glass-card-hover p-5">
            <p className="eyebrow text-foreground/55 mb-3">Gửi đến</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'all', label: 'Tất cả học viên', icon: Users, desc: 'Đang học + ôn luyện' },
                { value: 'specific', label: 'Chọn cụ thể', icon: User, desc: 'Chọn từng người' },
              ].map(opt => {
                const Icon = opt.icon
                const active = targetType === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTargetType(opt.value as 'all' | 'specific')}
                    className={`p-4 rounded-card text-left transition ring-1 ${
                      active
                        ? 'bg-ink text-paper ring-ink shadow-soft'
                        : 'bg-paper-tint/30 ring-foreground/10 hover:ring-accent/30'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mb-2 ${active ? 'text-accent' : 'text-foreground/60'}`} strokeWidth={1.75} />
                    <p className={`font-medium text-sm ${active ? 'text-paper' : 'text-foreground'}`}>{opt.label}</p>
                    <p className={`text-xs mt-1 ${active ? 'text-paper/65' : 'text-foreground/55'}`}>{opt.desc}</p>
                  </button>
                )
              })}
            </div>
            {targetType === 'specific' && (
              <p className="text-xs text-mist mt-3">
                Tính năng chọn HV cụ thể sẽ có trong update tiếp theo.
              </p>
            )}
          </div>

          {/* Content */}
          <div className="glass-card glass-card-hover p-5 space-y-4">
            <div>
              <label htmlFor="title" className="eyebrow text-foreground/55 mb-1.5 block">
                Tiêu đề <span className="text-danger">*</span>
              </label>
              <input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề thông báo..."
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="body" className="eyebrow text-foreground/55 mb-1.5 block">
                Nội dung <span className="text-danger">*</span>
              </label>
              <textarea
                id="body"
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Nhập nội dung thông báo..."
                rows={4}
                required
                className="w-full px-4 py-3 text-sm rounded-card-lg bg-paper-tint/40 ring-1 ring-foreground/10 focus:ring-accent/40 focus:outline-none transition resize-none"
              />
            </div>

            {(title || body) && (
              <div className="rounded-card bg-paper-tint/40 ring-1 ring-foreground/8 p-3">
                <p className="eyebrow text-foreground/45 mb-2">Xem trước</p>
                <div className="flex gap-2">
                  <BellRing className="h-4 w-4 text-accent shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground">{title || '...'}</p>
                    <p className="text-xs text-foreground/65 mt-0.5">{body || '...'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !title || !body}
            className="w-full inline-flex items-center justify-center gap-2 bg-ink text-paper font-semibold h-12 rounded-pill hover:bg-foreground/90 transition disabled:opacity-60 shadow-soft"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang gửi...</>
              : <><Send className="h-4 w-4 text-accent" strokeWidth={2.25} /> Gửi thông báo</>
            }
          </button>

          {sent !== null && (
            <p className="text-center text-sm text-success inline-flex items-center justify-center gap-1.5 w-full">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} /> Đã gửi đến {sent} học viên
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
