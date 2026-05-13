import { requireRole } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BlogForm } from '../BlogForm'

export default async function NewBlogPostPage() {
  await requireRole(['admin', 'staff'])
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/admin/blog" className="inline-flex items-center gap-1 text-sm text-[#1C2B4A]/70 hover:text-[#1C2B4A] mb-6">
        <ArrowLeft className="w-4 h-4" /> Danh sách blog
      </Link>
      <h1 className="font-heading text-3xl text-[#1C2B4A] mb-6">Viết bài mới</h1>
      <BlogForm mode="create" />
    </div>
  )
}
