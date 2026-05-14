'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PhotoUploader } from '@/components/features/PhotoUploader'

export function PhotoUploadForm() {
  const router = useRouter()
  const [photos, setPhotos] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (photos.length === 0) {
      setError('Chưa có ảnh nào để đăng')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      // Tạo SessionPhoto cho mỗi URL
      for (const photoUrl of photos) {
        const res = await fetch('/api/session-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoUrl, caption: caption.trim() || undefined })
        })
        if (!res.ok) {
          const j = await res.json()
          setError(j.error?.message ?? 'Có lỗi xảy ra')
          setSubmitting(false)
          return
        }
      }
      setPhotos([])
      setCaption('')
      setSuccess(true)
      setSubmitting(false)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    } catch {
      setError('Không thể kết nối')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass-card border border-foreground/8 p-5 space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
          Ảnh (tối đa 5)
        </label>
        <PhotoUploader folder="album" value={photos} onChange={setPhotos} max={5} />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
          Caption chung (tuỳ chọn)
        </label>
        <input type="text" maxLength={500} value={caption} onChange={e => setCaption(e.target.value)}
          placeholder="VD: Buổi minigame Tết 2026"
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
      </div>

      {error && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</div>}
      {success && <div className="text-sm text-success bg-success/10 border border-success/30 rounded-lg px-3 py-2">✓ Đã đăng!</div>}

      <button type="submit" disabled={submitting || photos.length === 0}
        className="w-full bg-ink-soft text-paper rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50">
        {submitting ? 'Đang đăng...' : `Đăng ${photos.length} ảnh`}
      </button>
    </form>
  )
}
