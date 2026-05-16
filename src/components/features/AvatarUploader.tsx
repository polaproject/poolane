'use client'

import { useState, useRef } from 'react'
import { Popover } from '@base-ui/react/popover'
import { Pencil, Upload, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AvatarCropDialog } from './AvatarCropDialog'

interface Props {
  currentAvatarUrl: string | null
  fullName: string
  size?: 'lg' | 'xl'
}

/**
 * AvatarUploader (Phase 18.11) — circular avatar + 1 nút "Sửa" duy nhất.
 *
 * Flow:
 *   - Click "Sửa" → Popover hiện 2 option:
 *     - "Cập nhật" → file picker → AvatarCropDialog (zoom + drag + crop)
 *     - "Xoá ảnh" → PATCH null → fallback initials
 *   - Crop dialog: vuông + overlay tròn, output qua canvas (max 512px)
 *
 * Trước Phase 18.11: 2 button rời "Đổi ảnh" + "Xoá" tốn diện tích.
 */
export function AvatarUploader({ currentAvatarUrl, fullName, size = 'lg' }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sourceImage, setSourceImage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const initial = fullName.charAt(0).toUpperCase()
  const dim = size === 'xl' ? 'h-24 w-24' : 'h-20 w-20'
  const initialSize = size === 'xl' ? 'text-4xl' : 'text-3xl'

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setSourceImage(ev.target?.result as string)
      setPopoverOpen(false)
    }
    reader.readAsDataURL(file)
  }

  async function handleRemove() {
    setPopoverOpen(false)
    setBusy(true)
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
      setBusy(false)
    }
  }

  async function handleCropped(blob: Blob) {
    setSourceImage(null)
    setBusy(true)
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'avatars')
      const upRes = await fetch('/api/upload', { method: 'POST', body: form })
      const upJson = await upRes.json()
      if (!upRes.ok) {
        toast.error(upJson.error?.message ?? 'Upload thất bại')
        return
      }
      const newUrl = upJson.data.url as string

      const patchRes = await fetch('/api/users/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: newUrl }),
      })
      if (!patchRes.ok) {
        toast.error('Lỗi lưu avatar')
        return
      }

      setAvatarUrl(newUrl)
      toast.success('Đã cập nhật avatar 🎉')
      setTimeout(() => window.location.reload(), 500)
    } catch {
      toast.error('Không thể kết nối')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFilePick} />

      <div className={`${dim} rounded-pill overflow-hidden ring-2 ring-foreground/10 bg-accent grid place-items-center shrink-0`}>
        {avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
        ) : (
          <span className={`${initialSize} font-bold text-ink`}>{initial}</span>
        )}
      </div>

      <Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen} modal={false}>
        <Popover.Trigger
          disabled={busy}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-pill ring-1 ring-foreground/15 hover:bg-foreground/5 transition text-xs font-medium disabled:opacity-50 cursor-pointer"
        >
          {busy ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Pencil className="h-3 w-3" strokeWidth={2} />
          )}
          Sửa
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom" align="center" sideOffset={6} className="z-[60]">
            <Popover.Popup className="z-50 glass-panel rounded-card-lg w-44 py-1 shadow-glass overflow-hidden">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm w-full text-left hover:bg-foreground/5 transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-accent" strokeWidth={1.75} />
                Cập nhật
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm w-full text-left text-danger hover:bg-danger/5 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                  Xoá ảnh
                </button>
              )}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      {sourceImage && (
        <AvatarCropDialog
          src={sourceImage}
          onCancel={() => setSourceImage(null)}
          onCropped={handleCropped}
        />
      )}
    </div>
  )
}
