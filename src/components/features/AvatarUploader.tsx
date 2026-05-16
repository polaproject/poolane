'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2, Upload } from 'lucide-react'

interface Props {
  currentAvatarUrl: string | null
  fullName: string
  /** Kích thước circle. 'lg' = 80px (default), 'xl' = 96px. */
  size?: 'lg' | 'xl'
}

/**
 * AvatarUploader — circular preview lớn + nút "Đổi ảnh" ngay dưới.
 *
 * Click button → mở file picker → upload qua /api/upload → PATCH
 * /api/users/avatar lưu URL → reload page để sidebar/header refresh.
 *
 * Layout: vertical (circle trên, button dưới) cho gọn + hero-friendly.
 */
export function AvatarUploader({ currentAvatarUrl, fullName, size = 'lg' }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const initial = fullName.charAt(0).toUpperCase()
  const dim = size === 'xl' ? 'h-24 w-24' : 'h-20 w-20'
  const initialSize = size === 'xl' ? 'text-4xl' : 'text-3xl'

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'avatars')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: form })
      const uploadJson = await uploadRes.json()
      if (!uploadRes.ok) {
        toast.error(uploadJson.error?.message ?? 'Upload thất bại')
        return
      }
      const newUrl = uploadJson.data.url as string

      const patchRes = await fetch('/api/users/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: newUrl }),
      })
      const patchJson = await patchRes.json()
      if (!patchRes.ok) {
        toast.error(patchJson.error?.message ?? 'Lỗi cập nhật avatar')
        return
      }

      setAvatarUrl(newUrl)
      toast.success('Đã cập nhật avatar 🎉')
      setTimeout(() => window.location.reload(), 500)
    } catch {
      toast.error('Không thể kết nối')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove() {
    setUploading(true)
    try {
      const res = await fetch('/api/users/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: null }),
      })
      if (!res.ok) {
        toast.error('Lỗi xoá avatar')
        return
      }
      setAvatarUrl(null)
      toast.success('Đã xoá avatar')
      setTimeout(() => window.location.reload(), 500)
    } catch {
      toast.error('Không thể kết nối')
    } finally {
      setUploading(false)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) handleFile(file)
  }

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFileChange} />
      <div className={`${dim} rounded-pill overflow-hidden ring-2 ring-foreground/10 bg-accent grid place-items-center shrink-0`}>
        {avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
        ) : (
          <span className={`${initialSize} font-bold text-ink`}>{initial}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-pill ring-1 ring-foreground/15 hover:bg-foreground/5 transition text-xs font-medium disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Upload className="h-3 w-3" strokeWidth={2} />
          )}
          {avatarUrl ? 'Đổi ảnh' : 'Tải ảnh'}
        </button>
        {avatarUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="text-xs text-foreground/55 hover:text-danger transition disabled:opacity-50"
          >
            Xoá
          </button>
        )}
      </div>
    </div>
  )
}
