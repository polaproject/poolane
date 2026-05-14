import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Trophy, Target, Users } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { Chip } from '@/components/ui/Chip'

export default async function StudentChallengesPage() {
  const user = await requireRole(['student'])
  const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })

  const challenges = await prisma.challenge.findMany({
    where: { isActive: true },
    include: {
      progressItems: student ? { where: { studentId: student.id } } : false,
      _count: { select: { progressItems: true } },
    },
    orderBy: { endDate: 'asc' },
  })

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/15 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-3xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2">Thử thách · Cộng đồng</p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Cùng nhau vượt giới hạn</h1>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-3xl mx-auto space-y-3 relative z-10">
        {challenges.length === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <Target className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="font-heading italic text-2xl text-foreground mb-1">Chưa có thử thách</p>
            <p className="text-sm text-foreground/55">Khi admin tạo thử thách tháng, sẽ hiện ở đây.</p>
          </div>
        ) : (
          challenges.map(c => {
            const myProgress = c.progressItems?.[0]
            const current = myProgress?.currentValue ?? 0
            const pct = Math.min(100, Math.round((current / c.goalValue) * 100))
            const daysLeft = Math.max(0, differenceInDays(c.endDate, new Date()))
            const achieved = pct >= 100
            return (
              <div key={c.id} className="glass-card glass-card-hover p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-heading italic text-xl text-foreground leading-tight">{c.name}</h2>
                    <p className="text-xs text-foreground/55 mt-1">
                      Đến {format(c.endDate, 'dd/MM/yyyy')} · còn {daysLeft} ngày
                    </p>
                  </div>
                  <div className="grid place-items-center h-10 w-10 rounded-pill bg-accent/15 shrink-0">
                    <Trophy className="h-5 w-5 text-accent" strokeWidth={1.75} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-foreground/65">{current}/{c.goalValue} {c.unit}</span>
                    <span className={`font-heading italic text-lg ${achieved ? 'text-success' : 'text-foreground'}`}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-ink/8 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${achieved ? 'bg-success' : 'bg-accent'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Chip variant="mist">
                    <Users className="h-3 w-3" strokeWidth={2.25} /> {c._count.progressItems} đang tham gia
                  </Chip>
                  {achieved && <Chip variant="success" active>Đã đạt</Chip>}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
