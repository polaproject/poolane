import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Dumbbell } from 'lucide-react'
import { DIFFICULTY_LABELS, DIFFICULTY_LEVELS } from '@/lib/validations/exercise'
import { COURSE_SKILLS } from '@/config/constants'

type SearchParams = Promise<{ skill?: string; difficulty?: string }>

// Flatten all skills
const ALL_SKILLS = [
  ...COURSE_SKILLS.ECH,
  ...COURSE_SKILLS.SAI,
  ...COURSE_SKILLS.BUOM,
]
const SKILL_LABELS = Object.fromEntries(ALL_SKILLS.map(s => [s.key, s.label]))

export default async function AdminExercisesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['admin', 'staff'])
  const params = await searchParams

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (params.skill) where.skillTarget = params.skill
  if (params.difficulty) where.difficulty = params.difficulty

  const exercises = await prisma.exercise.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { _count: { select: { assignments: true } } }
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl text-[#1C2B4A]">Thư viện bài tập</h1>
          <p className="text-sm text-[#1C2B4A]/50 mt-1">{exercises.length} bài tập</p>
        </div>
        <Link href="/admin/exercises/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg text-sm font-semibold hover:bg-[#1C2B4A]/90">
          <Plus className="w-4 h-4" /> Thêm bài tập
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link href="/admin/exercises"
          className={`px-3 py-1.5 text-xs rounded-full border ${!params.skill && !params.difficulty ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]' : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15'}`}>
          Tất cả
        </Link>
        {DIFFICULTY_LEVELS.map(d => (
          <Link key={d} href={`/admin/exercises?difficulty=${d}`}
            className={`px-3 py-1.5 text-xs rounded-full border ${params.difficulty === d ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]' : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15'}`}>
            {DIFFICULTY_LABELS[d]}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {exercises.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 p-12 text-center">
          <Dumbbell className="w-10 h-10 text-[#1C2B4A]/20 mx-auto mb-3" />
          <p className="text-sm text-[#1C2B4A]/50">Chưa có bài tập nào</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {exercises.map(ex => (
            <Link key={ex.id} href={`/admin/exercises/${ex.id}/edit`}
              className="block bg-white rounded-2xl border border-[#1C2B4A]/8 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h2 className="font-semibold text-[#1C2B4A] flex-1">{ex.title}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  ex.difficulty === 'beginner' ? 'bg-green-50 text-green-700 border-green-200' :
                  ex.difficulty === 'intermediate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {DIFFICULTY_LABELS[ex.difficulty as keyof typeof DIFFICULTY_LABELS] ?? ex.difficulty}
                </span>
              </div>
              <p className="text-xs text-[#5B8E9F] mb-2">#{SKILL_LABELS[ex.skillTarget] ?? ex.skillTarget}</p>
              <p className="text-sm text-[#1C2B4A]/60 line-clamp-2">{ex.description}</p>
              <div className="flex items-center justify-between mt-2 text-xs text-[#1C2B4A]/40">
                <span>{Array.isArray(ex.stepsJson) ? (ex.stepsJson as unknown[]).length : 0} bước</span>
                <span>{ex._count.assignments} HV đã gán</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
