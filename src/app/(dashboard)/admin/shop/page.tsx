import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Store, Plus, Settings2, Eye } from 'lucide-react'
import { ShopPreviewGrid, type ProductPreview } from './ShopPreviewGrid'

export default async function AdminShopPage() {
  await requireRole(['admin'])

  const products = await prisma.product.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, name: true, type: true, price: true,
      stockQuantity: true, sessionsCount: true, photos: true,
      description: true, isActive: true, displayOrder: true,
    },
  })
  const previews: ProductPreview[] = products.map(p => ({
    id: p.id,
    name: p.name,
    type: p.type,
    price: p.price,
    stockQuantity: p.stockQuantity,
    sessionsCount: p.sessionsCount,
    photos: Array.isArray(p.photos) ? (p.photos as string[]) : [],
    description: p.description,
    isActive: p.isActive,
    displayOrder: p.displayOrder,
  }))

  const activeCount = previews.filter(p => p.isActive).length

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block pt-8 pb-12 relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
              <Eye className="h-3 w-3 text-accent" strokeWidth={1.75} />
              Preview · {activeCount} đang bán
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Cửa hàng</h1>
            <p className="text-paper/65 text-sm mt-2 max-w-xl">
              Xem cửa hàng đúng như HV sẽ thấy. Bấm ↑↓ trên mỗi sản phẩm để sắp xếp vị trí hiển thị.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/admin/shop/products"
              className="inline-flex items-center gap-1.5 glass-pill px-4 py-2 text-sm font-medium hover:bg-paper/10 transition"
            >
              <Settings2 className="h-4 w-4" strokeWidth={2.25} /> Quản lý sản phẩm
            </Link>
            <Link
              href="/admin/shop/products/new"
              className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2 rounded-pill text-sm hover:bg-accent/90 transition shadow-cta"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Thêm sản phẩm
            </Link>
          </div>
        </div>
      </div>

      <div className="-mt-6 max-w-6xl mx-auto relative z-10">
        {previews.length === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] ring-1 ring-foreground/10 p-12 text-center">
            <Store className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">Chưa có sản phẩm</p>
            <p className="text-sm text-foreground/55 mb-4">Tạo sản phẩm đầu tiên để hiển thị trong cửa hàng.</p>
            <Link
              href="/admin/shop/products/new"
              className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2 rounded-pill text-sm shadow-cta"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Thêm sản phẩm
            </Link>
          </div>
        ) : (
          <ShopPreviewGrid initial={previews} />
        )}
      </div>
    </div>
  )
}
