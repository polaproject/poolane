import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Search, Package, AlertCircle } from 'lucide-react'
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from '@/lib/validations/product'
import { Chip } from '@/components/ui/Chip'

type SearchParams = Promise<{ search?: string; type?: string; isActive?: string; page?: string }>
function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['admin'])

  const params = await searchParams
  const page = Number(params.page ?? 1)
  const pageSize = 20
  const search = params.search ?? ''
  const typeFilter = params.type ?? ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (typeFilter) where.type = typeFilter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.product.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)
  const buildHref = (overrides: Record<string, string>) => {
    const next = { type: typeFilter, search, page: String(page), ...overrides }
    const qs = Object.entries(next).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
    return `/admin/shop/products${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-mist/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-7xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2">{total} sản phẩm</p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Sản phẩm Shop</h1>
          </div>
          <Link
            href="/admin/shop/products/new"
            className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2.5 rounded-pill text-sm hover:bg-accent/90 transition shadow-cta"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Thêm sản phẩm
          </Link>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-7xl mx-auto space-y-4 relative z-10">
        <div className="glass-card glass-card-hover p-4 space-y-3">
          <form className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" strokeWidth={1.75} />
              <input
                name="search"
                defaultValue={search}
                placeholder="Tìm tên hoặc SKU..."
                className="w-full pl-10 pr-4 h-10 text-sm rounded-pill bg-paper-tint/40 ring-1 ring-foreground/10 focus:ring-accent/40 focus:outline-none transition"
              />
            </div>
            <button type="submit" className="px-5 h-10 text-sm bg-ink text-paper rounded-pill hover:bg-foreground/90 transition font-medium">
              Tìm
            </button>
          </form>
          <div className="flex gap-2 flex-wrap">
            <Link href={buildHref({ type: '', page: '1' })}>
              <Chip asButton active={!typeFilter}>Tất cả loại</Chip>
            </Link>
            {PRODUCT_TYPES.map(t => (
              <Link key={t} href={buildHref({ type: t, page: '1' })}>
                <Chip asButton active={typeFilter === t}>{PRODUCT_TYPE_LABELS[t]}</Chip>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass-card glass-card-hover overflow-hidden">
          {products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
              <p className="lqg-headline text-2xl text-foreground mb-1">
                {search || typeFilter ? 'Không khớp tìm kiếm' : 'Chưa có sản phẩm'}
              </p>
              <p className="text-sm text-foreground/55">
                {search || typeFilter ? 'Thử filter khác' : 'Bấm "Thêm sản phẩm" để bắt đầu'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-paper-tint/30 border-b border-foreground/8">
                  <tr>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Sản phẩm</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Loại</th>
                    <th className="text-right px-5 py-3 eyebrow text-foreground/55">Giá</th>
                    <th className="text-right px-5 py-3 eyebrow text-foreground/55">Tồn kho</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const isLowStock = p.type === 'physical' && p.stockQuantity !== null &&
                      p.lowStockThreshold !== null && p.stockQuantity <= (p.lowStockThreshold ?? 3)
                    return (
                      <tr key={p.id} className="border-b border-foreground/5 last:border-b-0 hover:bg-paper-tint/20 transition group glass-table-row">
                        <td className="px-5 py-3">
                          <Link href={`/admin/shop/products/${p.id}`} className="flex items-center gap-3">
                            {Array.isArray(p.photos) && p.photos.length > 0 ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={(p.photos as string[])[0]} alt={p.name} className="w-10 h-10 rounded-card object-cover shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-card bg-paper-tint grid place-items-center shrink-0">
                                <Package className="h-4 w-4 text-foreground/30" strokeWidth={1.75} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-foreground group-hover:text-accent transition truncate">{p.name}</p>
                              <p className="text-xs text-foreground/45 font-mono mt-0.5">{p.sku}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-5 py-3"><Chip variant="mist">{PRODUCT_TYPE_LABELS[p.type]}</Chip></td>
                        <td className="px-5 py-3 text-right text-sm font-medium text-foreground">{fmt(p.price)}</td>
                        <td className="px-5 py-3 text-right text-sm">
                          {p.type === 'physical' ? (
                            <span className={`inline-flex items-center gap-1 ${isLowStock ? 'text-danger font-semibold' : 'text-foreground/65'}`}>
                              {isLowStock && <AlertCircle className="h-3 w-3" strokeWidth={2.25} />}
                              {p.stockQuantity ?? 0}
                            </span>
                          ) : (
                            <span className="text-foreground/30">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <Chip variant={p.isActive ? 'success' : 'neutral'} active>
                            {p.isActive ? 'Đang bán' : 'Ngừng bán'}
                          </Chip>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-1.5 pt-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link
                key={p}
                href={buildHref({ page: String(p) })}
                className={`grid place-items-center h-9 w-9 rounded-pill text-sm font-medium transition ${
                  p === page ? 'bg-ink text-paper' : 'ring-1 ring-foreground/10 text-foreground/65 hover:ring-foreground/20 hover:bg-foreground/5'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
