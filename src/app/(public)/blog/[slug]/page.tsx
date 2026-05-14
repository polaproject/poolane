import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ArrowLeft, BookOpen } from 'lucide-react'

type Params = { params: Promise<{ slug: string }> }

const CATEGORY_LABEL: Record<string, string> = {
  technique: 'Kỹ thuật',
  safety: 'An toàn',
  nutrition: 'Dinh dưỡng',
  student_story: 'Câu chuyện',
  news: 'Tin tức',
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, coverImageUrl: true },
  })
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt ?? 'Bài viết từ Poolane',
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
      type: 'article',
    },
  }
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params

  const post = await prisma.blogPost.findUnique({
    where: { slug, status: 'published' },
  })

  if (!post) notFound()

  await prisma.blogPost.update({ where: { slug }, data: { viewCount: { increment: 1 } } })

  const paragraphs = post.content.split('\n').filter((p) => p.trim())

  return (
    <article className="mx-auto max-w-2xl px-4 pt-12 pb-20">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm opacity-70 hover:opacity-100 transition mb-8 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
        Về Blog
      </Link>

      {/* Cover image */}
      {post.coverImageUrl ? (
        <div className="aspect-[16/9] mb-8 rounded-card-xl overflow-hidden ring-1 ring-current/10 bg-current/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-[16/9] mb-8 rounded-card-xl bg-gradient-to-br from-accent/20 to-mist/20 grid place-items-center">
          <BookOpen className="h-12 w-12 text-accent opacity-50" strokeWidth={1.5} />
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-2 text-xs opacity-60 mb-4">
        <span className="tracking-widest uppercase font-medium text-accent">
          {CATEGORY_LABEL[post.category] ?? post.category}
        </span>
        {post.publishedAt && (
          <>
            <span className="opacity-40">·</span>
            <span>{format(post.publishedAt, 'dd MMMM yyyy', { locale: vi })}</span>
          </>
        )}
        {post.viewCount > 0 && (
          <>
            <span className="opacity-40">·</span>
            <span>{post.viewCount} lượt đọc</span>
          </>
        )}
      </div>

      {/* Title */}
      <h1 className="font-heading italic text-4xl sm:text-5xl leading-[1.1] tracking-tight mb-6">
        {post.title}
      </h1>

      {/* Excerpt as pull-quote */}
      {post.excerpt && (
        <p className="text-lg sm:text-xl opacity-80 leading-relaxed font-light mb-8 pb-8 border-b border-current/10">
          {post.excerpt}
        </p>
      )}

      {/* Body — first paragraph drop cap */}
      <div className="space-y-5 text-base sm:text-lg leading-[1.75] opacity-90">
        {paragraphs.map((para, i) => (
          <p key={i} className={i === 0 ? 'first-letter:font-heading first-letter:italic first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-accent first-letter:mt-1' : ''}>
            {para}
          </p>
        ))}
      </div>

      {/* Footer back-link */}
      <div className="mt-12 pt-8 border-t border-current/10 flex items-center justify-between text-sm">
        <Link href="/blog" className="inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 transition group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
          Tất cả bài viết
        </Link>
        <Link href="/register" className="inline-flex items-center gap-1.5 font-medium text-accent hover:opacity-80 transition">
          Đăng ký học bơi →
        </Link>
      </div>
    </article>
  )
}
