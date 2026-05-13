import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { PublicHeader, PublicFooter } from '@/components/layouts/PublicHeader'

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params) {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, coverImageUrl: true }
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
    where: { slug, status: 'published' }
  })

  if (!post) notFound()

  // Increment view count
  await prisma.blogPost.update({ where: { slug }, data: { viewCount: { increment: 1 } } })

  return (
    <div className="min-h-screen bg-[#F6F1EA]">
      <PublicHeader />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/blog" className="text-sm text-[#5B8E9F] hover:underline mb-6 block">
          ← Về Blog
        </Link>

        {post.coverImageUrl && (
          <div className="aspect-[16/9] mb-6 rounded-2xl overflow-hidden bg-[#1C2B4A]/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {post.publishedAt && (
          <p className="text-xs text-[#1C2B4A]/40 uppercase tracking-wider mb-3">
            {format(post.publishedAt, 'dd MMMM yyyy', { locale: vi })}
          </p>
        )}

        <h1 className="font-heading text-3xl text-[#1C2B4A] leading-tight mb-6">{post.title}</h1>

        {post.excerpt && (
          <p className="text-lg text-[#1C2B4A]/70 leading-relaxed mb-8 pb-8 border-b border-[#1C2B4A]/10">
            {post.excerpt}
          </p>
        )}

        {/* Render content as simple paragraphs */}
        <div className="prose prose-sm max-w-none text-[#1C2B4A]/80 leading-relaxed">
          {post.content.split('\n').map((para, i) => (
            para.trim() ? <p key={i} className="mb-4">{para}</p> : <br key={i} />
          ))}
        </div>

      </div>
      <PublicFooter />
    </div>
  )
}
