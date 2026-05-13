import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { Plus, Eye } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  technique: '🏊 Kỹ thuật',
  safety: '🦺 An toàn',
  nutrition: '🥗 Dinh dưỡng',
  student_story: '⭐ Câu chuyện HV',
  news: '📰 Tin tức',
}

const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-700 border-gray-200',
  published: 'bg-green-50 text-green-700 border-green-200',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp', published: 'Đăng', scheduled: 'Lên lịch',
}

export default async function AdminBlogPage() {
  await requireRole(['admin', 'staff'])

  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl text-[#1C2B4A]">Blog</h1>
          <p className="text-sm text-[#1C2B4A]/50 mt-1">{posts.length} bài viết</p>
        </div>
        <Link href="/admin/blog/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg text-sm font-semibold hover:bg-[#1C2B4A]/90">
          <Plus className="w-4 h-4" /> Viết bài mới
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden shadow-sm">
        {posts.length === 0 ? (
          <div className="p-12 text-center text-[#1C2B4A]/40 text-sm">
            Chưa có bài viết nào — bấm &ldquo;Viết bài mới&rdquo; để bắt đầu
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#F6F1EA]/40">
              <tr className="text-left text-xs uppercase tracking-wider text-[#1C2B4A]/50">
                <th className="px-5 py-3">Tiêu đề</th>
                <th className="px-5 py-3">Danh mục</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Lượt xem</th>
                <th className="px-5 py-3">Đăng</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2B4A]/5">
              {posts.map(p => (
                <tr key={p.id} className="hover:bg-[#F6F1EA]/20">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {p.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.coverImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#F6F1EA] flex items-center justify-center text-[#1C2B4A]/20 text-xs">
                          —
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm text-[#1C2B4A]">{p.title}</p>
                        <p className="text-xs text-[#1C2B4A]/40 mt-0.5">/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-[#1C2B4A]/70">
                    {CATEGORY_LABELS[p.category] ?? p.category}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${STATUS_COLORS[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-[#1C2B4A]/60">
                    <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {p.viewCount}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-[#1C2B4A]/40">
                    {p.publishedAt ? format(p.publishedAt, 'dd/MM/yyyy') : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex gap-3 justify-end text-xs font-semibold">
                      {p.status === 'published' && (
                        <a href={`/blog/${p.slug}`} target="_blank" className="text-[#5B8E9F] hover:underline">
                          Xem
                        </a>
                      )}
                      <Link href={`/admin/blog/${p.id}/edit`} className="text-[#1C2B4A] hover:underline">
                        Sửa
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
