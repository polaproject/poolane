import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { Key } from 'lucide-react'
import { ResetActionButton } from './ResetActionButton'
import { Chip } from '@/components/ui/Chip'

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

  const items = await prisma.passwordResetRequest.findMany({ where: { status }, orderBy: { requestedAt: 'desc' }, take: 100 })

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-4xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
            <Key className="h-3 w-3 text-accent" strokeWidth={1.75} /> {items.length} yêu cầu
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Reset mật khẩu</h1>
        </div>
      </div>

      <div className="-mt-6 max-w-4xl mx-auto space-y-4 relative z-10">
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(t => (
            <a key={t.value} href={`/admin/password-resets?status=${t.value}`}>
              <Chip active={status === t.value}>{t.label}</Chip>
            </a>
          ))}
        </div>

        <div className="glass-card glass-card-hover overflow-hidden">
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <Key className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
              <p className="lqg-headline text-2xl text-foreground">Không có yêu cầu</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-paper-tint/30 border-b border-foreground/8">
                  <tr>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">SĐT / Tên</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Thời gian</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">IP</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(r => (
                    <tr key={r.id} className="border-b border-foreground/5 last:border-b-0 hover:bg-paper-tint/20 transition glass-table-row">
                      <td className="px-5 py-3">
                        <p className="font-mono text-sm text-foreground">{r.phone}</p>
                        {r.fullNameHint && <p className="text-xs text-foreground/55 mt-0.5">{r.fullNameHint}</p>}
                      </td>
                      <td className="px-5 py-3 text-xs text-foreground/65">{format(r.requestedAt, 'HH:mm · dd/MM/yyyy')}</td>
                      <td className="px-5 py-3 text-xs text-foreground/45 font-mono">{r.ipAddress ?? '—'}</td>
                      <td className="px-5 py-3 text-right">
                        {r.status === 'pending'
                          ? <ResetActionButton id={r.id} />
                          : <span className="text-xs text-foreground/45">{r.processedAt ? format(r.processedAt, 'HH:mm · dd/MM') : '—'}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
