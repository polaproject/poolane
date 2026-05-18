import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Dumbbell, CheckCircle2, Clock, Video, ArrowLeft, XCircle } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { vi } from 'date-fns/locale'
import Link from 'next/link'
import { Chip } from '@/components/ui/Chip'
import { AssignmentActions } from './AssignmentActions'

export default async function MyExercisesPage() {
  const user = await requireRole(['student'])
  const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })
  if (!student) return <div className="p-8 text-center text-foreground/55">Không tìm thấy hồ sơ</div>

  const items = await prisma.exerciseAssignment.findMany({
    where: { studentId: student.id },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: { exercise: true },
    take: 50,
  })

  const active = items.filter(i => i.status === 'assigned')
  const done = items.filter(i => i.status !== 'assigned')

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-3xl mx-auto">
          <Link
            href="/student/exercises"
            className="inline-flex items-center gap-1.5 text-sm text-paper/65 hover:text-paper transition mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
            Thư viện bài tập
          </Link>
          <p className="eyebrow text-paper/55 mb-2">
            {active.length} cần làm · {done.length} đã xong
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Bài của tôi</h1>
        </div>
      </div>

      <div className="px-5 sm:px-8 -mt-6 max-w-3xl mx-auto space-y-6 relative z-10">
        {active.length === 0 && done.length === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <Dumbbell className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">Chưa được gán bài</p>
            <p className="text-sm text-foreground/55">Lớp sẽ gán bài tập sau khi đánh giá kỹ năng.</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section>
                <p className="eyebrow text-accent mb-3">Cần làm</p>
                <div className="space-y-3">
                  {active.map(a => <AssignmentCard key={a.id} a={a} canAct />)}
                </div>
              </section>
            )}
            {done.length > 0 && (
              <section>
                <p className="eyebrow text-foreground/55 mb-3">Đã hoàn tất</p>
                <div className="space-y-3">
                  {done.map(a => <AssignmentCard key={a.id} a={a} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AssignmentCard({ a, canAct }: { a: any; canAct?: boolean }) {
  const overdue = a.dueDate && a.status === 'assigned' && isPast(a.dueDate)
  const isDone = a.status === 'completed'
  const isSkipped = a.status === 'skipped'

  return (
    <div className={`rounded-card-lg bg-[var(--surface)] shadow-soft p-5 transition ring-1 ${
      isDone ? 'ring-success/30' :
      isSkipped ? 'ring-foreground/8 opacity-60' :
      overdue ? 'ring-danger/40' : 'ring-foreground/8'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="lqg-headline text-xl text-foreground leading-tight flex-1 min-w-0">{a.exercise.title}</h3>
        {isDone ? (
          <Chip variant="success" active><CheckCircle2 className="h-3 w-3" strokeWidth={2.25} /> Đã làm</Chip>
        ) : isSkipped ? (
          <Chip variant="neutral">Bỏ qua</Chip>
        ) : overdue ? (
          <Chip variant="danger" active><Clock className="h-3 w-3" strokeWidth={2.25} /> Quá hạn</Chip>
        ) : (
          <Chip variant="warn" active><Clock className="h-3 w-3" strokeWidth={2.25} /> Cần làm</Chip>
        )}
      </div>
      <p className="text-sm text-foreground/70 leading-relaxed mb-3">{a.exercise.description}</p>
      <div className="flex items-center gap-3 flex-wrap mb-3 text-xs">
        {a.dueDate && (
          <span className={`inline-flex items-center gap-1 ${overdue ? 'text-danger' : 'text-foreground/55'}`}>
            <Clock className="h-3 w-3" strokeWidth={1.75} /> Hạn {format(a.dueDate, 'dd/MM/yyyy', { locale: vi })}
          </span>
        )}
        {a.exercise.videoUrl && (
          <a
            href={a.exercise.videoUrl}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 text-accent hover:underline font-medium"
          >
            <Video className="h-3 w-3" strokeWidth={1.75} /> Video minh hoạ
          </a>
        )}
      </div>
      {Array.isArray(a.exercise.stepsJson) && a.exercise.stepsJson.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none text-xs font-medium text-accent inline-flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            {a.exercise.stepsJson.length} bước thực hiện
          </summary>
          <ol className="mt-2 space-y-1 text-sm text-foreground/75 list-decimal pl-5 marker:text-accent">
            {(a.exercise.stepsJson as string[]).map((step: string, i: number) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </details>
      )}
      {canAct && <div className="mt-3 pt-3 border-t border-foreground/8"><AssignmentActions id={a.id} /></div>}
      {isSkipped && (
        <p className="mt-2 text-xs text-foreground/45 inline-flex items-center gap-1">
          <XCircle className="h-3 w-3" strokeWidth={1.75} /> Đã bỏ qua
        </p>
      )}
    </div>
  )
}
