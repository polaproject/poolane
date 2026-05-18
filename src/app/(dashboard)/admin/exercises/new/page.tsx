import { requireRole } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ExerciseForm } from '../ExerciseForm'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function NewExercisePage() {
  await requireRole(['admin', 'staff'])
  return (
    <div className="ambient-bg min-h-screen">
      <div className="max-w-3xl mx-auto">
        <Link href="/admin/exercises" className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Thư viện bài tập
        </Link>
        <PageHeader
          eyebrow="Thư viện bài tập"
          title="Thêm bài tập mới"
          description="Hướng dẫn từng bước để học viên tự luyện cải thiện kỹ năng."
          display
          className="mb-8"
        />
        <ExerciseForm mode="create" />
      </div>
    </div>
  )
}
