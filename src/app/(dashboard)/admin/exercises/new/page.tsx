import { requireRole } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ExerciseForm } from '../ExerciseForm'

export default async function NewExercisePage() {
  await requireRole(['admin', 'staff'])
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/admin/exercises" className="inline-flex items-center gap-1 text-sm text-[#1C2B4A]/70 hover:text-[#1C2B4A] mb-6">
        <ArrowLeft className="w-4 h-4" /> Thư viện bài tập
      </Link>
      <h1 className="font-heading text-3xl text-[#1C2B4A] mb-6">Thêm bài tập mới</h1>
      <ExerciseForm mode="create" />
    </div>
  )
}
