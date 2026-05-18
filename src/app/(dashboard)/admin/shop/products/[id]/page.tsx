import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProductForm } from '../ProductForm'
import { PRODUCT_TYPE_LABELS } from '@/lib/validations/product'
import { DeactivateButton } from './DeactivateButton'
import { PageHeader } from '@/components/ui/PageHeader'

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
    <div className="ambient-bg min-h-screen">
      <div className="p-5 sm:p-6 max-w-3xl mx-auto">
        <Link
          href="/admin/shop/products"
          className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Danh sách sản phẩm
        </Link>

        <PageHeader
          eyebrow={PRODUCT_TYPE_LABELS[product.type]}
          title={product.name}
          description={<>SKU: <code className="bg-ink/8 px-1.5 py-0.5 rounded font-mono">{product.sku}</code></>}
          actions={product.isActive ? <DeactivateButton id={product.id} /> : null}
          display
          className="mb-8"
        />

      {product.orderItems.length > 0 && (
        <div className="mb-4 px-4 py-3 bg-mist/15 border border-mist/30 rounded-card text-sm text-foreground/80">
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
          photos: Array.isArray(product.photos) ? (product.photos as string[]) : [],
        }}
      />
      </div>
    </div>
  )
}
