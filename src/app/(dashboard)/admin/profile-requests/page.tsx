import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { UserCog, ArrowRight } from 'lucide-react'
import { FIELD_LABELS, type ApprovalRequiredField } from '@/config/profile-fields'
import { Chip } from '@/components/ui/Chip'

type SearchParams = Promise<{ status?: string; page?: string }>

const STATUS_TABS = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
]

export default async function ProfileRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['admin', 'staff'])

  const params = await searchParams
  const status = params.status ?? 'pending'
  const page = Number(params.page ?? 1)
  const pageSize = 20

  const where = { status }
  const [items, total] = await Promise.all([
    prisma.profileChangeRequest.findMany({
      where, skip: (page - 1) * pageSize, take: pageSize,
      orderBy: { requestedAt: 'desc' },
      include: { student: { select: { id: true, studentCode: true, user: { select: { fullName: true, phone: true } } } } },
    }),
    prisma.profileChangeRequest.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-mist/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-6xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
            <UserCog className="h-3 w-3 text-accent" strokeWidth={1.75} /> {total} yêu cầu
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Yêu cầu cập nhật hồ sơ</h1>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-6xl mx-auto space-y-4 relative z-10">
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(tab => (
            <Link key={tab.value} href={`/admin/profile-requests?status=${tab.value}`}>
              <Chip asButton active={status === tab.value}>{tab.label}</Chip>
            </Link>
          ))}
        </div>

        <div className="glass-card glass-card-hover overflow-hidden">
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <UserCog className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
              <p className="lqg-headline text-2xl text-foreground">Không có yêu cầu</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-paper-tint/30 border-b border-foreground/8">
                  <tr>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Học viên</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Trường đổi</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Thời gian</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(req => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const raw = req.fieldChanges as any
                    const changes = (raw?.changes ?? {}) as Record<string, { old: string | null; new: string }>
                    const fields = Object.keys(changes) as ApprovalRequiredField[]
                    return (
                      <tr key={req.id} className="border-b border-foreground/5 last:border-b-0 hover:bg-paper-tint/20 transition group glass-table-row">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-foreground">{req.student.user.fullName}</p>
                          <p className="text-xs text-foreground/45 font-mono mt-0.5">{req.student.studentCode} · {req.student.user.phone}</p>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {fields.map(f => <Chip key={f} variant="mist">{FIELD_LABELS[f] ?? f}</Chip>)}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-foreground/55">{format(req.requestedAt, 'dd/MM/yyyy HH:mm')}</td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/admin/profile-requests/${req.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                          >
                            Chi tiết <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.25} />
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

        {totalPages > 1 && (
          <div className="flex justify-center gap-1.5 pt-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link
                key={p}
                href={`/admin/profile-requests?status=${status}&page=${p}`}
                className={`grid place-items-center h-9 w-9 rounded-pill text-sm font-medium transition ${
                  p === page ? 'bg-ink text-paper' : 'ring-1 ring-foreground/10 text-foreground/65 hover:ring-foreground/20 hover:bg-foreground/5'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
