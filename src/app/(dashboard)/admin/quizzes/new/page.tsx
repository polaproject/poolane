import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { QuizForm } from '../QuizForm'

export default async function NewQuizPage() {
  await requireRole(['admin', 'staff'])
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true }
  })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/admin/quizzes" className="inline-flex items-center gap-1 text-sm text-[#1C2B4A]/70 hover:text-[#1C2B4A] mb-6">
        <ArrowLeft className="w-4 h-4" /> Danh sách quiz
      </Link>
      <h1 className="font-heading text-3xl text-[#1C2B4A] mb-6">Tạo quiz mới</h1>
      <QuizForm courses={courses} />
    </div>
  )
}
