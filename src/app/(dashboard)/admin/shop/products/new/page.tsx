import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProductForm } from '../ProductForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewProductPage() {
  await requireRole(['admin'])

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
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Thêm sản phẩm mới</h1>
        <p className="text-sm text-[#1C2B4A]/50 mt-1">
          Form sẽ thay đổi theo loại sản phẩm bạn chọn
        </p>
      </div>
      <ProductForm courses={courses} mode="create" />
    </div>
  )
}
