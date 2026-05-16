'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import {
  ShoppingCart, Plus, Minus, Package, Loader2, CheckCircle, Search, History,
  BookOpen, Waves, Sparkles, Box, ArrowRight, X, ChevronLeft, ChevronRight,
  ChevronUp, Ticket,
} from 'lucide-react'
import Link from 'next/link'
import { Dialog } from '@base-ui/react/dialog'
import { Chip } from '@/components/ui/Chip'
import { CartDrawer, type CartDrawerItem } from '@/components/features/CartDrawer'

type Product = {
  id: string
  name: string
  type: string
  price: number
  stockQuantity: number | null
  description: string | null
  sessionsCount: number | null
  photos: string[]
  /** Số lượng đã bán (sum orderItem.quantity với order paid/fulfilled). */
  soldCount: number
}

const TYPE_META: Record<string, { label: string; Icon: typeof BookOpen }> = {
  course: { label: 'Khoá học', Icon: BookOpen },
  improvement_pack: { label: 'Pack cải thiện', Icon: Waves },
  service: { label: 'Dịch vụ', Icon: Sparkles },
  physical: { label: 'Vật phẩm', Icon: Box },
  pool_ticket: { label: 'Vé bơi', Icon: Ticket },
}

const FILTER_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'pool_ticket', label: 'Vé bơi' },
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
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)

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

  function removeAllFromCart(id: string) {
    setCart(prev => {
      const next = { ...prev }
      delete next[id]
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
      setCartDrawerOpen(false)
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

      <div className="px-4 sm:px-8 -mt-6 max-w-6xl mx-auto relative z-10 space-y-4">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map(p => {
              const qty = cart[p.id] ?? 0
              const isOutOfStock = p.type === 'physical' && p.stockQuantity !== null && p.stockQuantity <= 0
              const typeMeta = TYPE_META[p.type] ?? { label: p.type, Icon: Box }
              const TypeIcon = typeMeta.Icon
              return (
                <div
                  key={p.id}
                  className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/10 overflow-hidden shadow-soft hover:shadow-glass hover:-translate-y-0.5 transition flex flex-col"
                >
                  {/* Photo — click để xem chi tiết */}
                  <button
                    type="button"
                    onClick={() => setDetailProduct(p)}
                    aria-label={`Xem chi tiết ${p.name}`}
                    className="block aspect-square w-full bg-paper-tint overflow-hidden cursor-pointer relative group/photo"
                  >
                    {p.photos && p.photos.length > 0 ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover transition-transform duration-300 group-hover/photo:scale-105" />
                    ) : (
                      <div className="w-full h-full grid place-items-center">
                        <TypeIcon className="h-12 w-12 text-accent opacity-50" strokeWidth={1.5} />
                      </div>
                    )}
                    {/* Qty badge nếu trong giỏ — góc trên trái, prominent */}
                    {qty > 0 && (
                      <span className="absolute top-2 left-2 inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-pill bg-accent text-ink text-sm font-bold shadow-cta ring-2 ring-paper">
                        {qty}
                      </span>
                    )}
                    {/* Multi-photo badge */}
                    {p.photos && p.photos.length > 1 && (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-pill bg-ink/70 text-paper text-[10px] font-semibold backdrop-blur-sm">
                        +{p.photos.length - 1}
                      </span>
                    )}
                  </button>

                  {/* Info */}
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <Chip variant="mist" className="text-[10px]">
                        <TypeIcon className="h-2.5 w-2.5" strokeWidth={2.25} /> {typeMeta.label}
                      </Chip>
                      {p.soldCount > 0 && (
                        <span className="text-[10px] text-foreground/55">
                          · Đã bán {p.soldCount}
                        </span>
                      )}
                      {p.sessionsCount && (
                        <span className="text-[10px] text-foreground/55">· {p.sessionsCount} buổi</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailProduct(p)}
                      className="font-medium text-foreground text-sm leading-tight line-clamp-2 mb-1.5 text-left hover:text-accent transition-colors"
                    >
                      {p.name}
                    </button>
                    <div className="flex items-baseline justify-between gap-2 mb-2">
                      <p className="lqg-numeric-sans text-base text-accent font-bold">{fmt(p.price)}</p>
                      {p.type === 'physical' && p.stockQuantity !== null && (
                        <p className={`text-[10px] ${p.stockQuantity <= 3 ? 'text-warn font-semibold' : 'text-foreground/45'}`}>
                          Còn {p.stockQuantity}
                        </p>
                      )}
                    </div>

                    <div className="mt-auto">
                      <button
                        onClick={() => !isOutOfStock && addToCart(p.id)}
                        disabled={isOutOfStock}
                        className={`w-full h-9 rounded-pill text-xs font-semibold transition ${
                          isOutOfStock
                            ? 'bg-foreground/5 text-foreground/30 cursor-not-allowed'
                            : qty > 0
                              ? 'bg-success/15 text-success ring-1 ring-success/30 hover:bg-success/25'
                              : 'bg-ink text-paper hover:bg-foreground/90'
                        }`}
                      >
                        {isOutOfStock ? 'Hết hàng' : qty > 0 ? `Đã thêm (${qty}) · Thêm 1` : '+ Thêm vào giỏ'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Product detail modal */}
      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        qty={detailProduct ? cart[detailProduct.id] ?? 0 : 0}
        onAdd={addToCart}
        onRemove={removeFromCart}
      />

      {/* Fixed cart bar — đặt ngang hàng FAB+ (right padding chừa chỗ FAB).
       * Mobile: bottom = bottom-nav(64) + gap(20) = 5.25rem
       * Desktop: bottom = gap(20) = 1.25rem (không có bottom-nav)
       * Right padding: FAB right-offset(20) + FAB width(52) + gap(12) = 5.25rem
       * → khoảng cách cart-bar↔FAB+ = 12px = FAB+ ↔ FAB Bell vertical gap
       */}
      {cartItems.length > 0 && (
        <button
          type="button"
          data-shop-cart-bar
          onClick={() => setCartDrawerOpen(true)}
          className="fixed left-0 right-0 z-30 px-4 pr-[5.25rem] max-w-3xl mx-auto block
                     bottom-[calc(64px+1.25rem+env(safe-area-inset-bottom,0px))]
                     lg:bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))]"
        >
          <div className="rounded-card-xl bg-ink text-paper py-2.5 px-4 shadow-glass ring-1 ring-paper/12 flex items-center gap-3 hover:bg-foreground/95 transition cursor-pointer">
            <div className="grid place-items-center h-9 w-9 rounded-pill bg-accent/20 shrink-0">
              <ShoppingCart className="h-4 w-4 text-accent" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[10px] text-paper/65 leading-tight">{cartItems.length} sản phẩm · Bấm để xem giỏ</p>
              <p className="lqg-numeric-sans text-lg text-paper font-bold leading-none mt-0.5">{fmt(cartTotal)}</p>
            </div>
            <ChevronUp className="h-5 w-5 text-paper/65 shrink-0" strokeWidth={2.25} />
          </div>
        </button>
      )}

      {/* Cart drawer — bottom sheet quản lý qty + đặt hàng */}
      <CartDrawer
        open={cartDrawerOpen}
        onOpenChange={setCartDrawerOpen}
        items={cartItems.map<CartDrawerItem>(([id, qty]) => {
          const p = products.find(p => p.id === id)
          return {
            productId: id,
            name: p?.name ?? 'Sản phẩm',
            price: p?.price ?? 0,
            qty,
            photo: p?.photos?.[0] ?? null,
            isOutOfStock: p?.type === 'physical' && p?.stockQuantity !== null && (p?.stockQuantity ?? 0) <= 0,
          }
        })}
        total={cartTotal}
        note={note}
        onNoteChange={setNote}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onRemoveAll={removeAllFromCart}
        onCheckout={placeOrder}
        ordering={ordering}
      />
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// ProductDetailModal — Photo gallery + description + cart
// ───────────────────────────────────────────────────────────
function ProductDetailModal({
  product,
  onClose,
  qty,
  onAdd,
  onRemove,
}: {
  product: Product | null
  onClose: () => void
  qty: number
  onAdd: (id: string) => void
  onRemove: (id: string) => void
}) {
  const [photoIdx, setPhotoIdx] = useState(0)

  // Reset photo index khi đổi product
  useEffect(() => { setPhotoIdx(0) }, [product?.id])

  if (!product) return null

  const typeMeta = TYPE_META[product.type] ?? { label: product.type, Icon: Box }
  const TypeIcon = typeMeta.Icon
  const isOutOfStock = product.type === 'physical' && product.stockQuantity !== null && product.stockQuantity <= 0
  const photos = product.photos && product.photos.length > 0 ? product.photos : null

  function nextPhoto() {
    if (!photos) return
    setPhotoIdx(i => (i + 1) % photos.length)
  }
  function prevPhoto() {
    if (!photos) return
    setPhotoIdx(i => (i - 1 + photos.length) % photos.length)
  }

  return (
    <Dialog.Root open={!!product} onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-sm data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-200" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[min(720px,calc(100vw-1.5rem))] max-h-[calc(100vh-3rem)] overflow-y-auto bg-[var(--surface)] rounded-card-xl shadow-glass ring-1 ring-foreground/10 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95 transition-all duration-200">
          <div className="grid md:grid-cols-2">
            {/* Photo gallery */}
            <div className="relative bg-paper-tint">
              <div className="aspect-square w-full overflow-hidden">
                {photos ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photos[photoIdx]}
                    alt={`${product.name} - ảnh ${photoIdx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center">
                    <TypeIcon className="h-20 w-20 text-accent opacity-40" strokeWidth={1.25} />
                  </div>
                )}
              </div>
              {/* Photo nav */}
              {photos && photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevPhoto}
                    aria-label="Ảnh trước"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-pill bg-ink/60 text-paper grid place-items-center hover:bg-ink/80 backdrop-blur-sm transition"
                  >
                    <ChevronLeft className="h-5 w-5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={nextPhoto}
                    aria-label="Ảnh sau"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-pill bg-ink/60 text-paper grid place-items-center hover:bg-ink/80 backdrop-blur-sm transition"
                  >
                    <ChevronRight className="h-5 w-5" strokeWidth={2} />
                  </button>
                  {/* Dots indicator */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIdx(i)}
                        aria-label={`Đến ảnh ${i + 1}`}
                        className={`h-1.5 rounded-pill transition-all ${
                          i === photoIdx
                            ? 'w-6 bg-paper'
                            : 'w-1.5 bg-paper/50 hover:bg-paper/70'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              {/* Thumbnail strip (desktop) */}
              {photos && photos.length > 1 && (
                <div className="hidden md:flex gap-2 p-3 border-t border-foreground/8 overflow-x-auto">
                  {photos.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIdx(i)}
                      aria-label={`Ảnh ${i + 1}`}
                      className={`shrink-0 h-14 w-14 rounded-card overflow-hidden ring-2 transition ${
                        i === photoIdx ? 'ring-accent' : 'ring-transparent hover:ring-foreground/20'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info side */}
            <div className="p-5 sm:p-6 flex flex-col relative">
              <Dialog.Close
                aria-label="Đóng"
                className="absolute top-3 right-3 h-9 w-9 rounded-pill bg-foreground/5 hover:bg-foreground/10 grid place-items-center transition"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </Dialog.Close>

              <div className="flex items-center gap-2 mb-2 pr-10 flex-wrap">
                <Chip variant="mist" className="text-[10px]">
                  <TypeIcon className="h-2.5 w-2.5" strokeWidth={2.25} /> {typeMeta.label}
                </Chip>
                {product.sessionsCount && (
                  <Chip variant="accent" className="text-[10px]">
                    {product.sessionsCount} buổi
                  </Chip>
                )}
                {product.soldCount > 0 && (
                  <span className="text-xs text-foreground/55">
                    · Đã bán {product.soldCount}
                  </span>
                )}
              </div>

              <Dialog.Title className="lqg-headline text-2xl text-foreground leading-tight mb-2">
                {product.name}
              </Dialog.Title>

              <div className="flex items-baseline gap-2 mb-4">
                <p className="lqg-numeric-sans text-3xl text-accent font-bold">{fmt(product.price)}</p>
                {product.type === 'physical' && product.stockQuantity !== null && (
                  <span className={`text-xs ${product.stockQuantity <= 3 ? 'text-warn font-semibold' : 'text-foreground/55'}`}>
                    {product.stockQuantity <= 0 ? '· hết hàng' : `· còn ${product.stockQuantity}`}
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description ? (
                <Dialog.Description className="text-sm text-foreground/75 leading-relaxed mb-6 whitespace-pre-line">
                  {product.description}
                </Dialog.Description>
              ) : (
                <p className="text-sm text-foreground/40 italic mb-6">Chưa có mô tả chi tiết cho sản phẩm này.</p>
              )}

              {/* Add to cart actions */}
              <div className="mt-auto pt-4 border-t border-foreground/8">
                {qty === 0 ? (
                  <button
                    onClick={() => !isOutOfStock && onAdd(product.id)}
                    disabled={isOutOfStock}
                    className={`w-full h-12 rounded-pill text-sm font-semibold transition ${
                      isOutOfStock
                        ? 'bg-foreground/5 text-foreground/30 cursor-not-allowed'
                        : 'bg-accent text-ink hover:scale-[1.01] active:scale-[0.99] shadow-soft'
                    }`}
                  >
                    {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                  </button>
                ) : (
                  <div className="flex items-center justify-between bg-paper-tint rounded-pill p-2">
                    <button
                      onClick={() => onRemove(product.id)}
                      aria-label="Bớt 1"
                      className="h-9 w-9 rounded-pill bg-[var(--surface)] ring-1 ring-foreground/10 grid place-items-center hover:bg-danger/10 hover:ring-danger/30 transition"
                    >
                      <Minus className="h-4 w-4" strokeWidth={2.25} />
                    </button>
                    <span className="lqg-numeric-sans text-lg text-foreground font-bold">{qty}</span>
                    <button
                      onClick={() => onAdd(product.id)}
                      aria-label="Thêm 1"
                      className="h-9 w-9 rounded-pill bg-ink text-paper grid place-items-center hover:bg-foreground/90 transition"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
