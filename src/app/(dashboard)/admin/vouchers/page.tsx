import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Tag, ArrowRight } from 'lucide-react'
import { format, isFuture, isPast } from 'date-fns'
import { EmptyState } from '@/components/ui/EmptyState'
import { Chip } from '@/components/ui/Chip'

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function VouchersPage() {
  await requireRole(['admin'])
  const vouchers = await prisma.voucher.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { usages: true } } },
  })

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-5xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2">{vouchers.length} mã giảm giá</p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Mã giảm giá</h1>
          </div>
          <Link
            href="/admin/vouchers/new"
            className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2.5 rounded-pill text-sm hover:bg-accent/90 transition shadow-cta"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Tạo mã
          </Link>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-5xl mx-auto relative z-10">
        <div className="glass-card glass-card-hover overflow-hidden">
          {vouchers.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="Chưa có voucher"
              description="Tạo mã giảm giá để áp dụng cho khoá học hoặc shop"
              action={{ label: 'Tạo mã mới', href: '/admin/vouchers/new' }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-paper-tint/30 border-b border-foreground/8">
                  <tr>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Mã</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Giảm</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Áp dụng</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Lượt dùng</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Hiệu lực</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Trạng thái</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map(v => {
                    const expired = v.validUntil && isPast(v.validUntil)
                    const notStarted = v.validFrom && isFuture(v.validFrom)
                    const exhausted = v.maxUses != null && v.usedCount >= v.maxUses
                    const usable = v.isActive && !expired && !notStarted && !exhausted

                    const chip = !v.isActive ? { variant: 'neutral' as const, label: 'Tắt' }
                      : expired ? { variant: 'danger' as const, label: 'Hết hạn' }
                      : notStarted ? { variant: 'warn' as const, label: 'Chưa bắt đầu' }
                      : exhausted ? { variant: 'danger' as const, label: 'Hết lượt' }
                      : { variant: 'success' as const, label: 'Đang dùng' }

                    return (
                      <tr key={v.id} className="border-b border-foreground/5 last:border-b-0 hover:bg-paper-tint/20 transition glass-table-row">
                        <td className="px-5 py-3">
                          <code className="font-mono text-sm font-bold text-foreground bg-accent/15 px-2.5 py-1 rounded-pill">{v.code}</code>
                          {v.description && <p className="text-xs text-foreground/55 mt-1">{v.description}</p>}
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-foreground">
                          {v.discountType === 'percent' ? `${v.discountValue}%`
                            : v.discountType === 'fixed' ? fmt(v.discountValue)
                            : 'Vé miễn phí'}
                        </td>
                        <td className="px-5 py-3 text-xs text-foreground/65">
                          {v.appliesTo === 'any' ? 'Tất cả' : v.appliesTo === 'course_only' ? 'Khoá học' : 'Shop'}
                        </td>
                        <td className="px-5 py-3 text-sm text-foreground/75">
                          {v.usedCount}{v.maxUses != null ? `/${v.maxUses}` : ''}
                        </td>
                        <td className="px-5 py-3 text-xs text-foreground/60">
                          {v.validFrom && <p>Từ {format(v.validFrom, 'dd/MM/yyyy')}</p>}
                          {v.validUntil && <p>Đến {format(v.validUntil, 'dd/MM/yyyy')}</p>}
                          {!v.validFrom && !v.validUntil && <span className="text-foreground/30">Không giới hạn</span>}
                        </td>
                        <td className="px-5 py-3">
                          <Chip variant={chip.variant} active={usable || chip.variant !== 'neutral'}>{chip.label}</Chip>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/admin/vouchers/${v.id}/edit`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                          >
                            Sửa <ArrowRight className="h-3 w-3" strokeWidth={2.25} />
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
    </div>
  )
}
