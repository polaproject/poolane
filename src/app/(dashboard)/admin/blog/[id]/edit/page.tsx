import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BlogForm } from '../../BlogForm'

type Params = { params: Promise<{ id: string }> }

export default async function EditBlogPostPage({ params }: Params) {
  await requireRole(['admin', 'staff'])
  const { id } = await params
  const post = await prisma.blogPost.findUnique({ where: { id } })
  if (!post) notFound()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/admin/blog" className="inline-flex items-center gap-1 text-sm text-[#1C2B4A]/70 hover:text-[#1C2B4A] mb-6">
        <ArrowLeft className="w-4 h-4" /> Danh sách blog
      </Link>
      <h1 className="font-heading text-3xl text-[#1C2B4A] mb-6">Sửa bài viết</h1>
      <BlogForm mode="edit" initial={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        category: post.category,
        excerpt: post.excerpt ?? '',
        content: post.content,
        status: post.status,
        scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString().slice(0, 16) : '',
      }} />
    </div>
  )
}
