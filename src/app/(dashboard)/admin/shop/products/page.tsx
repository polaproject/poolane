import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS } from '@/lib/validations/product'

type SearchParams = Promise<{ search?: string; type?: string; isActive?: string; page?: string }>

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['admin'])

  const params = await searchParams
  const page = Number(params.page ?? 1)
  const pageSize = 20
  const search = params.search ?? ''
  const typeFilter = params.type ?? ''
  const isActiveFilter = params.isActive ?? ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (typeFilter) where.type = typeFilter
  if (isActiveFilter) where.isActive = isActiveFilter === 'true'
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where })
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl text-[#1C2B4A]">Sản phẩm Shop</h1>
          <p className="text-sm text-[#1C2B4A]/50 mt-1">{total} sản phẩm</p>
        </div>
        <Button asChild className="bg-[#1C2B4A] text-[#F6F1EA] hover:bg-[#1C2B4A]/90">
          <Link href="/admin/shop/products/new">
            <Plus className="w-4 h-4 mr-2" /> Thêm sản phẩm
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <form className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C2B4A]/40" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Tìm tên hoặc SKU..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#1C2B4A]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 bg-white"
            />
          </div>
          <button type="submit" className="px-4 py-2 text-sm bg-[#1C2B4A] text-[#F6F1EA] rounded-lg hover:bg-[#1C2B4A]/90">
            Tìm
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/shop/products"
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              !typeFilter
                ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]'
                : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15 hover:border-[#1C2B4A]/40'
            }`}
          >
            Tất cả loại
          </Link>
          {PRODUCT_TYPES.map(t => (
            <Link
              key={t}
              href={`/admin/shop/products?type=${t}${search ? `&search=${search}` : ''}`}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                typeFilter === t
                  ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]'
                  : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15 hover:border-[#1C2B4A]/40'
              }`}
            >
              {PRODUCT_TYPE_LABELS[t]}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-[#F6F1EA]/40">
            <tr className="text-left text-xs uppercase tracking-wider text-[#1C2B4A]/50">
              <th className="px-5 py-3">Sản phẩm</th>
              <th className="px-5 py-3">Loại</th>
              <th className="px-5 py-3 text-right">Giá</th>
              <th className="px-5 py-3 text-right">Tồn kho</th>
              <th className="px-5 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2B4A]/5">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-[#1C2B4A]/35 text-sm">
                  {search || typeFilter ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào — bấm "Thêm sản phẩm" để bắt đầu'}
                </td>
              </tr>
            ) : (
              products.map(p => {
                const isLowStock = p.type === 'physical' && p.stockQuantity !== null &&
                  p.lowStockThreshold !== null && p.stockQuantity <= (p.lowStockThreshold ?? 3)
                return (
                  <tr key={p.id} className="hover:bg-[#F6F1EA]/20">
                    <td className="px-5 py-3">
                      <Link href={`/admin/shop/products/${p.id}`} className="flex items-center gap-3 group">
                        {Array.isArray(p.photos) && p.photos.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={(p.photos as string[])[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#F6F1EA] flex items-center justify-center text-[#1C2B4A]/20 text-xs flex-shrink-0">—</div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-[#1C2B4A] group-hover:underline truncate">{p.name}</p>
                          <p className="text-xs text-[#1C2B4A]/40 mt-0.5">{p.sku}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-[#1C2B4A]/8 text-[#1C2B4A]/70">
                        {PRODUCT_TYPE_LABELS[p.type]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-[#1C2B4A]">
                      {fmt(p.price)}
                    </td>
                    <td className="px-5 py-3 text-right text-sm">
                      {p.type === 'physical' ? (
                        <span className={isLowStock ? 'text-red-500 font-semibold' : 'text-[#1C2B4A]/65'}>
                          {p.stockQuantity ?? 0} {isLowStock && '⚠️'}
                        </span>
                      ) : (
                        <span className="text-[#1C2B4A]/30">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {p.isActive ? (
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700 border border-green-200">
                          Đang bán
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                          Ngừng bán
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Link
              key={p}
              href={`/admin/shop/products?page=${p}${typeFilter ? `&type=${typeFilter}` : ''}${search ? `&search=${search}` : ''}`}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
                p === page
                  ? 'bg-[#1C2B4A] text-[#F6F1EA]'
                  : 'bg-white border border-[#1C2B4A]/15 text-[#1C2B4A]/60 hover:border-[#1C2B4A]/40'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
