import type { Area } from 'react-easy-crop'

const OUTPUT_MAX = 512 // px — resize down nếu source quá lớn, tiết kiệm storage

/**
 * Crop source image (data URL hoặc remote URL) → square Blob (JPEG 90%).
 *
 * `croppedAreaPixels` lấy từ react-easy-crop `onCropComplete` — toạ độ pixels
 * trên ảnh GỐC của vùng crop user đã chọn (square area, hiển thị tròn).
 */
export async function getCroppedBlob(src: string, area: Area): Promise<Blob> {
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')

  const targetSize = Math.min(Math.max(area.width, area.height), OUTPUT_MAX)
  canvas.width = targetSize
  canvas.height = targetSize
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')

  // Nền trắng cho vùng letterbox (nếu user pan crop ra ngoài ảnh)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, targetSize, targetSize)

  // Clamp source coords về [0, naturalDimension]
  const srcX = Math.max(0, area.x)
  const srcY = Math.max(0, area.y)
  const srcRight = Math.min(img.naturalWidth, area.x + area.width)
  const srcBottom = Math.min(img.naturalHeight, area.y + area.height)
  const srcW = srcRight - srcX
  const srcH = srcBottom - srcY

  const scaleX = targetSize / area.width
  const scaleY = targetSize / area.height
  const dstX = Math.round((srcX - area.x) * scaleX)
  const dstY = Math.round((srcY - area.y) * scaleY)
  const dstW = Math.round(srcW * scaleX)
  const dstH = Math.round(srcH * scaleY)

  ctx.drawImage(img, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/jpeg',
      0.9,
    )
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.crossOrigin = 'anonymous'
    img.src = src
  })
}
