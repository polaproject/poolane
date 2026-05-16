'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import Cropper, { type Area } from 'react-easy-crop'
import { X, ZoomIn, ZoomOut, Loader2 } from 'lucide-react'
import { getCroppedBlob } from '@/lib/image-crop'

interface Props {
  src: string
  onCancel: () => void
  onCropped: (blob: Blob) => void
}

/**
 * AvatarCropDialog — Dialog cho phép user crop ảnh thành vùng tròn để dùng
 * làm avatar. Layout:
 *   - Khung vuông (aspect-square) chứa ảnh gốc
 *   - Overlay tròn ở giữa = vùng hiển thị thực tế (cropShape="round")
 *   - Phần ngoài tròn trong vuông: tối mờ (react-easy-crop tự render)
 *   - Slider zoom + 2 nút ZoomIn/ZoomOut
 *
 * Output: square Blob qua canvas (CSS render thành tròn ở UI).
 */
export function AvatarCropDialog({ src, onCancel, onCropped }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Đo container để force cropSize gần sát mép → vòng tròn to nhất có thể
  const containerRef = useRef<HTMLDivElement>(null)
  const [cropSize, setCropSize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      // -8px chừa biên rất mỏng → vòng tròn nearly full container
      const size = Math.max(0, w - 8)
      setCropSize({ width: size, height: size })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  async function handleSubmit() {
    if (!croppedAreaPixels) return
    setSubmitting(true)
    try {
      const blob = await getCroppedBlob(src, croppedAreaPixels)
      onCropped(blob)
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onCancel()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/65 backdrop-blur-sm data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-200" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[min(440px,calc(100vw-2rem))] max-h-[calc(100vh-3rem)] overflow-y-auto bg-[var(--surface)] rounded-card-xl shadow-glass ring-1 ring-foreground/10 p-5 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95 transition-all duration-200">
          <Dialog.Close
            aria-label="Đóng"
            className="absolute top-3 right-3 h-9 w-9 rounded-pill bg-foreground/5 hover:bg-foreground/10 grid place-items-center transition z-10"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </Dialog.Close>

          <Dialog.Title className="lqg-headline text-xl text-foreground mb-1 pr-10">
            Cập nhật ảnh đại diện
          </Dialog.Title>
          <Dialog.Description className="text-sm text-foreground/65 mb-4 leading-relaxed">
            Kéo ảnh để di chuyển vào vùng tròn. Dùng thanh trượt để phóng to / thu nhỏ.
          </Dialog.Description>

          {/* Crop area — vuông, ảnh fill, vòng tròn nearly full container */}
          <div ref={containerRef} className="relative w-full aspect-square rounded-card overflow-hidden bg-ink mb-3">
            {cropSize && (
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                cropSize={cropSize}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                objectFit="cover"
              />
            )}
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
              aria-label="Thu nhỏ"
              className="h-8 w-8 rounded-pill bg-foreground/5 grid place-items-center hover:bg-foreground/10 transition shrink-0"
            >
              <ZoomOut className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Mức phóng to"
              className="flex-1 accent-[var(--lqg-accent)]"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              aria-label="Phóng to"
              className="h-8 w-8 rounded-pill bg-foreground/5 grid place-items-center hover:bg-foreground/10 transition shrink-0"
            >
              <ZoomIn className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-4 h-10 text-sm font-medium rounded-pill ring-1 ring-foreground/15 hover:bg-foreground/5 transition disabled:opacity-50"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !croppedAreaPixels}
              className="flex-1 bg-accent text-ink rounded-pill h-10 text-sm font-semibold hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</>
              ) : (
                'Cập nhật avatar'
              )}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
