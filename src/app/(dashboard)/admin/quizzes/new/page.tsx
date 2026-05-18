import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { QuizForm } from '../QuizForm'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function NewQuizPage() {
  await requireRole(['admin', 'staff'])
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true }
  })

  return (
    <div className="ambient-bg min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/quizzes" className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Danh sách quiz
        </Link>
        <PageHeader
          eyebrow="Quiz"
          title="Tạo quiz mới"
          description="Câu hỏi gắn với kỹ năng — học viên tự kiểm tra hiểu biết."
          display
          className="mb-8"
        />
        <QuizForm courses={courses} />
      </div>
    </div>
  )
}
