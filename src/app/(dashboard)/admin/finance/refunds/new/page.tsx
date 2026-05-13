import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NewRefundForm } from './NewRefundForm'

type SearchParams = Promise<{ student?: string }>

export default async function NewRefundPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['admin'])

  const params = await searchParams
  const preselectedStudentId = params.student

  // Lấy danh sách HV có enrollment hoặc vé bơi active
  const students = await prisma.student.findMany({
    where: {
      OR: [
        { enrollments: { some: { status: { in: ['active', 'extension', 'completed'] } } } },
        { poolTickets: { some: { isActive: true } } },
      ]
    },
    select: {
      id: true,
      studentCode: true,
      user: { select: { fullName: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  // Nếu preselect → load chi tiết enrollments + vé
  let preselected = null
  if (preselectedStudentId) {
    preselected = await prisma.student.findUnique({
      where: { id: preselectedStudentId },
      include: {
        user: { select: { fullName: true, phone: true } },
        enrollments: {
          where: { status: { in: ['active', 'extension', 'completed'] } },
          include: { course: { select: { code: true, name: true, price: true } } }
        },
        poolTickets: {
          where: { isActive: true },
          orderBy: { purchasedAt: 'desc' },
          take: 1,
        },
      }
    })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/finance/refunds"
          className="inline-flex items-center gap-1 text-sm text-[#1C2B4A]/70 hover:text-[#1C2B4A]"
        >
          <ArrowLeft className="w-4 h-4" /> Danh sách hoàn tiền
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Tạo yêu cầu hoàn tiền</h1>
        <p className="text-sm text-[#1C2B4A]/50 mt-1">
          Số tiền hoàn được tính tự động theo chính sách (xem CLAUDE.md §7.5)
        </p>
      </div>

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
  )
}
