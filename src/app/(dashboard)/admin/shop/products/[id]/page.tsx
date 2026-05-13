import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProductForm } from '../ProductForm'
import { PRODUCT_TYPE_LABELS } from '@/lib/validations/product'
import { DeactivateButton } from './DeactivateButton'

type Params = { params: Promise<{ id: string }> }

export default async function ProductDetailPage({ params }: Params) {
  await requireRole(['admin'])
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      orderItems: {
        select: { id: true, quantity: true, order: { select: { id: true, status: true, createdAt: true } } },
        take: 10,
        orderBy: { order: { createdAt: 'desc' } },
      }
    }
  })

  if (!product) notFound()

  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, price: true },
    orderBy: { price: 'asc' }
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/shop/products"
          className="inline-flex items-center gap-1 text-sm text-[#1C2B4A]/70 hover:text-[#1C2B4A]"
        >
          <ArrowLeft className="w-4 h-4" /> Danh sách sản phẩm
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl text-[#1C2B4A]">{product.name}</h1>
          <p className="text-sm text-[#1C2B4A]/50 mt-1">
            {PRODUCT_TYPE_LABELS[product.type]} · SKU: <code className="bg-[#1C2B4A]/8 px-1.5 py-0.5 rounded">{product.sku}</code>
          </p>
        </div>
        {product.isActive && <DeactivateButton id={product.id} />}
      </div>

      {product.orderItems.length > 0 && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900">
          Sản phẩm đã có {product.orderItems.length} lần được đặt mua — không nên đổi SKU
        </div>
      )}

      <ProductForm
        courses={courses}
        mode="edit"
        initial={{
          id: product.id,
          name: product.name,
          sku: product.sku,
          type: product.type,
          price: String(product.price),
          cost: product.cost != null ? String(product.cost) : '',
          description: product.description ?? '',
          linkedCourseId: product.linkedCourseId ?? '',
          sessionsCount: product.sessionsCount != null ? String(product.sessionsCount) : '',
          stockQuantity: product.stockQuantity != null ? String(product.stockQuantity) : '',
          lowStockThreshold: product.lowStockThreshold != null ? String(product.lowStockThreshold) : '3',
          isActive: product.isActive,
        }}
      />
    </div>
  )
}
