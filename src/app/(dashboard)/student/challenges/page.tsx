import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Trophy, Target } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

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
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <h1 className="font-heading text-2xl text-[#F6F1EA]">Thử thách</h1>
        <p className="text-[#F6F1EA]/50 text-xs mt-1">Cùng nhau vượt giới hạn 🏆</p>
      </div>

      <div className="px-4 -mt-4 max-w-2xl mx-auto space-y-3">
        {challenges.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <Target className="w-10 h-10 text-[#1C2B4A]/20 mx-auto mb-3" />
            <p className="text-sm text-[#1C2B4A]/50">Chưa có thử thách nào đang hoạt động</p>
          </div>
        ) : (
          challenges.map(c => {
            const myProgress = c.progressItems?.[0]
            const current = myProgress?.currentValue ?? 0
            const pct = Math.min(100, Math.round((current / c.goalValue) * 100))
            const daysLeft = Math.max(0, differenceInDays(c.endDate, new Date()))
            return (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="font-semibold text-[#1C2B4A]">{c.name}</h2>
                    <p className="text-xs text-[#1C2B4A]/50">
                      Đến {format(c.endDate, 'dd/MM/yyyy')} · còn {daysLeft} ngày
                    </p>
                  </div>
                  <Trophy className="w-5 h-5 text-[#C8A84B]" />
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#1C2B4A]/60">{current}/{c.goalValue} {c.unit}</span>
                    <span className="font-semibold text-[#1C2B4A]">{pct}%</span>
                  </div>
                  <div className="h-2 bg-[#1C2B4A]/8 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : 'bg-[#5B8E9F]'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <p className="text-xs text-[#1C2B4A]/40 mt-2">
                  👥 {c._count.progressItems} người đang tham gia
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
