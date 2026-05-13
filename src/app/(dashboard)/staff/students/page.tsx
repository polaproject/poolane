import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

type SearchParams = Promise<{ search?: string; status?: string; page?: string }>

export default async function StaffStudentsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['staff', 'admin'])

  const params = await searchParams
  const page = Number(params.page ?? 1)
  const pageSize = 20
  const search = params.search ?? ''
  const statusFilter = params.status ?? ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (statusFilter) {
    where.status = statusFilter as 'prospect' | 'enrolled' | 'active' | 'extension' | 'completed' | 'inactive' | 'refunded'
  }

  if (search) {
    where.OR = [
      { studentCode: { contains: search, mode: 'insensitive' } },
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
      { user: { phone: { contains: search } } },
    ]
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, phone: true } },
        enrollments: {
          where: { status: { in: ['active', 'extension'] } },
          include: { course: { select: { code: true } } }
        },
        poolTickets: {
          where: { isActive: true },
          orderBy: { purchasedAt: 'desc' },
          take: 1,
          select: { sessionsUsed: true, maxSessions: true }
        }
      }
    }),
    prisma.student.count({ where })
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl text-[#1C2B4A]">Học viên</h1>
          <p className="text-sm text-[#1C2B4A]/50 mt-1">
            {total} học viên · Chế độ xem
          </p>
        </div>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <form className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C2B4A]/40" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Tìm tên, SĐT, mã học viên..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#1C2B4A]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 bg-white"
            />
          </div>
          <button type="submit" className="px-4 py-2 text-sm bg-[#1C2B4A] text-[#F6F1EA] rounded-lg hover:bg-[#1C2B4A]/90">
            Tìm
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          {[
            { value: '', label: 'Tất cả' },
            { value: 'enrolled', label: 'Đã đăng ký' },
            { value: 'active', label: 'Đang học' },
            { value: 'extension', label: 'Ôn luyện' },
            { value: 'inactive', label: 'Vắng lâu' },
          ].map(f => (
            <Link
              key={f.value}
              href={`/staff/students?status=${f.value}${search ? `&search=${search}` : ''}`}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                statusFilter === f.value
                  ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]'
                  : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15 hover:border-[#1C2B4A]/40'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-[#F6F1EA]/40">
            <tr className="text-left text-xs uppercase tracking-wider text-[#1C2B4A]/50">
              <th className="px-5 py-3">Học viên</th>
              <th className="px-5 py-3">Khoá</th>
              <th className="px-5 py-3">Vé bơi</th>
              <th className="px-5 py-3">Lần cuối</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2B4A]/5">
            {students.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-[#1C2B4A]/35">
                  {search ? 'Không tìm thấy học viên nào' : 'Chưa có học viên nào'}
                </td>
              </tr>
            ) : (
              students.map((s) => {
                const ticket = s.poolTickets[0]
                const sessionsLeft = ticket ? ticket.maxSessions - ticket.sessionsUsed : null
                const isLowStock = sessionsLeft !== null && sessionsLeft <= 2

                return (
                  <tr key={s.id} className="hover:bg-[#F6F1EA]/20">
                    <td className="px-5 py-3">
                      <Link href={`/staff/students/${s.id}`} className="block group">
                        <div className="font-semibold text-sm text-[#1C2B4A] group-hover:underline">
                          {s.user.fullName}
                        </div>
                        <div className="text-xs text-[#1C2B4A]/40 mt-0.5">
                          {s.studentCode} · {s.user.phone}
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      {s.enrollments.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {s.enrollments.map(e => (
                            <span key={e.id} className="inline-block px-2 py-0.5 text-xs rounded-full bg-[#5B8E9F]/15 text-[#5B8E9F] font-semibold">
                              {e.course.code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-[#1C2B4A]/25">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {sessionsLeft !== null ? (
                        <span className={`text-xs font-semibold ${isLowStock ? 'text-red-500' : 'text-[#1C2B4A]/65'}`}>
                          {sessionsLeft} buổi {isLowStock ? '⚠️' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-[#1C2B4A]/30">Chưa có vé</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#1C2B4A]/45">
                      {s.lastAttendedAt
                        ? formatDistanceToNow(s.lastAttendedAt, { addSuffix: true, locale: vi })
                        : '—'
                      }
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Link
              key={p}
              href={`/staff/students?page=${p}${statusFilter ? `&status=${statusFilter}` : ''}${search ? `&search=${search}` : ''}`}
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
