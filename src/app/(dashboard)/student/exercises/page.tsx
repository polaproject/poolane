import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Dumbbell, Video } from 'lucide-react'
import { DIFFICULTY_LABELS, DIFFICULTY_LEVELS } from '@/lib/validations/exercise'
import { COURSE_SKILLS } from '@/config/constants'

type SearchParams = Promise<{ difficulty?: string; skill?: string }>

const ALL_SKILLS = [
  ...COURSE_SKILLS.ECH,
  ...COURSE_SKILLS.SAI,
  ...COURSE_SKILLS.BUOM,
]
const SKILL_LABELS = Object.fromEntries(ALL_SKILLS.map(s => [s.key, s.label]))

export default async function StudentExercisesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['student'])
  const params = await searchParams

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { isPublished: true }
  if (params.difficulty) where.difficulty = params.difficulty
  if (params.skill) where.skillTarget = params.skill

  const exercises = await prisma.exercise.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <h1 className="font-heading text-2xl text-[#F6F1EA]">Thư viện bài tập</h1>
        <p className="text-[#F6F1EA]/50 text-xs mt-1">Bài tập bơi chuẩn hoá từ Poolane 🏊</p>
        <Link href="/student/exercises/my"
          className="inline-block mt-3 px-3 py-1.5 bg-[#C8A84B] text-[#1C2B4A] rounded-lg text-xs font-semibold">
          📋 Bài tập của tôi
        </Link>
      </div>

      <div className="px-4 -mt-4 max-w-3xl mx-auto">
        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Link href="/student/exercises"
            className={`px-3 py-1.5 text-xs rounded-full border ${!params.difficulty ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]' : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15'}`}>
            Tất cả
          </Link>
          {DIFFICULTY_LEVELS.map(d => (
            <Link key={d} href={`/student/exercises?difficulty=${d}`}
              className={`px-3 py-1.5 text-xs rounded-full border ${params.difficulty === d ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]' : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15'}`}>
              {DIFFICULTY_LABELS[d]}
            </Link>
          ))}
        </div>

        {exercises.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <Dumbbell className="w-10 h-10 text-[#1C2B4A]/20 mx-auto mb-3" />
            <p className="text-sm text-[#1C2B4A]/50">Chưa có bài tập nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map(ex => (
              <details key={ex.id} className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 overflow-hidden group">
                <summary className="cursor-pointer px-5 py-4 list-none flex items-center justify-between hover:bg-[#F6F1EA]/30">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#1C2B4A]">{ex.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#5B8E9F]">#{SKILL_LABELS[ex.skillTarget] ?? ex.skillTarget}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        ex.difficulty === 'beginner' ? 'bg-green-50 text-green-700 border-green-200' :
                        ex.difficulty === 'intermediate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {DIFFICULTY_LABELS[ex.difficulty as keyof typeof DIFFICULTY_LABELS] ?? ex.difficulty}
                      </span>
                    </div>
                  </div>
                  <span className="text-[#1C2B4A]/40 group-open:rotate-45 transition-transform text-2xl ml-3">+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-[#1C2B4A]/70 space-y-3">
                  <p>{ex.description}</p>
                  {ex.videoUrl && (
                    <a href={ex.videoUrl} target="_blank" rel="noopener"
                      className="inline-flex items-center gap-1.5 text-[#5B8E9F] hover:underline text-xs font-semibold">
                      <Video className="w-3.5 h-3.5" /> Xem video minh hoạ
                    </a>
                  )}
                  {Array.isArray(ex.stepsJson) && ex.stepsJson.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">Các bước</p>
                      <ol className="space-y-1 list-decimal pl-5">
                        {(ex.stepsJson as string[]).map((step, i) => <li key={i}>{step}</li>)}
                      </ol>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
