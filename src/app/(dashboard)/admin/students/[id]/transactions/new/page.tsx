import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { NewTransactionForm } from './NewTransactionForm'

type Params = { params: Promise<{ id: string }> }

export default async function NewTransactionPage({ params }: Params) {
  await requireRole(['admin']) // strict admin
  const { id: studentId } = await params

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { fullName: true, phone: true } } },
  })
  if (!student) notFound()

  return (
    <div className="ambient-bg min-h-screen">
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        <Link
          href={`/admin/students/${studentId}/transactions`}
          className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Lịch sử giao dịch
        </Link>
        <PageHeader
          eyebrow="Quản lý giao dịch"
          title="Thêm giao dịch thủ công"
          description={`HV: ${student.user.fullName} · ${student.user.phone ?? ''}`}
          display
          className="mb-6"
        />

        <NewTransactionForm studentId={studentId} />
      </div>
    </div>
  )
}
