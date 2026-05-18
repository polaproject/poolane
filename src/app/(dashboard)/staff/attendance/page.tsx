import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Sunrise, Sunset, ClipboardCheck, Users } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { PageHeader } from '@/components/ui/PageHeader'
import { Chip } from '@/components/ui/Chip'

/**
 * /staff/attendance — Index page liệt kê các buổi học của hôm nay.
 *
 * Trước Phase 21 chưa có page này → QuickAddFab "Điểm danh hôm nay" trỏ
 * /staff/attendance → 404. Build page này để có entry point.
 *
 * Nếu hôm nay không có buổi nào → empty state hướng dẫn về schedule.
 */
export default async function AttendanceIndexPage() {
  await requireRole(['admin', 'staff'])

  const today = new Date()
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dayEnd = new Date(dayStart.getTime() + 86400_000)

  const sessions = await prisma.classSession.findMany({
    where: {
      date: { gte: dayStart, lt: dayEnd },
      status: { in: ['scheduled', 'in_progress', 'completed'] },
    },
    include: {
      registrations: {
        where: { status: 'approved' },
        select: { id: true },
      },
      attendances: {
        select: { studentId: true, status: true },
      },
    },
    orderBy: { timeSlot: 'asc' },
  })

  return (
    <div className="ambient-bg min-h-screen">
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Trang chủ
        </Link>
        <PageHeader
          eyebrow="Điểm danh"
          title="Buổi học hôm nay"
          description={format(today, "EEEE, dd 'tháng' MM 'năm' yyyy", { locale: vi })}
          display
          className="mb-6"
        />

        {sessions.length === 0 ? (
          <div className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/8 p-8 text-center">
            <p className="text-foreground/65 text-sm mb-3">
              Hôm nay không có buổi học nào được lên lịch.
            </p>
            <Link
              href="/admin/schedule"
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
            >
              Xem lịch tuần →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const presentCount = s.attendances.filter((a) => ['present', 'walk_in'].includes(a.status)).length
              const totalApproved = s.registrations.length
              const isMorning = s.timeSlot === 'morning'
              const cap = isMorning ? 5 : 7
              const done = totalApproved > 0 && presentCount === totalApproved
              return (
                <Link
                  key={s.id}
                  href={`/staff/attendance/${s.id}`}
                  className="block rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/8 p-5 hover:shadow-glass transition group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="eyebrow text-foreground/55 mb-1 inline-flex items-center gap-1.5">
                        {isMorning ? (
                          <><Sunrise className="h-3 w-3 text-accent" strokeWidth={2.25} /> 5:30 – 7:30 sáng</>
                        ) : (
                          <><Sunset className="h-3 w-3 text-accent" strokeWidth={2.25} /> 18:00 – 20:00 chiều</>
                        )}
                      </p>
                      <p className="lqg-headline text-xl text-foreground">
                        Ca {isMorning ? 'sáng' : 'chiều'}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        <Chip variant="mist" className="text-[10px]">
                          <Users className="h-3 w-3" strokeWidth={2.25} /> {totalApproved}/{cap} đã duyệt
                        </Chip>
                        {totalApproved > 0 && (
                          <Chip variant={done ? 'success' : 'warn'} active={done} className="text-[10px]">
                            {done ? 'Đã điểm danh đủ' : `${presentCount}/${totalApproved} có mặt`}
                          </Chip>
                        )}
                        {s.status === 'completed' && (
                          <Chip variant="neutral" className="text-[10px]">Hoàn tất</Chip>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-pill bg-accent text-ink group-hover:scale-[1.02] transition shadow-cta">
                      <ClipboardCheck className="h-3.5 w-3.5" strokeWidth={2} /> Mở
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <p className="text-xs text-foreground/55 mt-6 text-center">
          Cần điểm danh buổi khác?{' '}
          <Link href="/admin/schedule" className="text-accent hover:underline">
            Xem toàn bộ lịch →
          </Link>
        </p>
      </div>
    </div>
  )
}
