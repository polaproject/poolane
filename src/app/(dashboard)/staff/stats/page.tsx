import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, startOfMonth } from 'date-fns'
import { BarChart2, BookOpen, TrendingUp, GraduationCap, Calendar } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

const SKILL_NAMES: Record<string, string> = {
  body_position: 'Tư thế thân người', leg_kick: 'Đạp chân ếch', arm_pull: 'Kéo tay',
  breathing: 'Thở', glide: 'Lướt nước', coordination: 'Phối hợp',
  turn: 'Quay đầu hồ', endurance: 'Sức bền', flutter_kick: 'Đập chân',
  entry: 'Vào tay', high_elbow_catch: 'High Elbow Catch', arm_recovery: 'Phục hồi tay',
  side_breathing: 'Thở nghiêng', bilateral_breathing: 'Thở 2 bên',
  endurance_speed: 'Sức bền & tốc độ', undulation: 'Sóng người',
  dolphin_kick: 'Đạp chân cá heo', pull: 'Kéo nước', rhythm: 'Nhịp điệu',
  body_rotation: 'Xoay hông', rotation: 'Xoay người',
}

export default async function StaffStatsPage() {
  await requireRole(['admin', 'staff'])

  const now = new Date()
  const monthStart = startOfMonth(now)

  const [
    totalSessions, totalAttendance, totalStudents, activeStudents,
    completedStudents, monthPayments, retentionData, weakSkillsData,
  ] = await Promise.all([
    prisma.classSession.count({ where: { status: 'completed' } }),
    prisma.attendance.count({ where: { status: { in: ['present', 'walk_in'] } } }),
    prisma.student.count(),
    prisma.student.count({ where: { status: { in: ['active', 'extension'] } } }),
    prisma.enrollment.count({ where: { status: 'completed' } }),
    prisma.payment.aggregate({ where: { recordedAt: { gte: monthStart }, isReversal: false, amount: { gt: 0 } }, _sum: { amount: true } }),
    prisma.student.count({ where: { status: { not: 'prospect' } } }),
    prisma.assessmentScore.groupBy({ by: ['skillKey'], _avg: { score: true }, orderBy: { _avg: { score: 'asc' } }, take: 5 }),
  ])

  const retentionRate = retentionData > 0 ? Math.round((activeStudents / retentionData) * 100) : 0
  const avgAttendance = totalSessions > 0 ? Math.round((totalAttendance / totalSessions) * 10) / 10 : 0
  const monthSum = monthPayments._sum.amount ?? 0

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="bg-ink text-paper px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-4xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
            <BarChart2 className="h-3 w-3 text-accent" strokeWidth={1.75} /> Tổng quan hoạt động
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Thống kê giảng dạy</h1>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-4xl mx-auto space-y-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Buổi đã dạy" value={totalSessions} icon={Calendar} />
          <StatCard label="TB HV/buổi" value={avgAttendance} icon={BookOpen} />
          <StatCard label="Giữ chân" value={`${retentionRate}%`} icon={TrendingUp} tone={retentionRate >= 70 ? 'accent' : 'surface'} />
          <StatCard label="Đã tốt nghiệp" value={completedStudents} icon={GraduationCap} tone="dark" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-card-lg bg-white shadow-soft ring-1 ring-ink/8 p-5">
            <p className="eyebrow text-ink/55 mb-4">Phân bố học viên</p>
            <div className="space-y-3">
              {[
                { label: 'Đang học', value: activeStudents, total: totalStudents, bar: 'bg-success' },
                { label: 'Đã tốt nghiệp', value: completedStudents, total: totalStudents, bar: 'bg-accent' },
                { label: 'Tổng enrolled', value: retentionData, total: totalStudents, bar: 'bg-mist' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink/70">{item.label}</span>
                    <span className="font-medium text-ink">{item.value}</span>
                  </div>
                  <div className="h-1.5 bg-ink/8 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.bar}`} style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-card-lg bg-white shadow-soft ring-1 ring-ink/8 p-5">
            <p className="eyebrow text-ink/55 mb-4">Kỹ năng yếu nhất</p>
            {weakSkillsData.length === 0 ? (
              <p className="text-sm text-ink/45">Chưa có dữ liệu đánh giá</p>
            ) : (
              <div className="space-y-3">
                {weakSkillsData.map(sk => {
                  const avg = sk._avg.score ?? 0
                  const tone = avg <= 2.5 ? 'danger' : 'warn'
                  return (
                    <div key={sk.skillKey}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-ink/70">{SKILL_NAMES[sk.skillKey] ?? sk.skillKey}</span>
                        <span className={`font-medium ${tone === 'danger' ? 'text-danger' : 'text-warn'}`}>
                          {avg.toFixed(1)}/5
                        </span>
                      </div>
                      <div className="h-1.5 bg-ink/8 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${tone === 'danger' ? 'bg-danger' : 'bg-warn'}`} style={{ width: `${(avg / 5) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-card-xl bg-ink text-paper p-6 sm:p-7 relative overflow-hidden shadow-soft">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative">
            <p className="eyebrow text-paper/55 mb-2">Thu tháng {format(now, 'MM/yyyy')}</p>
            <p className="font-heading italic text-5xl text-accent leading-none">{fmt(monthSum)}</p>
            <div className="mt-4 flex gap-6 text-sm text-paper/65 flex-wrap">
              <div><span className="text-paper">{totalStudents}</span> tổng HV</div>
              <div><span className="text-paper">{activeStudents}</span> đang học</div>
              <div><span className="text-paper">{totalSessions}</span> buổi đã dạy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
