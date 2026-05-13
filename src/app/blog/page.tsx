import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { PublicHeader, PublicFooter } from '@/components/layouts/PublicHeader'

export const metadata = {
  title: 'Blog — Poolane',
  description: 'Kiến thức bơi lội, kỹ thuật, sức khoẻ và câu chuyện học viên từ Poolane',
}

const CATEGORIES: Record<string, { label: string; emoji: string }> = {
  technique: { label: 'Kỹ thuật', emoji: '🏊' },
  safety: { label: 'An toàn', emoji: '🦺' },
  nutrition: { label: 'Dinh dưỡng', emoji: '🥗' },
  student_story: { label: 'Câu chuyện', emoji: '💬' },
  news: { label: 'Tin tức', emoji: '📢' },
}

export default async function BlogPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const params = await searchParams
  const category = params.category

  const posts = await prisma.blogPost.findMany({
    where: {
      status: 'published',
      ...(category ? { category } : {})
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    select: {
      id: true, title: true, slug: true, excerpt: true,
      category: true, coverImageUrl: true, publishedAt: true, viewCount: true
    }
  })

  return (
    <div className="min-h-screen bg-[#F6F1EA]">
      <PublicHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-heading text-4xl text-[#1C2B4A]">Blog</h1>
          <p className="text-[#1C2B4A]/60 mt-2">Kiến thức bơi lội từ Poolane</p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          <Link
            href="/blog"
            className={`px-3 py-1.5 rounded-full text-sm transition-all ${!category ? 'bg-[#1C2B4A] text-[#F6F1EA]' : 'bg-white border border-[#1C2B4A]/15 text-[#1C2B4A]/70 hover:border-[#1C2B4A]/40'}`}
          >
            Tất cả
          </Link>
          {Object.entries(CATEGORIES).map(([cat, cfg]) => (
            <Link
              key={cat}
              href={`/blog?category=${cat}`}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${category === cat ? 'bg-[#1C2B4A] text-[#F6F1EA]' : 'bg-white border border-[#1C2B4A]/15 text-[#1C2B4A]/70 hover:border-[#1C2B4A]/40'}`}
            >
              {cfg.emoji} {cfg.label}
            </Link>
          ))}
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-12 text-[#1C2B4A]/40">Chưa có bài viết nào</div>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                <article className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden hover:shadow-md transition-shadow">
                  {post.coverImageUrl && (
                    <div className="aspect-[16/9] bg-[#F6F1EA] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.coverImageUrl} alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-[#1C2B4A]/40 uppercase tracking-wider">
                        {CATEGORIES[post.category]?.emoji} {CATEGORIES[post.category]?.label ?? post.category}
                      </span>
                      {post.publishedAt && (
                        <>
                          <span className="text-[#1C2B4A]/20">·</span>
                          <span className="text-xs text-[#1C2B4A]/40">
                            {format(post.publishedAt, 'dd MMM yyyy', { locale: vi })}
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="font-heading text-xl text-[#1C2B4A] group-hover:text-[#5B8E9F] transition-colors mb-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-[#1C2B4A]/60 line-clamp-2">{post.excerpt}</p>
                    )}
                    <p className="text-xs text-[#5B8E9F] mt-3 group-hover:underline">Đọc tiếp →</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
      <PublicFooter />
    </div>
  )
}
