import type { Area } from 'react-easy-crop'

const OUTPUT_MAX = 512 // px — resize down nếu source quá lớn, tiết kiệm storage

/**
 * Crop source image (data URL hoặc remote URL) → square Blob (JPEG 90%).
 *
 * `croppedAreaPixels` lấy từ react-easy-crop `onCropComplete` — toạ độ pixels
 * trên ảnh GỐC (không phải canvas hiển thị) của vùng vuông user đã chọn.
 * Avatar hiển thị tròn trên UI nhưng output canvas vẫn square (CSS rounded
 * trên client).
 */
export async function getCroppedBlob(src: string, area: Area): Promise<Blob> {
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')

  const targetSize = Math.min(area.width, area.height, OUTPUT_MAX)
  canvas.width = targetSize
  canvas.height = targetSize
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')

  ctx.drawImage(
    img,
    area.x, area.y, area.width, area.height,
    0, 0, targetSize, targetSize,
  )

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
