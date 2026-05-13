'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ShoppingCart, Plus, Minus, Package, Loader2, CheckCircle, Search, History } from 'lucide-react'
import Link from 'next/link'

type Product = {
  id: string; name: string; type: string; price: number
  stockQuantity: number | null; description: string | null; sessionsCount: number | null
  photos: string[]
}

const TYPE_LABELS: Record<string, string> = {
  course: '📚 Khoá học', improvement_pack: '🏊 Pack cải thiện',
  service: '⭐ Dịch vụ', physical: '📦 Vật phẩm'
}

const FILTER_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'course', label: 'Khoá học' },
  { value: 'improvement_pack', label: 'Pack' },
  { value: 'service', label: 'Dịch vụ' },
  { value: 'physical', label: 'Đồ' },
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
        })
      })
      const data = await res.json()
      if (!res.ok || data.error) { toast.error(data.error?.message ?? 'Lỗi'); return }
      setOrdered(true)
      setCart({})
      toast.success('Đặt hàng thành công! Chờ duyệt nhé 😊')
    } catch { toast.error('Không thể kết nối') }
    finally { setOrdering(false) }
  }

  if (ordered) {
    return (
      <div className="p-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="font-heading text-2xl text-[#1C2B4A] mb-2">Đặt hàng thành công!</h2>
        <p className="text-[#1C2B4A]/60 mb-4">Lớp sẽ duyệt đơn và liên hệ bạn sớm nhất nhé.</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => setOrdered(false)} className="bg-[#1C2B4A] text-[#F6F1EA]">Tiếp tục mua</Button>
          <Button asChild variant="outline">
            <Link href="/student/shop/orders">Xem đơn của tôi</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto pb-32">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-heading text-2xl text-[#1C2B4A]">Shop</h1>
        <Link
          href="/student/shop/orders"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1C2B4A]/70 hover:text-[#1C2B4A]"
        >
          <History className="w-3.5 h-3.5" /> Đơn của tôi
        </Link>
      </div>
      <p className="text-xs text-[#1C2B4A]/50 mb-4">Đặt hàng, trả sau khi nhận</p>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C2B4A]/40" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm sản phẩm..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-[#1C2B4A]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 bg-white"
        />
      </div>

      {/* Type tabs */}
      <div className="flex gap-1.5 overflow-x-auto mb-4 -mx-1 px-1 pb-1">
        {FILTER_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap border transition-colors ${
              typeFilter === t.value
                ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]'
                : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15 hover:border-[#1C2B4A]/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#1C2B4A]/40" /></div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-[#1C2B4A]/40">
          <Package className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p>{products.length === 0 ? 'Chưa có sản phẩm nào' : 'Không tìm thấy sản phẩm phù hợp'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map(p => {
            const qty = cart[p.id] ?? 0
            const isOutOfStock = p.type === 'physical' && p.stockQuantity !== null && p.stockQuantity <= 0
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-[#1C2B4A]/8 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2 gap-3">
                  {p.photos && p.photos.length > 0 && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.photos[0]} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-[#1C2B4A] text-sm">{p.name}</p>
                      <Badge variant="outline" className="text-xs">{TYPE_LABELS[p.type] ?? p.type}</Badge>
                    </div>
                    {p.description && <p className="text-xs text-[#1C2B4A]/50 line-clamp-2">{p.description}</p>}
                    {p.sessionsCount && <p className="text-xs text-[#5B8E9F] mt-1">{p.sessionsCount} buổi</p>}
                    {p.type === 'physical' && p.stockQuantity !== null && (
                      <p className={`text-xs mt-1 ${p.stockQuantity <= 3 ? 'text-amber-600' : 'text-[#1C2B4A]/40'}`}>
                        Còn {p.stockQuantity} sp
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#1C2B4A]">{fmt(p.price)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3">
                  {qty === 0 ? (
                    <button
                      onClick={() => !isOutOfStock && addToCart(p.id)}
                      disabled={isOutOfStock}
                      className={`w-full py-2 rounded-xl text-sm font-medium border transition-all ${
                        isOutOfStock
                          ? 'border-[#1C2B4A]/10 text-[#1C2B4A]/30 cursor-not-allowed'
                          : 'border-[#1C2B4A] text-[#1C2B4A] hover:bg-[#1C2B4A] hover:text-[#F6F1EA]'
                      }`}
                    >
                      {isOutOfStock ? 'Hết hàng' : '+ Thêm vào giỏ'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 w-full justify-between">
                      <button onClick={() => removeFromCart(p.id)} className="w-8 h-8 rounded-lg border border-[#1C2B4A]/15 flex items-center justify-center hover:bg-red-50">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-semibold text-[#1C2B4A] text-sm">{qty}</span>
                      <button onClick={() => addToCart(p.id)} className="w-8 h-8 rounded-lg border border-[#1C2B4A] bg-[#1C2B4A] flex items-center justify-center text-white">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Fixed cart bottom */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#1C2B4A]/10 p-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="w-4 h-4 text-[#1C2B4A]/60" />
            <span className="text-sm text-[#1C2B4A]/60">{cartItems.length} sản phẩm</span>
            <span className="ml-auto font-semibold text-[#1C2B4A]">{fmt(cartTotal)}</span>
          </div>
          <input
            placeholder="Ghi chú cho lớp (tuỳ chọn)"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full h-8 px-3 text-sm rounded-lg border border-[#1C2B4A]/15 mb-3 focus:outline-none"
          />
          <Button
            className="w-full bg-[#1C2B4A] text-[#F6F1EA] h-11"
            disabled={ordering}
            onClick={placeOrder}
          >
            {ordering ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang đặt...</> : `Đặt hàng · ${fmt(cartTotal)}`}
          </Button>
        </div>
      )}
    </div>
  )
}
