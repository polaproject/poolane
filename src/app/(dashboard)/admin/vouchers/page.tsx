import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Tag } from 'lucide-react'
import { format, isFuture, isPast } from 'date-fns'
import { EmptyState } from '@/components/ui/EmptyState'

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function VouchersPage() {
  await requireRole(['admin'])
  const vouchers = await prisma.voucher.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { usages: true } } }
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl text-[#1C2B4A]">Mã giảm giá</h1>
          <p className="text-sm text-[#1C2B4A]/50 mt-1">{vouchers.length} voucher</p>
        </div>
        <Link href="/admin/vouchers/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg text-sm font-semibold hover:bg-[#1C2B4A]/90">
          <Plus className="w-4 h-4" /> Tạo mã mới
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden shadow-sm">
        {vouchers.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="Chưa có voucher nào"
            description="Tạo mã giảm giá để áp dụng cho khoá học hoặc shop"
            action={{ label: 'Tạo mã mới', href: '/admin/vouchers/new' }}
          />
        ) : (
          <div className="overflow-x-auto">

          <table className="w-full min-w-[640px]">
            <thead className="bg-[#F6F1EA]/40">
              <tr className="text-left text-xs uppercase tracking-wider text-[#1C2B4A]/50">
                <th className="px-5 py-3">Mã</th>
                <th className="px-5 py-3">Giảm</th>
                <th className="px-5 py-3">Áp dụng</th>
                <th className="px-5 py-3">Lượt dùng</th>
                <th className="px-5 py-3">Hiệu lực</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2B4A]/5">
              {vouchers.map(v => {
                const expired = v.validUntil && isPast(v.validUntil)
                const notStarted = v.validFrom && isFuture(v.validFrom)
                const exhausted = v.maxUses != null && v.usedCount >= v.maxUses
                const usable = v.isActive && !expired && !notStarted && !exhausted
                return (
                  <tr key={v.id} className="hover:bg-[#F6F1EA]/20">
                    <td className="px-5 py-3">
                      <code className="font-mono text-sm font-bold text-[#1C2B4A] bg-[#C8A84B]/15 px-2 py-0.5 rounded">{v.code}</code>
                      {v.description && <p className="text-xs text-[#1C2B4A]/50 mt-0.5">{v.description}</p>}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-[#1C2B4A]">
                      {v.discountType === 'percent' ? `${v.discountValue}%`
                        : v.discountType === 'fixed' ? fmt(v.discountValue)
                        : 'Vé miễn phí'}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#1C2B4A]/60">
                      {v.appliesTo === 'any' ? 'Tất cả' : v.appliesTo === 'course_only' ? 'Khoá học' : 'Shop'}
                    </td>
                    <td className="px-5 py-3 text-sm text-[#1C2B4A]">
                      {v.usedCount}{v.maxUses != null ? `/${v.maxUses}` : ''}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#1C2B4A]/60">
                      {v.validFrom && <p>Từ {format(v.validFrom, 'dd/MM/yyyy')}</p>}
                      {v.validUntil && <p>Đến {format(v.validUntil, 'dd/MM/yyyy')}</p>}
                      {!v.validFrom && !v.validUntil && <span className="text-[#1C2B4A]/30">Không giới hạn</span>}
                    </td>
                    <td className="px-5 py-3">
                      {!v.isActive ? <Badge color="gray">Tắt</Badge>
                       : expired ? <Badge color="red">Hết hạn</Badge>
                       : notStarted ? <Badge color="amber">Chưa bắt đầu</Badge>
                       : exhausted ? <Badge color="red">Hết lượt</Badge>
                       : <Badge color="green">Đang dùng</Badge>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/admin/vouchers/${v.id}/edit`}
                        className="text-xs font-semibold text-[#1C2B4A] hover:underline">
                        Sửa
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Badge({ color, children }: { color: 'green' | 'red' | 'amber' | 'gray'; children: React.ReactNode }) {
  const colors = {
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    gray: 'bg-gray-100 text-gray-500 border-gray-200',
  }
  return <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${colors[color]}`}>{children}</span>
}
