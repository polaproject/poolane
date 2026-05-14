import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Undo2 } from 'lucide-react'
import { NewRefundForm } from './NewRefundForm'

type SearchParams = Promise<{ student?: string }>

export default async function NewRefundPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['admin'])

  const params = await searchParams
  const preselectedStudentId = params.student

  const students = await prisma.student.findMany({
    where: {
      OR: [
        { enrollments: { some: { status: { in: ['active', 'extension', 'completed'] } } } },
        { poolTickets: { some: { isActive: true } } },
      ],
    },
    select: {
      id: true,
      studentCode: true,
      user: { select: { fullName: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  let preselected = null
  if (preselectedStudentId) {
    preselected = await prisma.student.findUnique({
      where: { id: preselectedStudentId },
      include: {
        user: { select: { fullName: true, phone: true } },
        enrollments: {
          where: { status: { in: ['active', 'extension', 'completed'] } },
          include: { course: { select: { code: true, name: true, price: true } } },
        },
        poolTickets: { where: { isActive: true }, orderBy: { purchasedAt: 'desc' }, take: 1 },
      },
    })
  }

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-warn/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-3xl mx-auto">
          <Link
            href="/admin/finance/refunds"
            className="inline-flex items-center gap-1.5 text-sm text-paper/65 hover:text-paper transition mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
            Danh sách hoàn tiền
          </Link>
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
            <Undo2 className="h-3 w-3 text-accent" strokeWidth={1.75} /> Theo chính sách CLAUDE.md §7.5
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl italic leading-tight">Tạo yêu cầu hoàn tiền</h1>
          <p className="text-sm text-paper/65 mt-2 max-w-lg">
            Số tiền hoàn được tính tự động theo chính sách (50% nếu 0 buổi, giảm dần theo số buổi đã học).
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-3xl mx-auto relative z-10">
        <div className="glass-card glass-card-hover p-5 sm:p-6">
          <NewRefundForm
            students={students.map(s => ({
              id: s.id,
              studentCode: s.studentCode,
              fullName: s.user.fullName,
              phone: s.user.phone,
            }))}
            preselected={preselected ? {
              id: preselected.id,
              studentCode: preselected.studentCode,
              fullName: preselected.user.fullName,
              phone: preselected.user.phone,
              enrollments: preselected.enrollments.map(e => ({
                id: e.id,
                courseCode: e.course.code,
                courseName: e.course.name,
                totalPaid: e.totalPaid,
                status: e.status,
              })),
              activeTicket: preselected.poolTickets[0] ? {
                id: preselected.poolTickets[0].id,
                sessionsUsed: preselected.poolTickets[0].sessionsUsed,
                totalSessions: preselected.poolTickets[0].totalSessions,
                pricePaid: preselected.poolTickets[0].pricePaid,
              } : null,
            } : null}
          />
        </div>
      </div>
    </div>
  )
}
