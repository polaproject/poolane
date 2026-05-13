import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { ResetActionButton } from './ResetActionButton'

type SearchParams = Promise<{ status?: string }>

const STATUS_TABS = [
  { value: 'pending',  label: 'Chờ xử lý' },
  { value: 'resolved', label: 'Đã reset' },
  { value: 'rejected', label: 'Từ chối' },
]

export default async function PasswordResetsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['admin', 'staff'])
  const params = await searchParams
  const status = params.status ?? 'pending'

  const items = await prisma.passwordResetRequest.findMany({
    where: { status },
    orderBy: { requestedAt: 'desc' },
    take: 100,
  })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Yêu cầu reset mật khẩu</h1>
        <p className="text-sm text-[#1C2B4A]/50 mt-1">{items.length} yêu cầu</p>
      </div>

      <div className="flex gap-2 mb-5">
        {STATUS_TABS.map(t => (
          <a key={t.value} href={`/admin/password-resets?status=${t.value}`}
            className={`px-4 py-2 text-sm rounded-lg border ${
              status === t.value ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]' : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15'
            }`}>
            {t.label}
          </a>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-[#1C2B4A]/40">Không có yêu cầu nào</div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#F6F1EA]/40">
              <tr className="text-left text-xs uppercase tracking-wider text-[#1C2B4A]/50">
                <th className="px-5 py-3">SĐT / Tên</th>
                <th className="px-5 py-3">Thời gian</th>
                <th className="px-5 py-3">IP</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2B4A]/5">
              {items.map(r => (
                <tr key={r.id}>
                  <td className="px-5 py-3">
                    <p className="font-mono text-sm text-[#1C2B4A]">{r.phone}</p>
                    {r.fullNameHint && <p className="text-xs text-[#1C2B4A]/50">{r.fullNameHint}</p>}
                  </td>
                  <td className="px-5 py-3 text-xs text-[#1C2B4A]/60">
                    {format(r.requestedAt, 'HH:mm dd/MM/yyyy')}
                  </td>
                  <td className="px-5 py-3 text-xs text-[#1C2B4A]/40 font-mono">{r.ipAddress ?? '—'}</td>
                  <td className="px-5 py-3 text-right">
                    {r.status === 'pending' ? (
                      <ResetActionButton id={r.id} />
                    ) : (
                      <span className="text-xs text-[#1C2B4A]/40">
                        {r.processedAt ? format(r.processedAt, 'HH:mm dd/MM') : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
