'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import Cropper, { type Area } from 'react-easy-crop'
import { X, ZoomIn, ZoomOut, Loader2 } from 'lucide-react'
import { getCroppedBlob } from '@/lib/image-crop'

interface Props {
  src: string
  onCancel: () => void
  onCropped: (blob: Blob) => void
}

const MIN_ZOOM = 0.4 // < 1 → user co ảnh nhỏ hơn container, có khoảng trống quanh ảnh
const MAX_ZOOM = 4
const ZOOM_STEP = 0.1
const CIRCLE_RATIO = 0.78 // crop circle = 78% smaller dimension → fit gọn trong vùng ảnh

/**
 * AvatarCropDialog — hiển thị ảnh ở TỶ LỆ THẬT (không ép vuông), user toàn quyền
 * phóng to / thu nhỏ / pan để đưa vùng muốn chọn vào khung tròn.
 *
 * Key change vs trước:
 *   - Container có `aspectRatio = imageAspect` (set sau onMediaLoaded) → ảnh
 *     wide hiển thị container wide, ảnh portrait hiển thị container tall.
 *   - `objectFit="contain"` → ảnh fill container 100% (no letterbox vì aspect match).
 *   - `cropSize` = 78% smaller dimension → vòng tròn LUÔN nằm gọn trong vùng ảnh.
 *   - `minZoom=1` cố định → user thấy nguyên ảnh khi mở, zoom in để chọn vùng nhỏ hơn.
 *
 * Trước (sai): container aspect-square ép mọi ảnh vào khung 1:1 → user nhìn
 * ảnh wide qua "lỗ vuông" + cropSize ≈ container → vòng tròn kéo vào letterbox.
 */
export function AvatarCropDialog({ src, onCancel, onCropped }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [imageAspect, setImageAspect] = useState<number | null>(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState({ w: 360, h: 480 })

  // Đo width khả dụng của dialog body + viewport height cap (responsive mobile).
  useEffect(() => {
    function update() {
      const w = contentRef.current?.clientWidth ?? 360
      const maxH = typeof window !== 'undefined' ? Math.min(window.innerHeight * 0.55, 480) : 360
      setAvailable({ w, h: maxH })
    }
    update()
    const ro = new ResizeObserver(update)
    if (contentRef.current) ro.observe(contentRef.current)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const onMediaLoaded = useCallback((mediaSize: { naturalWidth: number; naturalHeight: number }) => {
    const w = mediaSize.naturalWidth
    const h = mediaSize.naturalHeight
    if (!w || !h) return
    setImageAspect(w / h)
  }, [])

  // Tính kích thước container theo aspect ảnh + giới hạn viewport.
  // - Landscape (aspect ≥ 1): bắt đầu với full width → height = w/aspect.
  //   Nếu height > maxH → bound bằng maxH, width = maxH × aspect.
  // - Portrait (aspect < 1): bắt đầu với maxH → width = maxH × aspect.
  //   Nếu width > availW → bound bằng availW.
  let dispW = available.w
  let dispH = available.w
  if (imageAspect) {
    if (imageAspect >= 1) {
      dispW = available.w
      dispH = available.w / imageAspect
      if (dispH > available.h) {
        dispH = available.h
        dispW = available.h * imageAspect
      }
    } else {
      dispH = available.h
      dispW = available.h * imageAspect
      if (dispW > available.w) {
        dispW = available.w
        dispH = available.w / imageAspect
      }
    }
  }
  // cropSize phải <= minDim của container (nếu không circle tràn ra ngoài).
  // Standard: 78% minDim. Floor 80px cho touch target nhưng cap = 95% minDim
  // để extreme aspect (panorama 4:1, dải hẹp 1:4) vẫn fit.
  const minDim = Math.min(dispW, dispH)
  const cropSize = Math.max(
    Math.min(80, Math.round(minDim * 0.95)),
    Math.round(minDim * CIRCLE_RATIO),
  )

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
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[min(480px,calc(100vw-2rem))] max-h-[calc(100vh-3rem)] overflow-y-auto bg-[var(--surface)] rounded-card-xl shadow-glass ring-1 ring-foreground/10 p-5 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95 transition-all duration-200">
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
            Phóng to, thu nhỏ và kéo ảnh để đưa vùng muốn chọn vào khung tròn.
          </Dialog.Description>

          <div ref={contentRef} className="mb-3 w-full">
            {/* Container có width/height THẬT theo aspect ảnh → ảnh hiển thị
                ở tỷ lệ tự nhiên, không bị ép vuông. */}
            <div
              className="relative rounded-card overflow-hidden bg-ink/85 mx-auto"
              style={{ width: dispW, height: dispH }}
            >
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                aspect={1}
                cropShape="round"
                showGrid={false}
                cropSize={{ width: cropSize, height: cropSize }}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                onMediaLoaded={onMediaLoaded}
                objectFit="contain"
                restrictPosition={false}
              />
            </div>
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
              aria-label="Thu nhỏ"
              className="h-8 w-8 rounded-pill bg-foreground/5 grid place-items-center hover:bg-foreground/10 transition shrink-0"
            >
              <ZoomOut className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Mức phóng to"
              className="flex-1 accent-[var(--lqg-accent)]"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
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
