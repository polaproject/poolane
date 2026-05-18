import { requireRole } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BlogForm } from '../BlogForm'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function NewBlogPostPage() {
  await requireRole(['admin', 'staff'])
  return (
    <div className="ambient-bg min-h-screen">
      <div className="p-5 sm:p-6 max-w-4xl mx-auto">
        <Link href="/admin/blog" className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Danh sách blog
        </Link>
        <PageHeader
          eyebrow="Nội dung"
          title="Viết bài mới"
          description="Soạn bài chia sẻ kỹ thuật, an toàn hoặc câu chuyện học viên."
          display
          className="mb-8"
        />
        <BlogForm mode="create" />
      </div>
    </div>
  )
}
