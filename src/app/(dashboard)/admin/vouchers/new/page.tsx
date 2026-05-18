import { requireRole } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { VoucherForm } from '../VoucherForm'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function NewVoucherPage() {
  await requireRole(['admin'])
  return (
    <div className="ambient-bg min-h-screen">
      <div className="p-5 sm:p-6 max-w-2xl mx-auto">
        <Link href="/admin/vouchers" className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Danh sách
        </Link>
        <PageHeader
          eyebrow="Voucher"
          title="Tạo mã giảm giá"
          description="Giảm % học phí, số tiền cố định, hoặc tặng buổi vé bơi miễn phí."
          display
          className="mb-8"
        />
        <VoucherForm mode="create" />
      </div>
    </div>
  )
}
