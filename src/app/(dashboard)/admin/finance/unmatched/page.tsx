import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { UnmatchedActions } from './UnmatchedActions'
import { Chip } from '@/components/ui/Chip'

type SearchParams = Promise<{ status?: string }>

const STATUS_TABS = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'matched', label: 'Đã gán' },
  { value: 'ignored', label: 'Đã bỏ qua' },
]

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function UnmatchedTransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['admin', 'staff'])
  const params = await searchParams
  const status = params.status ?? 'pending'

  const items = await prisma.unmatchedTransaction.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-5xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2">{items.length} giao dịch · {status}</p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Giao dịch chưa khớp</h1>
          <p className="text-sm text-paper/65 mt-2 max-w-lg">
            Sepay đã ghi nhận tiền vào nhưng không tự khớp được — gán thủ công vào đơn/khoá.
          </p>
        </div>
      </div>

      <div className="px-5 sm:px-8 -mt-6 max-w-5xl mx-auto space-y-4 relative z-10">
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(t => (
            <Link key={t.value} href={`/admin/finance/unmatched?status=${t.value}`}>
              <Chip active={status === t.value}>{t.label}</Chip>
            </Link>
          ))}
        </div>

        {/* List */}
        <div className="glass-card glass-card-hover overflow-hidden">
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
              <p className="lqg-headline text-2xl text-foreground mb-1">Không có giao dịch</p>
              <p className="text-sm text-foreground/55">Tab này chưa có giao dịch nào.</p>
            </div>
          ) : (
            <div className="divide-y divide-foreground/5">
              {items.map(t => (
                <div key={t.id} className="px-5 py-4">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p className="lqg-headline text-2xl text-foreground leading-none">{fmt(t.amount)}</p>
                        {t.gateway && <Chip variant="mist">{t.gateway}</Chip>}
                        <span className="text-xs text-foreground/55">
                          {format(t.transactionDate, 'HH:mm · dd/MM/yyyy', { locale: vi })}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/55 mb-1">
                        <span className="eyebrow normal-case tracking-[0.2em]">Nội dung CK:</span>{' '}
                        <code className="bg-paper-tint/60 px-2 py-0.5 rounded font-mono text-xs text-foreground">{t.content}</code>
                      </p>
                      {t.referenceCode && (
                        <p className="text-xs text-foreground/45">
                          Mã GD: <code className="font-mono">{t.referenceCode}</code>
                        </p>
                      )}
                      {t.notes && (
                        <p className="text-xs text-foreground/45 italic mt-1">{t.notes}</p>
                      )}
                      {t.matchedToType && t.matchedToId && (
                        <p className="text-xs text-success mt-2 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" strokeWidth={2.25} /> Đã gán: {t.matchedToType} #{t.matchedToId.slice(0, 8)}
                        </p>
                      )}
                    </div>
                    {t.status === 'pending' && (
                      <UnmatchedActions txId={t.id} amount={t.amount} content={t.content} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
