'use client'

import { useState } from 'react'
import { PhotoUploader } from './PhotoUploader'
import { toast } from 'sonner'

interface Props {
  currentAvatarUrl: string | null
  fullName: string
}

/**
 * AvatarUploader — circular avatar preview + upload qua PhotoUploader.
 * Khi user chọn ảnh → upload Supabase Storage → PATCH /api/users/avatar
 * cập nhật User.avatarUrl → reload page để sidebar/header refresh.
 */
export function AvatarUploader({ currentAvatarUrl, fullName }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [saving, setSaving] = useState(false)
  const initial = fullName.charAt(0).toUpperCase()

  async function handleChange(urls: string[]) {
    const newUrl = urls[0] ?? null
    setSaving(true)
    try {
      const res = await fetch('/api/users/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: newUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Lỗi cập nhật avatar')
        return
      }
      setAvatarUrl(newUrl)
      toast.success(newUrl ? 'Đã cập nhật avatar 🎉' : 'Đã xoá avatar')
      // Reload sau 500ms để sidebar + header hiển thị avatar mới
      setTimeout(() => window.location.reload(), 500)
    } catch {
      toast.error('Không thể kết nối')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="h-20 w-20 rounded-full overflow-hidden ring-2 ring-foreground/10 bg-accent grid place-items-center shrink-0">
        {avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-ink">{initial}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <PhotoUploader
          folder="avatars"
          value={avatarUrl ? [avatarUrl] : []}
          onChange={handleChange}
          max={1}
          variant="single"
        />
        <p className="text-xs text-foreground/55 mt-2">
          Ảnh hiển thị trên sidebar + header. JPG/PNG/WebP, tối đa 5MB.
          {saving && ' Đang lưu...'}
        </p>
      </div>
    </div>
  )
}
