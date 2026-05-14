import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, HelpCircle } from 'lucide-react'
import { format } from 'date-fns'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function AdminQuizzesPage() {
  await requireRole(['admin', 'staff'])

  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true, attempts: true } } }
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Quiz</h1>
        <Link href="/admin/quizzes/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg text-sm font-semibold hover:bg-[#1C2B4A]/90">
          <Plus className="w-4 h-4" /> Tạo quiz mới
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden shadow-sm">
        {quizzes.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="Chưa có quiz nào"
            description="Tạo quiz để học viên ôn lại kiến thức sau buổi học"
            action={{ label: 'Tạo quiz mới', href: '/admin/quizzes/new' }}
          />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-[#F6F1EA]/40">
              <tr className="text-left text-xs uppercase tracking-wider text-[#1C2B4A]/50">
                <th className="px-5 py-3">Tiêu đề</th>
                <th className="px-5 py-3">Số câu</th>
                <th className="px-5 py-3">Lượt làm</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3">Tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2B4A]/5">
              {quizzes.map(q => (
                <tr key={q.id}>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-sm text-[#1C2B4A]">{q.title}</p>
                    {q.description && <p className="text-xs text-[#1C2B4A]/50 mt-0.5 line-clamp-1">{q.description}</p>}
                  </td>
                  <td className="px-5 py-3 text-sm text-[#1C2B4A]">{q._count.questions}</td>
                  <td className="px-5 py-3 text-sm text-[#1C2B4A]">{q._count.attempts}</td>
                  <td className="px-5 py-3">
                    {q.isPublished
                      ? <span className="px-2 py-0.5 text-xs rounded-full border bg-green-50 text-green-700 border-green-200">Đã đăng</span>
                      : <span className="px-2 py-0.5 text-xs rounded-full border bg-gray-100 text-gray-500 border-gray-200">Nháp</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-[#1C2B4A]/40">{format(q.createdAt, 'dd/MM/yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}
