import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { FIELD_LABELS, type ApprovalRequiredField } from '@/config/profile-fields'

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
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { requestedAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            user: { select: { fullName: true, phone: true } }
          }
        }
      }
    }),
    prisma.profileChangeRequest.count({ where })
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Yêu cầu cập nhật hồ sơ</h1>
        <p className="text-sm text-[#1C2B4A]/50 mt-1">
          {total} yêu cầu {status === 'pending' ? 'đang chờ duyệt' : status === 'approved' ? 'đã duyệt' : 'đã từ chối'}
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {STATUS_TABS.map(tab => (
          <Link
            key={tab.value}
            href={`/admin/profile-requests?status=${tab.value}`}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              status === tab.value
                ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]'
                : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15 hover:border-[#1C2B4A]/40'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden shadow-sm">
        {items.length === 0 ? (
          <div className="p-12 text-center text-[#1C2B4A]/40 text-sm">
            Không có yêu cầu nào
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#F6F1EA]/40">
              <tr className="text-left text-xs uppercase tracking-wider text-[#1C2B4A]/50">
                <th className="px-5 py-3">Học viên</th>
                <th className="px-5 py-3">Trường yêu cầu đổi</th>
                <th className="px-5 py-3">Thời gian</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2B4A]/5">
              {items.map(req => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const raw = req.fieldChanges as any
                const changes = (raw?.changes ?? {}) as Record<string, { old: string | null; new: string }>
                const fields = Object.keys(changes) as ApprovalRequiredField[]
                return (
                  <tr key={req.id} className="hover:bg-[#F6F1EA]/20">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-sm text-[#1C2B4A]">{req.student.user.fullName}</p>
                      <p className="text-xs text-[#1C2B4A]/40 mt-0.5">
                        {req.student.studentCode} · {req.student.user.phone}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {fields.map(f => (
                          <span
                            key={f}
                            className="inline-block px-2 py-0.5 text-xs rounded-full bg-[#1C2B4A]/8 text-[#1C2B4A]/70"
                          >
                            {FIELD_LABELS[f] ?? f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#1C2B4A]/50">
                      {format(req.requestedAt, 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/profile-requests/${req.id}`}
                        className="text-xs font-semibold text-[#1C2B4A] hover:underline"
                      >
                        Xem chi tiết →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Link
              key={p}
              href={`/admin/profile-requests?status=${status}&page=${p}`}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
                p === page
                  ? 'bg-[#1C2B4A] text-[#F6F1EA]'
                  : 'bg-white border border-[#1C2B4A]/15 text-[#1C2B4A]/60 hover:border-[#1C2B4A]/40'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
