import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { VoucherForm } from '../../VoucherForm'

type Params = { params: Promise<{ id: string }> }

export default async function EditVoucherPage({ params }: Params) {
  await requireRole(['admin'])
  const { id } = await params
  const v = await prisma.voucher.findUnique({ where: { id } })
  if (!v) notFound()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/admin/vouchers" className="inline-flex items-center gap-1 text-sm text-[#1C2B4A]/70 hover:text-[#1C2B4A] mb-6">
        <ArrowLeft className="w-4 h-4" /> Danh sách
      </Link>
      <h1 className="font-heading text-3xl text-[#1C2B4A] mb-1">Sửa mã giảm giá</h1>
      <p className="text-sm text-[#1C2B4A]/50 mb-6">
        Code: <code className="font-mono font-bold">{v.code}</code> · Đã dùng {v.usedCount} lần
      </p>
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
  )
}
