import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Dumbbell } from 'lucide-react'
import { DIFFICULTY_LABELS, DIFFICULTY_LEVELS } from '@/lib/validations/exercise'
import { COURSE_SKILLS } from '@/config/constants'
import { Chip } from '@/components/ui/Chip'

type SearchParams = Promise<{ skill?: string; difficulty?: string }>

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
    include: { _count: { select: { assignments: true } } },
  })

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-6xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2">{exercises.length} bài tập</p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Thư viện bài tập</h1>
          </div>
          <Link
            href="/admin/exercises/new"
            className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2.5 rounded-pill text-sm hover:bg-accent/90 transition shadow-cta"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Thêm bài
          </Link>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-6xl mx-auto space-y-4 relative z-10">
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/exercises">
            <Chip asButton active={!params.skill && !params.difficulty}>Tất cả</Chip>
          </Link>
          {DIFFICULTY_LEVELS.map(d => (
            <Link key={d} href={`/admin/exercises?difficulty=${d}`}>
              <Chip asButton active={params.difficulty === d}>{DIFFICULTY_LABELS[d]}</Chip>
            </Link>
          ))}
        </div>

        {exercises.length === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <Dumbbell className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">Chưa có bài tập</p>
            <p className="text-sm text-foreground/55">Thêm bài tập đầu tiên qua nút phía trên.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {exercises.map(ex => (
              <Link
                key={ex.id}
                href={`/admin/exercises/${ex.id}/edit`}
                className="block glass-card glass-card-hover p-5 hover:-translate-y-0.5 hover:ring-accent/30 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-medium text-foreground flex-1 leading-tight">{ex.title}</h2>
                  <Chip variant={DIFF_VARIANT[ex.difficulty] ?? 'mist'} active className="shrink-0">
                    {DIFFICULTY_LABELS[ex.difficulty as keyof typeof DIFFICULTY_LABELS] ?? ex.difficulty}
                  </Chip>
                </div>
                <Chip variant="mist" className="mb-3">#{SKILL_LABELS[ex.skillTarget] ?? ex.skillTarget}</Chip>
                <p className="text-sm text-foreground/65 line-clamp-2 leading-relaxed">{ex.description}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-foreground/45">
                  <span>{Array.isArray(ex.stepsJson) ? (ex.stepsJson as unknown[]).length : 0} bước</span>
                  <span>{ex._count.assignments} HV đã gán</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
