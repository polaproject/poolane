import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserPlus, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  prospect:  { label: 'Tiềm năng',  variant: 'outline' },
  enrolled:  { label: 'Đã đăng ký', variant: 'secondary' },
  active:    { label: 'Đang học',   variant: 'default' },
  extension: { label: 'Ôn luyện',   variant: 'secondary' },
  completed: { label: 'Hoàn thành', variant: 'default' },
  inactive:  { label: 'Vắng lâu',   variant: 'destructive' },
  refunded:  { label: 'Đã hoàn',    variant: 'outline' },
}

type SearchParams = Promise<{ search?: string; status?: string; page?: string }>

export default async function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['admin', 'staff'])

  const params = await searchParams
  const page = Number(params.page ?? 1)
  const pageSize = 20
  const search = params.search ?? ''
  const statusFilter = params.status ?? ''

  const where: Parameters<typeof prisma.student.findMany>[0]['where'] = {}

  if (statusFilter) where.status = statusFilter as 'prospect'

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
        user: { select: { fullName: true, phone: true, isActive: true } },
        enrollments: {
          where: { status: { in: ['active', 'extension'] } },
          include: { course: { select: { code: true, name: true } } }
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl text-[#1C2B4A]">Học viên</h1>
          <p className="text-sm text-[#1C2B4A]/50 mt-1">{total} học viên trong hệ thống</p>
        </div>
        <Button asChild className="bg-[#1C2B4A] text-[#F6F1EA] hover:bg-[#1C2B4A]/90">
          <Link href="/admin/students/new">
            <UserPlus className="w-4 h-4 mr-2" />
            Thêm học viên
          </Link>
        </Button>
      </div>

      {/* Filters */}
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

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '', label: 'Tất cả' },
            { value: 'prospect', label: 'Tiềm năng' },
            { value: 'enrolled', label: 'Đã đăng ký' },
            { value: 'active', label: 'Đang học' },
            { value: 'extension', label: 'Ôn luyện' },
            { value: 'inactive', label: 'Vắng lâu' },
          ].map(f => (
            <Link
              key={f.value}
              href={`/admin/students?status=${f.value}${search ? `&search=${search}` : ''}`}
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1C2B4A]/8">
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#1C2B4A]/50 uppercase tracking-wider">Học viên</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#1C2B4A]/50 uppercase tracking-wider">Trạng thái</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#1C2B4A]/50 uppercase tracking-wider">Khoá học</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#1C2B4A]/50 uppercase tracking-wider">Vé bơi</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#1C2B4A]/50 uppercase tracking-wider">Lần cuối</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-[#1C2B4A]/40">
                  {search ? 'Không tìm thấy học viên nào' : 'Chưa có học viên nào'}
                </td>
              </tr>
            ) : (
              students.map((student, i) => {
                const statusConfig = STATUS_LABELS[student.status] ?? STATUS_LABELS.prospect
                const ticket = student.poolTickets[0]
                const sessionsLeft = ticket ? ticket.maxSessions - ticket.sessionsUsed : null
                const isLowStock = sessionsLeft !== null && sessionsLeft <= 2

                return (
                  <tr
                    key={student.id}
                    className={`border-b border-[#1C2B4A]/5 hover:bg-[#F6F1EA]/50 transition-colors ${i === students.length - 1 ? 'border-0' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/students/${student.id}`} className="block hover:text-[#1C2B4A]">
                        <div className="font-medium text-[#1C2B4A]">{student.user.fullName}</div>
                        <div className="text-xs text-[#1C2B4A]/50 mt-0.5">
                          {student.studentCode} · {student.user.phone}
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusConfig.variant} className="text-xs">
                        {statusConfig.label}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      {student.enrollments.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {student.enrollments.map(e => (
                            <span key={e.id} className="text-xs bg-[#5B8E9F]/10 text-[#5B8E9F] px-2 py-0.5 rounded-full font-medium">
                              {e.course.code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-[#1C2B4A]/30">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {sessionsLeft !== null ? (
                        <span className={`text-xs font-medium ${isLowStock ? 'text-red-500' : 'text-[#1C2B4A]/70'}`}>
                          {sessionsLeft} buổi {isLowStock ? '⚠️' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-[#1C2B4A]/30">Chưa có vé</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#1C2B4A]/50">
                      {student.lastAttendedAt
                        ? formatDistanceToNow(student.lastAttendedAt, { addSuffix: true, locale: vi })
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Link
              key={p}
              href={`/admin/students?page=${p}${statusFilter ? `&status=${statusFilter}` : ''}${search ? `&search=${search}` : ''}`}
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
