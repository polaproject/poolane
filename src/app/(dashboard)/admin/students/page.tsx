import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { UserPlus, Search, ArrowRight, AlertCircle, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Chip } from '@/components/ui/Chip'
import { Avatar } from '@/components/ui/Avatar'

type Variant = 'neutral' | 'accent' | 'mist' | 'success' | 'warn' | 'danger'
const STATUS_CONFIG: Record<string, { label: string; variant: Variant }> = {
  prospect:  { label: 'Tiềm năng',  variant: 'accent' },
  enrolled:  { label: 'Đã đăng ký', variant: 'mist' },
  active:    { label: 'Đang học',   variant: 'success' },
  extension: { label: 'Ôn luyện',   variant: 'warn' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  inactive:  { label: 'Vắng lâu',   variant: 'danger' },
  refunded:  { label: 'Đã hoàn',    variant: 'neutral' },
}

const FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'prospect', label: 'Tiềm năng' },
  { value: 'enrolled', label: 'Đã đăng ký' },
  { value: 'active', label: 'Đang học' },
  { value: 'extension', label: 'Ôn luyện' },
  { value: 'inactive', label: 'Vắng lâu' },
]

type SearchParams = Promise<{ search?: string; status?: string; page?: string }>

export default async function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['admin', 'staff'])

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
        user: { select: { fullName: true, phone: true, isActive: true, avatarUrl: true } },
        enrollments: {
          where: { status: { in: ['active', 'extension'] } },
          include: { course: { select: { code: true, name: true } } },
        },
        poolTickets: {
          where: { isActive: true },
          orderBy: { purchasedAt: 'desc' },
          take: 1,
          select: { sessionsUsed: true, maxSessions: true },
        },
      },
    }),
    prisma.student.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)
  const buildHref = (overrides: Record<string, string>) => {
    const next = { status: statusFilter, search, page: String(page), ...overrides }
    const qs = Object.entries(next).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
    return `/admin/students${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-7xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2">Quản lý · {total} học viên</p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Học viên</h1>
          </div>
          <Link
            href="/admin/students/new"
            className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2.5 rounded-pill text-sm hover:bg-accent/90 transition shadow-cta"
          >
            <UserPlus className="h-4 w-4" strokeWidth={2.25} /> Thêm học viên
          </Link>
        </div>
      </div>

      <div className="pl-5 pr-[5rem] sm:px-8 -mt-6 max-w-7xl mx-auto space-y-4 relative z-10">
        {/* Filters card */}
        <div className="glass-card glass-card-hover p-4 space-y-3">
          <form className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" strokeWidth={1.75} />
              <input
                name="search"
                defaultValue={search}
                placeholder="Tìm tên, SĐT, mã học viên..."
                className="w-full pl-10 pr-4 h-10 text-sm rounded-pill bg-paper-tint/40 ring-1 ring-foreground/10 focus:ring-accent/40 focus:outline-none transition"
              />
            </div>
            <button
              type="submit"
              className="px-5 h-10 text-sm bg-ink text-paper rounded-pill hover:bg-foreground/90 transition font-medium"
            >
              Tìm
            </button>
          </form>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <Link key={f.value} href={buildHref({ status: f.value, page: '1' })}>
                <Chip active={statusFilter === f.value}>{f.label}</Chip>
              </Link>
            ))}
          </div>
        </div>

        {/* Table card */}
        <div className="glass-card glass-card-hover overflow-hidden">
          {students.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
              <p className="lqg-headline text-2xl text-foreground mb-1">
                {search || statusFilter ? 'Không khớp tìm kiếm' : 'Chưa có học viên'}
              </p>
              <p className="text-sm text-foreground/55">
                {search || statusFilter ? 'Thử bỏ filter hoặc đổi từ khoá' : 'Thêm học viên mới qua nút phía trên'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-foreground/8 bg-paper-tint/30">
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Học viên</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Trạng thái</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Khoá học</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Vé bơi</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Lần cuối</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const cfg = STATUS_CONFIG[student.status] ?? STATUS_CONFIG.prospect
                    const ticket = student.poolTickets[0]
                    const sessionsLeft = ticket ? ticket.maxSessions - ticket.sessionsUsed : null
                    const isLow = sessionsLeft !== null && sessionsLeft <= 2
                    return (
                      <tr key={student.id} className="border-b border-foreground/5 last:border-b-0 hover:bg-paper-tint/20 transition group glass-table-row">
                        <td className="px-5 py-3.5">
                          <Link href={`/admin/students/${student.id}`} className="block">
                            <div className="flex items-center gap-3">
                              <Avatar avatarUrl={student.user.avatarUrl} fullName={student.user.fullName} size="md" variant="mist" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate group-hover:text-accent transition">{student.user.fullName}</p>
                                <p className="text-xs text-foreground/45 font-mono">{student.studentCode} · {student.user.phone}</p>
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <Chip variant={cfg.variant} active>{cfg.label}</Chip>
                        </td>
                        <td className="px-5 py-3.5">
                          {student.enrollments.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {student.enrollments.map(e => (
                                <Chip key={e.id} variant="mist">{e.course.code}</Chip>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-foreground/30">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {sessionsLeft !== null ? (
                            <span className={`text-sm inline-flex items-center gap-1 ${isLow ? 'text-danger font-semibold' : 'text-foreground/65'}`}>
                              {isLow && <AlertCircle className="h-3 w-3" strokeWidth={2.25} />}
                              {sessionsLeft} buổi
                            </span>
                          ) : (
                            <span className="text-xs text-foreground/30">Chưa có vé</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-foreground/55">
                          {student.lastAttendedAt
                            ? formatDistanceToNow(student.lastAttendedAt, { addSuffix: true, locale: vi })
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1.5 pt-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link
                key={p}
                href={buildHref({ page: String(p) })}
                className={`grid place-items-center h-9 w-9 rounded-pill text-sm font-medium transition ${
                  p === page
                    ? 'bg-ink text-paper'
                    : 'ring-1 ring-foreground/10 text-foreground/65 hover:ring-foreground/20 hover:bg-foreground/5'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}

        {totalPages > 0 && (
          <p className="text-xs text-foreground/45 text-center inline-flex items-center justify-center gap-2 w-full">
            Trang {page}/{totalPages} · {total} học viên
            <ArrowRight className="h-3 w-3 opacity-50" strokeWidth={1.75} />
          </p>
        )}
      </div>
    </div>
  )
}
