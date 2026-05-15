'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import {
  ShoppingCart, Plus, Minus, Package, Loader2, CheckCircle, Search, History,
  BookOpen, Waves, Sparkles, Box, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { Chip } from '@/components/ui/Chip'

type Product = {
  id: string
  name: string
  type: string
  price: number
  stockQuantity: number | null
  description: string | null
  sessionsCount: number | null
  photos: string[]
}

const TYPE_META: Record<string, { label: string; Icon: typeof BookOpen }> = {
  course: { label: 'Khoá học', Icon: BookOpen },
  improvement_pack: { label: 'Pack cải thiện', Icon: Waves },
  service: { label: 'Dịch vụ', Icon: Sparkles },
  physical: { label: 'Vật phẩm', Icon: Box },
}

const FILTER_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'course', label: 'Khoá học' },
  { value: 'improvement_pack', label: 'Pack' },
  { value: 'service', label: 'Dịch vụ' },
  { value: 'physical', label: 'Vật phẩm' },
]

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [ordering, setOrdering] = useState(false)
  const [note, setNote] = useState('')
  const [ordered, setOrdered] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/shop/products?isActive=true&pageSize=100')
      .then(r => r.json())
      .then(d => { if (d.data?.items) setProducts(d.data.items) })
      .catch(() => toast.error('Không thể tải sản phẩm'))
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (typeFilter && p.type !== typeFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const hay = `${p.name} ${p.description ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [products, typeFilter, search])

  function addToCart(id: string) {
    setCart(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
  }
  function removeFromCart(id: string) {
    setCart(prev => {
      const next = { ...prev }
      if ((next[id] ?? 0) <= 1) delete next[id]
      else next[id]--
      return next
    })
  }

  const cartItems = Object.entries(cart).filter(([, qty]) => qty > 0)
  const cartTotal = cartItems.reduce((sum, [id, qty]) => {
    const p = products.find(p => p.id === id)
    return sum + (p?.price ?? 0) * qty
  }, 0)

  async function placeOrder() {
    if (cartItems.length === 0) return
    setOrdering(true)
    try {
      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map(([productId, quantity]) => ({ productId, quantity })),
          noteFromStudent: note || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { toast.error(data.error?.message ?? 'Lỗi'); return }
      setOrdered(true)
      setCart({})
      toast.success('Đặt hàng thành công! Chờ duyệt nhé')
    } catch {
      toast.error('Không thể kết nối')
    } finally {
      setOrdering(false)
    }
  }

  if (ordered) {
    return (
      <div className="min-h-screen bg-paper grid place-items-center px-4">
        <div className="rounded-card-xl bg-[var(--surface)] shadow-glass ring-1 ring-foreground/8 p-8 sm:p-12 text-center max-w-md">
          <div className="grid place-items-center h-16 w-16 rounded-pill bg-success/15 mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-success" strokeWidth={1.75} />
          </div>
          <h2 className="lqg-headline text-3xl text-foreground mb-2">Đặt hàng thành công!</h2>
          <p className="text-sm text-foreground/65 mb-6">Lớp sẽ duyệt đơn và liên hệ bạn sớm nhất.</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={() => setOrdered(false)}
              className="inline-flex items-center gap-1.5 bg-ink text-paper font-semibold px-5 py-2.5 rounded-pill text-sm hover:bg-foreground/90 transition"
            >
              Tiếp tục mua
            </button>
            <Link
              href="/student/shop/orders"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-pill ring-1 ring-foreground/15 text-sm font-medium hover:bg-foreground/5 transition"
            >
              Xem đơn của tôi <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper pb-32">
      {/* Hero */}
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-3xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2">Cửa hàng · Poolane</p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Shop</h1>
            <p className="text-sm text-paper/65 mt-2">Khoá học, pack cải thiện, dịch vụ và vật phẩm bơi.</p>
          </div>
          <Link
            href="/student/shop/orders"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-pill ring-1 ring-paper/20 hover:bg-paper/5 transition text-sm"
          >
            <History className="h-4 w-4" strokeWidth={1.75} /> Đơn của tôi
          </Link>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-3xl mx-auto relative z-10 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" strokeWidth={1.75} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="w-full pl-10 pr-4 py-3 text-sm rounded-pill bg-[var(--surface)] ring-1 ring-foreground/10 focus:ring-accent/40 focus:outline-none transition shadow-soft"
          />
        </div>

        {/* Type tabs */}
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          {FILTER_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className="shrink-0"
            >
              <Chip active={typeFilter === t.value}>{t.label}</Chip>
            </button>
          ))}
        </div>

        {/* Products */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={1.75} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <Package className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">
              {products.length === 0 ? 'Chưa có sản phẩm' : 'Không khớp tìm kiếm'}
            </p>
            <p className="text-sm text-foreground/55">
              {products.length === 0 ? 'Cửa hàng đang cập nhật' : 'Thử từ khoá khác hoặc bỏ filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map(p => {
              const qty = cart[p.id] ?? 0
              const isOutOfStock = p.type === 'physical' && p.stockQuantity !== null && p.stockQuantity <= 0
              const typeMeta = TYPE_META[p.type] ?? { label: p.type, Icon: Box }
              const TypeIcon = typeMeta.Icon
              return (
                <div key={p.id} className="glass-card glass-card-hover p-4 transition hover:ring-accent/30">
                  <div className="flex gap-3">
                    {p.photos && p.photos.length > 0 ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.photos[0]} alt={p.name} className="w-20 h-20 rounded-card object-cover shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-card bg-paper-tint grid place-items-center shrink-0">
                        <TypeIcon className="h-7 w-7 text-accent opacity-70" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-foreground text-sm leading-tight">{p.name}</p>
                        <p className="font-heading text-base text-foreground shrink-0">{fmt(p.price)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Chip variant="mist" className="text-[10px]">
                          <TypeIcon className="h-2.5 w-2.5" strokeWidth={2.25} /> {typeMeta.label}
                        </Chip>
                        {p.sessionsCount && (
                          <span className="text-[10px] text-foreground/55">· {p.sessionsCount} buổi</span>
                        )}
                      </div>
                      {p.description && (
                        <p className="text-xs text-foreground/55 line-clamp-2 leading-relaxed">{p.description}</p>
                      )}
                      {p.type === 'physical' && p.stockQuantity !== null && (
                        <p className={`text-[10px] mt-1 ${p.stockQuantity <= 3 ? 'text-warn' : 'text-foreground/45'}`}>
                          Còn {p.stockQuantity} sp
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    {qty === 0 ? (
                      <button
                        onClick={() => !isOutOfStock && addToCart(p.id)}
                        disabled={isOutOfStock}
                        className={`w-full py-2.5 rounded-pill text-sm font-medium ring-1 transition ${
                          isOutOfStock
                            ? 'ring-foreground/8 text-foreground/30 cursor-not-allowed'
                            : 'ring-foreground/20 text-foreground hover:bg-ink hover:text-paper hover:ring-ink'
                        }`}
                      >
                        {isOutOfStock ? 'Hết hàng' : '+ Thêm vào giỏ'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 justify-between bg-paper-tint rounded-pill px-2 py-1.5">
                        <button
                          onClick={() => removeFromCart(p.id)}
                          className="h-8 w-8 rounded-pill bg-[var(--surface)] ring-1 ring-foreground/10 grid place-items-center hover:bg-danger/10 hover:ring-danger/30 transition"
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={2.25} />
                        </button>
                        <span className="font-heading text-lg text-foreground">{qty}</span>
                        <button
                          onClick={() => addToCart(p.id)}
                          className="h-8 w-8 rounded-pill bg-ink text-paper grid place-items-center hover:bg-foreground/90 transition"
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Fixed cart bottom */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 p-4 max-w-3xl mx-auto">
          <div className="rounded-card-xl bg-ink text-paper p-4 shadow-glass ring-1 ring-paper/12">
            <div className="flex items-center gap-3 mb-3">
              <div className="grid place-items-center h-9 w-9 rounded-pill bg-accent/15">
                <ShoppingCart className="h-4 w-4 text-accent" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-paper/55">{cartItems.length} sản phẩm trong giỏ</p>
                <p className="lqg-headline text-xl text-accent leading-none mt-0.5">{fmt(cartTotal)}</p>
              </div>
            </div>
            <input
              placeholder="Ghi chú cho lớp (tuỳ chọn)"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-pill bg-paper/10 ring-1 ring-paper/15 placeholder:text-paper/40 text-paper mb-3 focus:outline-none focus:ring-accent/40 transition"
            />
            <button
              className="w-full bg-accent text-ink font-semibold h-11 rounded-pill hover:bg-accent/90 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
              disabled={ordering}
              onClick={placeOrder}
            >
              {ordering ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Đang đặt...</>
              ) : (
                <>Đặt hàng · {fmt(cartTotal)}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
