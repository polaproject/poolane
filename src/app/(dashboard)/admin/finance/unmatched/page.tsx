import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { UnmatchedActions } from './UnmatchedActions'

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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Giao dịch chưa khớp</h1>
        <p className="text-sm text-[#1C2B4A]/50 mt-1">
          Sepay đã ghi nhận tiền vào nhưng không tự match được — gán thủ công vào đơn/khoá
        </p>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_TABS.map(t => (
          <Link key={t.value} href={`/admin/finance/unmatched?status=${t.value}`}
            className={`px-4 py-2 text-sm rounded-lg border ${
              status === t.value ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]' : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15'
            }`}>
            {t.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden shadow-sm">
        {items.length === 0 ? (
          <div className="p-12 text-center text-[#1C2B4A]/40">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Không có giao dịch nào trong tab này</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1C2B4A]/5">
            {items.map(t => (
              <div key={t.id} className="px-5 py-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-heading text-xl text-[#1C2B4A]">{fmt(t.amount)}</p>
                      {t.gateway && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#1C2B4A]/8 text-[#1C2B4A]/70">
                          {t.gateway}
                        </span>
                      )}
                      <span className="text-xs text-[#1C2B4A]/50">
                        {format(t.transactionDate, 'HH:mm dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                    <p className="text-sm text-[#1C2B4A]/70 mt-2 break-words">
                      <span className="text-xs text-[#1C2B4A]/40 uppercase tracking-wider">Nội dung CK:</span>{' '}
                      <code className="bg-[#F6F1EA] px-2 py-0.5 rounded font-mono text-xs">{t.content}</code>
                    </p>
                    {t.referenceCode && (
                      <p className="text-xs text-[#1C2B4A]/50 mt-1">
                        Mã GD: <code className="font-mono">{t.referenceCode}</code>
                      </p>
                    )}
                    {t.notes && (
                      <p className="text-xs text-[#1C2B4A]/40 italic mt-1">{t.notes}</p>
                    )}
                    {t.matchedToType && t.matchedToId && (
                      <p className="text-xs text-green-700 mt-1">
                        ✓ Đã gán: {t.matchedToType} #{t.matchedToId.slice(0, 8)}
                      </p>
                    )}
                  </div>
                  {t.status === 'pending' && (
                    <UnmatchedActions
                      txId={t.id}
                      amount={t.amount}
                      content={t.content}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
