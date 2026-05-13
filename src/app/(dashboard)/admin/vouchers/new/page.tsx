import { requireRole } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { VoucherForm } from '../VoucherForm'

export default async function NewVoucherPage() {
  await requireRole(['admin'])
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/admin/vouchers" className="inline-flex items-center gap-1 text-sm text-[#1C2B4A]/70 hover:text-[#1C2B4A] mb-6">
        <ArrowLeft className="w-4 h-4" /> Danh sách
      </Link>
      <h1 className="font-heading text-3xl text-[#1C2B4A] mb-6">Tạo mã giảm giá</h1>
      <VoucherForm mode="create" />
    </div>
  )
}
