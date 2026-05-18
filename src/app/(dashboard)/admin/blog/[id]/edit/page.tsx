import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BlogForm } from '../../BlogForm'
import { PageHeader } from '@/components/ui/PageHeader'

type Params = { params: Promise<{ id: string }> }

export default async function EditBlogPostPage({ params }: Params) {
  await requireRole(['admin', 'staff'])
  const { id } = await params
  const post = await prisma.blogPost.findUnique({ where: { id } })
  if (!post) notFound()

  return (
    <div className="ambient-bg min-h-screen">
      <div className="p-4 pr-[5rem] sm:p-6 sm:pr-6 max-w-4xl mx-auto">
        <Link href="/admin/blog" className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Danh sách blog
        </Link>
        <PageHeader
          eyebrow="Nội dung"
          title="Sửa bài viết"
          description={post.title}
          display
          className="mb-8"
        />
        <BlogForm mode="edit" initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          category: post.category,
          excerpt: post.excerpt ?? '',
          content: post.content,
          status: post.status,
          scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString().slice(0, 16) : '',
          coverImageUrl: post.coverImageUrl ?? '',
        }} />
      </div>
    </div>
  )
}
