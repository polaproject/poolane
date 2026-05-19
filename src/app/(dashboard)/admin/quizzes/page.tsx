import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, HelpCircle } from 'lucide-react'
import { format } from 'date-fns'
import { EmptyState } from '@/components/ui/EmptyState'
import { Chip } from '@/components/ui/Chip'

export default async function AdminQuizzesPage() {
  await requireRole(['admin', 'staff'])

  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true, attempts: true } } },
  })

  return (
    <div className="min-h-screen pb-12">
      <div className="hero-block pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-5xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2">{quizzes.length} bộ câu hỏi</p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Quiz</h1>
          </div>
          <Link
            href="/admin/quizzes/new"
            className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2.5 rounded-pill text-sm hover:bg-accent/90 transition shadow-cta"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Tạo quiz
          </Link>
        </div>
      </div>

      <div className="-mt-6 max-w-5xl mx-auto relative z-10">
        <div className="glass-card glass-card-hover overflow-hidden">
          {quizzes.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="Chưa có quiz"
              description="Tạo quiz để học viên ôn lại kiến thức sau buổi học"
              action={{ label: 'Tạo quiz mới', href: '/admin/quizzes/new' }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-paper-tint/30 border-b border-foreground/8">
                  <tr>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Tiêu đề</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Số câu</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Lượt làm</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Trạng thái</th>
                    <th className="text-left px-5 py-3 eyebrow text-foreground/55">Tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map(q => (
                    <tr key={q.id} className="border-b border-foreground/5 last:border-b-0 hover:bg-paper-tint/20 transition glass-table-row">
                      <td className="px-5 py-3">
                        <p className="font-medium text-sm text-foreground">{q.title}</p>
                        {q.description && <p className="text-xs text-foreground/55 mt-0.5 line-clamp-1">{q.description}</p>}
                      </td>
                      <td className="px-5 py-3 text-sm text-foreground">{q._count.questions}</td>
                      <td className="px-5 py-3 text-sm text-foreground">{q._count.attempts}</td>
                      <td className="px-5 py-3">
                        <Chip variant={q.isPublished ? 'success' : 'neutral'} active>
                          {q.isPublished ? 'Đã đăng' : 'Nháp'}
                        </Chip>
                      </td>
                      <td className="px-5 py-3 text-xs text-foreground/55">{format(q.createdAt, 'dd/MM/yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
