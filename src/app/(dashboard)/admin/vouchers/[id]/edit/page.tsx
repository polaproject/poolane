import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { VoucherForm } from '../../VoucherForm'
import { PageHeader } from '@/components/ui/PageHeader'

type Params = { params: Promise<{ id: string }> }

export default async function EditVoucherPage({ params }: Params) {
  await requireRole(['admin'])
  const { id } = await params
  const v = await prisma.voucher.findUnique({ where: { id } })
  if (!v) notFound()

  return (
    <div className="ambient-bg min-h-screen">
      <div className="p-4 pr-[5rem] sm:p-6 sm:pr-6 max-w-2xl mx-auto">
        <Link href="/admin/vouchers" className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Danh sách
        </Link>
        <PageHeader
          eyebrow="Voucher"
          title="Sửa mã giảm giá"
          description={<>Code: <code className="font-mono font-bold">{v.code}</code> · đã dùng {v.usedCount} lần</>}
          display
          className="mb-8"
        />
        <VoucherForm mode="edit" initial={{
          id: v.id,
          code: v.code,
          description: v.description ?? '',
          discountType: v.discountType,
          discountValue: String(v.discountValue),
          appliesTo: v.appliesTo,
          maxUses: v.maxUses != null ? String(v.maxUses) : '',
          validFrom: v.validFrom ? v.validFrom.toISOString().slice(0, 10) : '',
          validUntil: v.validUntil ? v.validUntil.toISOString().slice(0, 10) : '',
          isActive: v.isActive,
        }} />
      </div>
    </div>
  )
}
