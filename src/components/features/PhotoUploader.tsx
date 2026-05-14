'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, ImagePlus } from 'lucide-react'

interface Props {
  /** Folder để lưu trữ trên Storage (vd: 'products', 'blog-covers', 'avatars') */
  folder?: string
  /** URLs hiện tại — sẽ hiển thị preview */
  value: string[]
  /** Callback khi list thay đổi */
  onChange: (urls: string[]) => void
  /** Max số ảnh (default 5) */
  max?: number
  /** Layout — single thumbnail (avatar/cover) hoặc grid */
  variant?: 'single' | 'grid'
}

export function PhotoUploader({
  folder = 'misc',
  value,
  onChange,
  max = 5,
  variant = 'grid',
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', folder)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Upload thất bại')
        return
      }
      onChange([...value, json.data.url])
    } catch {
      setError('Không thể kết nối tới máy chủ')
    } finally {
      setUploading(false)
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    for (const f of files) {
      if (value.length >= max) {
        setError(`Tối đa ${max} ảnh`)
        break
      }
      await uploadFile(f)
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  if (variant === 'single') {
    const current = value[0]
    return (
      <div>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFileChange} />
        <div className="flex items-center gap-3">
          {current ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current} alt="" className="w-20 h-20 rounded-xl object-cover border border-foreground/15" />
              <button type="button" onClick={() => removeAt(0)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-foreground/20 flex items-center justify-center bg-paper/40">
              <ImagePlus className="w-6 h-6 text-foreground/30" />
            </div>
          )}
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-foreground/15 text-foreground/70 hover:bg-foreground/5 disabled:opacity-50">
            {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Đang tải...</> : <><Upload className="w-3.5 h-3.5" /> {current ? 'Đổi ảnh' : 'Chọn ảnh'}</>}
          </button>
        </div>
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFileChange} multiple />
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {value.map((url, i) => (
          <div key={i} className="relative group aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full rounded-lg object-cover border border-foreground/10" />
            <button type="button" onClick={() => removeAt(i)}
              className="absolute top-1 right-1 w-6 h-6 bg-red-600/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-foreground/20 flex flex-col items-center justify-center bg-paper/40 hover:border-foreground/40 hover:bg-paper/60 disabled:opacity-50">
            {uploading
              ? <Loader2 className="w-5 h-5 animate-spin text-foreground/40" />
              : <>
                  <ImagePlus className="w-5 h-5 text-foreground/40 mb-0.5" />
                  <span className="text-xs text-foreground/50">Thêm ảnh</span>
                </>
            }
          </button>
        )}
      </div>
      {error && <p className="text-xs text-danger mt-2">{error}</p>}
      <p className="text-xs text-foreground/40 mt-1.5">
        Đã có {value.length}/{max} · Tối đa 5MB · JPG/PNG/WebP/GIF
      </p>
    </div>
  )
}
