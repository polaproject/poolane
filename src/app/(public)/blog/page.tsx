import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { PageHeader } from '@/components/ui/PageHeader'
import { Chip } from '@/components/ui/Chip'
import { ArrowRight, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Blog — Poolane',
  description: 'Kiến thức bơi lội, kỹ thuật, sức khoẻ và câu chuyện học viên từ Poolane',
}

const CATEGORIES: Record<string, { label: string }> = {
  technique: { label: 'Kỹ thuật' },
  safety: { label: 'An toàn' },
  nutrition: { label: 'Dinh dưỡng' },
  student_story: { label: 'Câu chuyện' },
  news: { label: 'Tin tức' },
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const params = await searchParams
  const category = params.category

  const posts = await prisma.blogPost.findMany({
    where: {
      status: 'published',
      ...(category ? { category } : {}),
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    select: {
      id: true, title: true, slug: true, excerpt: true,
      category: true, coverImageUrl: true, publishedAt: true, viewCount: true,
    },
  })

  return (
    <>
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-8">
        <PageHeader
          eyebrow="Blog · Poolane"
          title="Kiến thức & câu chuyện"
          display
          description="Kỹ thuật bơi, dinh dưỡng, an toàn dưới nước, và những câu chuyện từ học viên Poolane — viết bởi lớp."
        />
      </section>

      {/* Category filter chips */}
      <section className="mx-auto max-w-5xl px-4 pb-8">
        <div className="flex gap-2 flex-wrap">
          <Link href="/blog">
            <Chip asButton active={!category}>Tất cả</Chip>
          </Link>
          {Object.entries(CATEGORIES).map(([cat, cfg]) => (
            <Link key={cat} href={`/blog?category=${cat}`}>
              <Chip asButton active={category === cat}>{cfg.label}</Chip>
            </Link>
          ))}
        </div>
      </section>

      {/* Posts grid */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        {posts.length === 0 ? (
          <div className="rounded-card-xl bg-current/5 ring-1 ring-current/10 p-12 text-center backdrop-blur-sm">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" strokeWidth={1.5} />
            <p className="font-heading italic text-2xl mb-1">Chưa có bài viết nào</p>
            <p className="text-sm opacity-65">Lớp đang viết bài đầu tay — quay lại sớm nhé.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <article className="rounded-card-xl bg-current/5 ring-1 ring-current/10 overflow-hidden backdrop-blur-sm hover:-translate-y-0.5 hover:ring-current/20 transition-all duration-300 h-full flex flex-col">
                  {post.coverImageUrl ? (
                    <div className="aspect-[16/9] bg-current/10 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-accent/20 to-mist/20 grid place-items-center">
                      <BookOpen className="h-10 w-10 text-accent opacity-60" strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs opacity-60 mb-2.5">
                      <span className="tracking-widest uppercase font-medium text-accent">
                        {CATEGORIES[post.category]?.label ?? post.category}
                      </span>
                      {post.publishedAt && (
                        <>
                          <span className="opacity-40">·</span>
                          <span>{format(post.publishedAt, 'dd MMM yyyy', { locale: vi })}</span>
                        </>
                      )}
                    </div>
                    <h2 className="font-heading text-2xl leading-tight mb-2 group-hover:text-accent transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm opacity-70 line-clamp-2 leading-relaxed mb-3 flex-1">{post.excerpt}</p>
                    )}
                    <p className="text-sm font-medium text-accent inline-flex items-center gap-1 mt-auto">
                      Đọc tiếp <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.25} />
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
