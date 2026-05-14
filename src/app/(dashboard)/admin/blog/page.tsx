import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { Plus, Eye, FileText } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'

const CATEGORY_LABELS: Record<string, string> = {
  technique: 'Kỹ thuật',
  safety: 'An toàn',
  nutrition: 'Dinh dưỡng',
  student_story: 'Câu chuyện HV',
  news: 'Tin tức',
}

const STATUS: Record<string, { label: string; variant: 'neutral' | 'success' | 'mist' }> = {
  draft:     { label: 'Nháp',     variant: 'neutral' },
  published: { label: 'Đăng',     variant: 'success' },
  scheduled: { label: 'Lên lịch', variant: 'mist' },
}

export default async function AdminBlogPage() {
  await requireRole(['admin', 'staff'])
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="bg-ink text-paper px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-mist/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-5xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2">{posts.length} bài viết</p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Blog</h1>
          </div>
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2.5 rounded-pill text-sm hover:bg-accent/90 transition shadow-cta"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Viết bài
          </Link>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-5xl mx-auto relative z-10">
        <div className="rounded-card-lg bg-white shadow-soft ring-1 ring-ink/8 overflow-hidden">
          {posts.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-10 w-10 mx-auto mb-3 text-ink/30" strokeWidth={1.5} />
              <p className="font-heading italic text-2xl text-ink mb-1">Chưa có bài viết</p>
              <p className="text-sm text-ink/55">Bấm &ldquo;Viết bài&rdquo; để bắt đầu.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-paper-tint/30 border-b border-ink/8">
                  <tr>
                    <th className="text-left px-5 py-3 eyebrow text-ink/55">Tiêu đề</th>
                    <th className="text-left px-5 py-3 eyebrow text-ink/55">Danh mục</th>
                    <th className="text-left px-5 py-3 eyebrow text-ink/55">Trạng thái</th>
                    <th className="text-right px-5 py-3 eyebrow text-ink/55">Lượt xem</th>
                    <th className="text-left px-5 py-3 eyebrow text-ink/55">Đăng</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(p => {
                    const cfg = STATUS[p.status] ?? STATUS.draft
                    return (
                      <tr key={p.id} className="border-b border-ink/5 last:border-b-0 hover:bg-paper-tint/20 transition">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {p.coverImageUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={p.coverImageUrl} alt={p.title} className="w-12 h-12 rounded-card object-cover shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-card bg-paper-tint grid place-items-center shrink-0">
                                <FileText className="h-4 w-4 text-ink/30" strokeWidth={1.75} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-ink truncate">{p.title}</p>
                              <p className="text-xs text-ink/45 font-mono mt-0.5">/{p.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3"><Chip variant="mist">{CATEGORY_LABELS[p.category] ?? p.category}</Chip></td>
                        <td className="px-5 py-3"><Chip variant={cfg.variant} active>{cfg.label}</Chip></td>
                        <td className="px-5 py-3 text-right text-xs text-ink/65">
                          <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" strokeWidth={1.75} /> {p.viewCount}</span>
                        </td>
                        <td className="px-5 py-3 text-xs text-ink/55">
                          {p.publishedAt ? format(p.publishedAt, 'dd/MM/yyyy') : '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex gap-3 justify-end text-xs font-medium">
                            {p.status === 'published' && (
                              <a href={`/blog/${p.slug}`} target="_blank" className="text-accent hover:underline">Xem</a>
                            )}
                            <Link href={`/admin/blog/${p.id}/edit`} className="text-ink/75 hover:text-accent transition">
                              Sửa
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
