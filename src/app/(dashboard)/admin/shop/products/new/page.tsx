import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProductForm } from '../ProductForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function NewProductPage() {
  await requireRole(['admin'])

  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, price: true },
    orderBy: { price: 'asc' }
  })

  return (
    <div className="ambient-bg min-h-screen">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/admin/shop/products"
          className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Danh sách sản phẩm
        </Link>
        <PageHeader
          eyebrow="Shop"
          title="Thêm sản phẩm mới"
          description="Form sẽ thay đổi theo loại sản phẩm bạn chọn — khoá, pack cải thiện, dịch vụ, hoặc đồ vật lý."
          display
          className="mb-8"
        />
        <ProductForm courses={courses} mode="create" />
      </div>
    </div>
  )
}
