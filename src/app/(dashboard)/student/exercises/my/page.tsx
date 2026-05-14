import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Dumbbell, CheckCircle2, Clock } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { vi } from 'date-fns/locale'
import { AssignmentActions } from './AssignmentActions'

export default async function MyExercisesPage() {
  const user = await requireRole(['student'])
  const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })
  if (!student) return <div className="p-6 text-center text-[#1C2B4A]/40">Không tìm thấy hồ sơ</div>

  const items = await prisma.exerciseAssignment.findMany({
    where: { studentId: student.id },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: { exercise: true },
    take: 50,
  })

  const active = items.filter(i => i.status === 'assigned')
  const done = items.filter(i => i.status !== 'assigned')

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <h1 className="font-heading text-2xl text-[#F6F1EA]">Bài tập của tôi</h1>
        <p className="text-[#F6F1EA]/50 text-xs mt-1">
          {active.length} bài đang chờ · {done.length} đã hoàn tất
        </p>
      </div>

      <div className="px-4 -mt-4 max-w-2xl mx-auto space-y-4">
        {active.length === 0 && done.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <Dumbbell className="w-10 h-10 text-[#1C2B4A]/20 mx-auto mb-3" />
            <p className="text-sm text-[#1C2B4A]/50">Lớp chưa gán bài tập nào</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <Section title="Cần làm">
                {active.map(a => <AssignmentRow key={a.id} a={a} canAct />)}
              </Section>
            )}
            {done.length > 0 && (
              <Section title="Đã hoàn tất">
                {done.map(a => <AssignmentRow key={a.id} a={a} />)}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-2">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AssignmentRow({ a, canAct }: { a: any; canAct?: boolean }) {
  const overdue = a.dueDate && a.status === 'assigned' && isPast(a.dueDate)
  return (
    <div className={`bg-white rounded-2xl shadow-sm border p-4 ${
      a.status === 'completed' ? 'border-green-200 opacity-90' :
      a.status === 'skipped' ? 'border-gray-200 opacity-60' :
      overdue ? 'border-red-300' : 'border-[#1C2B4A]/8'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-[#1C2B4A]">{a.exercise.title}</h3>
        {a.status === 'completed' ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Đã làm
          </span>
        ) : a.status === 'skipped' ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">Bỏ qua</span>
        ) : (
          <span className={`text-xs px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
            overdue ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <Clock className="w-3 h-3" /> {overdue ? 'Quá hạn' : 'Cần làm'}
          </span>
        )}
      </div>
      <p className="text-sm text-[#1C2B4A]/60 mb-2">{a.exercise.description}</p>
      {a.dueDate && (
        <p className="text-xs text-[#1C2B4A]/50">
          Hạn: {format(a.dueDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
        </p>
      )}
      {a.exercise.videoUrl && (
        <a href={a.exercise.videoUrl} target="_blank" rel="noopener"
          className="text-xs text-[#5B8E9F] hover:underline mt-2 inline-block">
          📹 Xem video minh hoạ →
        </a>
      )}
      {Array.isArray(a.exercise.stepsJson) && a.exercise.stepsJson.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs font-semibold text-[#5B8E9F] cursor-pointer">
            Xem {a.exercise.stepsJson.length} bước thực hiện
          </summary>
          <ol className="mt-2 space-y-1 text-xs text-[#1C2B4A]/70 list-decimal pl-5">
            {(a.exercise.stepsJson as string[]).map((step: string, i: number) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </details>
      )}
      {canAct && <AssignmentActions id={a.id} />}
    </div>
  )
}
