'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowUp, ArrowDown, Loader2, BookOpen, Waves, Sparkles, Box,
  EyeOff, AlertCircle,
} from 'lucide-react'
import { Chip } from '@/components/ui/Chip'

export interface ProductPreview {
  id: string
  name: string
  type: string
  price: number
  stockQuantity: number | null
  sessionsCount: number | null
  photos: string[]
  description: string | null
  isActive: boolean
  displayOrder: number
}

const TYPE_META: Record<string, { label: string; Icon: typeof BookOpen }> = {
  course: { label: 'Khoá học', Icon: BookOpen },
  improvement_pack: { label: 'Pack cải thiện', Icon: Waves },
  service: { label: 'Dịch vụ', Icon: Sparkles },
  physical: { label: 'Vật phẩm', Icon: Box },
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

/**
 * Grid 2/3/4 cột (mobile/tablet/desktop), Shopee-style.
 * Mỗi card có 2 nút ↑ ↓ ở góc trên phải để admin reorder.
 * Sau khi swap, optimistic update + router.refresh() cho SSR.
 */
export function ShopPreviewGrid({ initial }: { initial: ProductPreview[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function move(productId: string, direction: 'up' | 'down') {
    setBusyId(productId)
    // Optimistic swap
    const idx = items.findIndex(p => p.id === productId)
    const neighborIdx = direction === 'up' ? idx - 1 : idx + 1
    if (neighborIdx < 0 || neighborIdx >= items.length) {
      setBusyId(null)
      return
    }
    const next = [...items]
    ;[next[idx], next[neighborIdx]] = [next[neighborIdx], next[idx]]
    setItems(next)

    try {
      const res = await fetch('/api/shop/products/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, direction }),
      })
      const json = await res.json()
      if (!res.ok || !json.data?.swapped) {
        // Rollback
        setItems(initial)
        toast.error('Không thể sắp xếp')
        return
      }
      router.refresh()
    } catch {
      setItems(initial)
      toast.error('Không thể kết nối')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((p, idx) => {
        const isFirst = idx === 0
        const isLast = idx === items.length - 1
        const isBusy = busyId === p.id
        const isOutOfStock = p.type === 'physical' && p.stockQuantity !== null && p.stockQuantity <= 0
        const meta = TYPE_META[p.type] ?? { label: p.type, Icon: Box }
        const TypeIcon = meta.Icon
        return (
          <div
            key={p.id}
            className={`relative rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/10 overflow-hidden transition shadow-soft hover:shadow-glass hover:-translate-y-0.5 ${
              !p.isActive ? 'opacity-55' : ''
            }`}
          >
            {/* Reorder buttons — góc trên trái */}
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => move(p.id, 'up')}
                disabled={isBusy || isFirst}
                aria-label="Lên trên"
                title="Đưa lên trên"
                className="grid place-items-center h-6 w-6 rounded-full bg-ink/70 text-paper backdrop-blur-sm hover:bg-ink disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowUp className="h-3 w-3" strokeWidth={2.5} />}
              </button>
              <button
                type="button"
                onClick={() => move(p.id, 'down')}
                disabled={isBusy || isLast}
                aria-label="Xuống dưới"
                title="Đưa xuống dưới"
                className="grid place-items-center h-6 w-6 rounded-full bg-ink/70 text-paper backdrop-blur-sm hover:bg-ink disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ArrowDown className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </div>

            {/* Position badge — góc trên phải */}
            <span className="absolute top-2 right-2 z-10 bg-accent text-ink text-[10px] font-bold px-2 py-0.5 rounded-pill shadow-soft">
              #{idx + 1}
            </span>

            {/* Inactive overlay */}
            {!p.isActive && (
              <div className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 bg-foreground/80 text-paper text-[10px] font-bold px-2 py-0.5 rounded-pill">
                <EyeOff className="h-2.5 w-2.5" strokeWidth={2.5} /> ĐÃ TẮT
              </div>
            )}

            {/* Photo */}
            <div className="aspect-square w-full bg-paper-tint overflow-hidden">
              {p.photos && p.photos.length > 0 ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center">
                  <TypeIcon className="h-12 w-12 text-accent opacity-50" strokeWidth={1.5} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Chip variant="mist" className="text-[10px]">
                  <TypeIcon className="h-2.5 w-2.5" strokeWidth={2.25} /> {meta.label}
                </Chip>
                {p.sessionsCount && (
                  <span className="text-[10px] text-foreground/55">· {p.sessionsCount} buổi</span>
                )}
              </div>
              <p className="font-medium text-foreground text-sm leading-tight line-clamp-2 mb-1.5">
                {p.name}
              </p>
              <div className="flex items-baseline justify-between gap-2">
                <p className="lqg-numeric-sans text-base text-accent font-bold">{fmt(p.price)}</p>
                {p.type === 'physical' && p.stockQuantity !== null && (
                  <p className={`text-[10px] ${p.stockQuantity <= 3 ? 'text-warn font-semibold' : 'text-foreground/45'}`}>
                    Còn {p.stockQuantity}
                  </p>
                )}
              </div>
              {isOutOfStock && (
                <p className="text-[10px] text-danger font-semibold inline-flex items-center gap-1 mt-1">
                  <AlertCircle className="h-2.5 w-2.5" strokeWidth={2.5} /> Hết hàng
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
