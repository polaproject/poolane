import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Dumbbell, Video, ArrowRight, Plus } from 'lucide-react'
import { DIFFICULTY_LABELS, DIFFICULTY_LEVELS } from '@/lib/validations/exercise'
import { COURSE_SKILLS } from '@/config/constants'
import { Chip } from '@/components/ui/Chip'

type SearchParams = Promise<{ difficulty?: string; skill?: string }>

const ALL_SKILLS = [
  ...COURSE_SKILLS.ECH,
  ...COURSE_SKILLS.SAI,
  ...COURSE_SKILLS.BUOM,
]
const SKILL_LABELS = Object.fromEntries(ALL_SKILLS.map(s => [s.key, s.label]))

const DIFF_VARIANT: Record<string, 'success' | 'warn' | 'danger'> = {
  beginner: 'success',
  intermediate: 'warn',
  advanced: 'danger',
}

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
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-3xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2">Thư viện · {exercises.length} bài</p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Bài tập</h1>
            <p className="text-sm text-paper/65 mt-2">Bài tập bơi chuẩn hoá từ Poolane.</p>
          </div>
          <Link
            href="/student/exercises/my"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-pill bg-accent text-ink text-sm font-semibold hover:bg-accent/90 transition shadow-cta"
          >
            Bài của tôi <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      <div className="pl-5 pr-[5rem] sm:px-8 -mt-6 max-w-3xl mx-auto space-y-4 relative z-10">
        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          <Link href="/student/exercises">
            <Chip active={!params.difficulty}>Tất cả</Chip>
          </Link>
          {DIFFICULTY_LEVELS.map(d => (
            <Link key={d} href={`/student/exercises?difficulty=${d}`}>
              <Chip active={params.difficulty === d}>{DIFFICULTY_LABELS[d]}</Chip>
            </Link>
          ))}
        </div>

        {exercises.length === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <Dumbbell className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">Chưa có bài tập</p>
            <p className="text-sm text-foreground/55">Thư viện đang được cập nhật.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map(ex => (
              <details
                key={ex.id}
                className="group glass-card glass-card-hover overflow-hidden transition open:ring-accent/30"
              >
                <summary className="cursor-pointer list-none px-5 py-4 flex items-start gap-3 hover:bg-paper-tint/40 transition">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground leading-tight">{ex.title}</h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Chip variant="mist">#{SKILL_LABELS[ex.skillTarget] ?? ex.skillTarget}</Chip>
                      <Chip variant={DIFF_VARIANT[ex.difficulty] ?? 'mist'} active>
                        {DIFFICULTY_LABELS[ex.difficulty as keyof typeof DIFFICULTY_LABELS] ?? ex.difficulty}
                      </Chip>
                    </div>
                  </div>
                  <span className="grid place-items-center h-7 w-7 rounded-pill bg-ink/5 group-open:bg-accent group-open:text-foreground shrink-0 transition">
                    <Plus className="h-4 w-4 group-open:rotate-45 transition-transform" strokeWidth={2.25} />
                  </span>
                </summary>
                <div className="px-5 pb-5 text-sm text-foreground/75 space-y-3 border-t border-foreground/8 pt-4">
                  <p className="leading-relaxed">{ex.description}</p>
                  {ex.videoUrl && (
                    <a
                      href={ex.videoUrl}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1.5 text-accent hover:underline text-sm font-medium"
                    >
                      <Video className="h-4 w-4" strokeWidth={1.75} /> Xem video minh hoạ
                    </a>
                  )}
                  {Array.isArray(ex.stepsJson) && ex.stepsJson.length > 0 && (
                    <div>
                      <p className="eyebrow text-foreground/55 mb-2">Các bước</p>
                      <ol className="space-y-1.5 list-decimal pl-5 marker:text-accent marker:font-bold">
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
