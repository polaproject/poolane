import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Users, TrendingUp, Award } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { StatCard } from '@/components/ui/StatCard'

export default async function TeacherMetricsPage() {
  await requireRole(['admin'])

  const now = new Date()
  // eslint-disable-next-line react-hooks/purity
  const monthAgo = new Date(now.getTime() - 30 * 86400000)

  const teachers = await prisma.user.findMany({
    where: { role: { in: ['admin', 'staff'] }, isActive: true },
    select: { id: true, fullName: true, role: true },
  })

  const metricsArr = await Promise.all(teachers.map(async t => {
    const [assessments, attendanceMarked, lessonsPlanned] = await Promise.all([
      prisma.assessment.findMany({ where: { assessorId: t.id, assessmentDate: { gte: monthAgo } }, include: { scores: true } }),
      prisma.attendance.count({ where: { markedBy: t.id, markedAt: { gte: monthAgo } } }),
      prisma.lessonPlan.count({ where: { createdBy: t.id, createdAt: { gte: monthAgo } } }),
    ])

    const allScores = assessments.flatMap(a => a.scores.map(s => s.score))
    const avgScore = allScores.length > 0 ? allScores.reduce((s, x) => s + x, 0) / allScores.length : null
    const uniqueStudents = new Set(assessments.map(a => a.studentId))

    return { teacher: t, assessmentsCount: assessments.length, studentsAssessed: uniqueStudents.size, attendanceMarked, lessonsPlanned, avgScore }
  }))

  const metrics = metricsArr.sort((a, b) => (b.assessmentsCount + b.attendanceMarked) - (a.assessmentsCount + a.attendanceMarked))

  const studentImprovements = await prisma.$queryRaw<Array<{ student_id: string; first_avg: number; last_avg: number }>>`
    SELECT
      a.student_id,
      AVG(CASE WHEN a.session_number = 1 THEN s.score END) as first_avg,
      AVG(CASE WHEN a.session_number >= 7 THEN s.score END) as last_avg
    FROM assessments a
    JOIN assessment_scores s ON s.assessment_id = a.id
    GROUP BY a.student_id
    HAVING AVG(CASE WHEN a.session_number = 1 THEN s.score END) IS NOT NULL
       AND AVG(CASE WHEN a.session_number >= 7 THEN s.score END) IS NOT NULL
    LIMIT 50
  `

  const avgImprovement = studentImprovements.length > 0
    ? studentImprovements.reduce((sum, x) => sum + (Number(x.last_avg) - Number(x.first_avg)), 0) / studentImprovements.length
    : null

  const totalStudents = await prisma.student.count({ where: { status: { in: ['active', 'extension'] } } })
  const activeRecent = await prisma.student.count({
    where: { status: { in: ['active', 'extension'] }, lastAttendedAt: { gte: monthAgo } },
  })
  const retentionRate = totalStudents > 0 ? (activeRecent / totalStudents) * 100 : 0

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="bg-ink text-paper px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-5xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2">30 ngày · cập nhật {format(now, 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Hiệu quả giảng dạy</h1>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-5xl mx-auto space-y-4 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Retention rate" value={`${retentionRate.toFixed(0)}%`} trendLabel={`${activeRecent}/${totalStudents} HV active`} icon={Users} />
          <StatCard label="Tiến bộ TB" value={avgImprovement != null ? `+${avgImprovement.toFixed(2)}` : '—'} trendLabel={`điểm/HV (${studentImprovements.length} đo)`} icon={TrendingUp} tone="accent" />
          <StatCard label="Buổi đã chấm" value={metrics.reduce((s, m) => s + m.attendanceMarked, 0)} trendLabel="30 ngày qua" icon={Award} tone="dark" />
        </div>

        <div className="rounded-card-lg bg-white shadow-soft ring-1 ring-ink/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-ink/8 flex items-center gap-2">
            <Award className="h-4 w-4 text-accent" strokeWidth={1.75} />
            <p className="eyebrow text-ink/55">Theo giáo viên</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-paper-tint/30 border-b border-ink/8">
                <tr>
                  <th className="text-left px-5 py-3 eyebrow text-ink/55">Giáo viên</th>
                  <th className="text-right px-5 py-3 eyebrow text-ink/55">Đánh giá</th>
                  <th className="text-right px-5 py-3 eyebrow text-ink/55">HV chấm</th>
                  <th className="text-right px-5 py-3 eyebrow text-ink/55">Điểm danh</th>
                  <th className="text-right px-5 py-3 eyebrow text-ink/55">Lesson plan</th>
                  <th className="text-right px-5 py-3 eyebrow text-ink/55">Điểm TB</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map(m => {
                  const tone = m.avgScore == null ? '' : m.avgScore >= 4 ? 'text-success' : m.avgScore >= 3 ? 'text-warn' : 'text-danger'
                  return (
                    <tr key={m.teacher.id} className="border-b border-ink/5 last:border-b-0 hover:bg-paper-tint/20 transition">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-ink">{m.teacher.fullName}</p>
                        <p className="text-xs text-ink/45 capitalize">
                          {m.teacher.role === 'admin' ? 'Quản trị' : 'Trợ lý'}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-ink">{m.assessmentsCount}</td>
                      <td className="px-5 py-3 text-right text-sm text-ink">{m.studentsAssessed}</td>
                      <td className="px-5 py-3 text-right text-sm text-ink">{m.attendanceMarked}</td>
                      <td className="px-5 py-3 text-right text-sm text-ink">{m.lessonsPlanned}</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold">
                        {m.avgScore != null
                          ? <span className={tone}>{m.avgScore.toFixed(1)}/5</span>
                          : <span className="text-ink/30">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-ink/55 max-w-2xl">
          Retention = % HV active có buổi học trong 30 ngày. Tiến bộ = chênh lệch điểm TB giữa buổi 1 và buổi 7+.
        </p>
      </div>
    </div>
  )
}
