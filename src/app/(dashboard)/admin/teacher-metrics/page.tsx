import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Users, TrendingUp, Calendar, Award } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default async function TeacherMetricsPage() {
  await requireRole(['admin'])

  const now = new Date()
  const monthAgo = new Date(now.getTime() - 30 * 86400000)

  // Aggregate metrics across all teachers (assessor + attendance marker)
  const teachers = await prisma.user.findMany({
    where: { role: { in: ['admin', 'staff'] }, isActive: true },
    select: { id: true, fullName: true, role: true }
  })

  // For each teacher, calculate metrics
  const metricsArr = await Promise.all(teachers.map(async t => {
    const [assessments, attendanceMarked, lessonsPlanned] = await Promise.all([
      prisma.assessment.findMany({
        where: { assessorId: t.id, assessmentDate: { gte: monthAgo } },
        include: { scores: true },
      }),
      prisma.attendance.count({ where: { markedBy: t.id, markedAt: { gte: monthAgo } } }),
      prisma.lessonPlan.count({ where: { createdBy: t.id, createdAt: { gte: monthAgo } } }),
    ])

    // Avg score this month
    const allScores = assessments.flatMap(a => a.scores.map(s => s.score))
    const avgScore = allScores.length > 0 ? allScores.reduce((s, x) => s + x, 0) / allScores.length : null

    // Students assessed this month
    const uniqueStudents = new Set(assessments.map(a => a.studentId))

    return {
      teacher: t,
      assessmentsCount: assessments.length,
      studentsAssessed: uniqueStudents.size,
      attendanceMarked,
      lessonsPlanned,
      avgScore,
    }
  }))

  // Sort by activity (assessments + attendance)
  const metrics = metricsArr.sort((a, b) => (b.assessmentsCount + b.attendanceMarked) - (a.assessmentsCount + a.attendanceMarked))

  // Skill improvement: compare buổi 1 vs buổi 9 (toàn lớp)
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

  // Retention: HV active 30 ngày qua / tổng HV
  const totalStudents = await prisma.student.count({ where: { status: { in: ['active', 'extension'] } } })
  const activeRecent = await prisma.student.count({
    where: {
      status: { in: ['active', 'extension'] },
      lastAttendedAt: { gte: monthAgo },
    }
  })
  const retentionRate = totalStudents > 0 ? (activeRecent / totalStudents) * 100 : 0

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Hiệu quả giảng dạy</h1>
        <p className="text-sm text-[#1C2B4A]/50 mt-1">
          Số liệu 30 ngày gần nhất · cập nhật {format(now, 'dd/MM/yyyy HH:mm', { locale: vi })}
        </p>
      </div>

      {/* Class-wide metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={Users}
          label="Retention rate"
          value={`${retentionRate.toFixed(0)}%`}
          subtext={`${activeRecent}/${totalStudents} HV active`}
          color="#5B8E9F"
        />
        <MetricCard
          icon={TrendingUp}
          label="Tiến bộ trung bình"
          value={avgImprovement != null ? `+${avgImprovement.toFixed(2)}` : '—'}
          subtext={`điểm/HV (${studentImprovements.length} HV đo)`}
          color="#22c55e"
        />
        <MetricCard
          icon={Award}
          label="Buổi đã hoàn tất"
          value={String(metrics.reduce((s, m) => s + m.attendanceMarked, 0))}
          subtext="30 ngày qua"
          color="#C8A84B"
        />
      </div>

      {/* Per-teacher table */}
      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[#1C2B4A]/8">
          <h2 className="font-semibold text-[#1C2B4A]">Theo giáo viên</h2>
        </div>
        <div className="overflow-x-auto">

        <table className="w-full min-w-[640px]">
          <thead className="bg-[#F6F1EA]/40">
            <tr className="text-left text-xs uppercase tracking-wider text-[#1C2B4A]/50">
              <th className="px-5 py-3">Giáo viên</th>
              <th className="px-5 py-3 text-right">Đánh giá</th>
              <th className="px-5 py-3 text-right">HV đã chấm</th>
              <th className="px-5 py-3 text-right">Điểm danh</th>
              <th className="px-5 py-3 text-right">Lesson plan</th>
              <th className="px-5 py-3 text-right">Điểm TB chấm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2B4A]/5">
            {metrics.map(m => (
              <tr key={m.teacher.id}>
                <td className="px-5 py-3">
                  <p className="font-semibold text-sm text-[#1C2B4A]">{m.teacher.fullName}</p>
                  <p className="text-xs text-[#1C2B4A]/40 capitalize">
                    {m.teacher.role === 'admin' ? 'Quản trị' : 'Trợ lý'}
                  </p>
                </td>
                <td className="px-5 py-3 text-right text-sm text-[#1C2B4A]">{m.assessmentsCount}</td>
                <td className="px-5 py-3 text-right text-sm text-[#1C2B4A]">{m.studentsAssessed}</td>
                <td className="px-5 py-3 text-right text-sm text-[#1C2B4A]">{m.attendanceMarked}</td>
                <td className="px-5 py-3 text-right text-sm text-[#1C2B4A]">{m.lessonsPlanned}</td>
                <td className="px-5 py-3 text-right text-sm font-semibold">
                  {m.avgScore != null ? (
                    <span className={
                      m.avgScore >= 4 ? 'text-green-700' :
                      m.avgScore >= 3 ? 'text-amber-700' : 'text-red-700'
                    }>{m.avgScore.toFixed(1)}/5</span>
                  ) : <span className="text-[#1C2B4A]/30">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
      </div>

      <p className="text-xs text-[#1C2B4A]/40 mt-4">
        💡 Retention = % HV active có buổi học trong 30 ngày. Tiến bộ = chênh lệch điểm trung bình kỹ năng giữa buổi 1 và buổi 7+.
      </p>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MetricCard({ icon: Icon, label, value, subtext, color }: { icon: any; label: string; value: string; subtext: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/40 font-semibold">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="font-heading text-3xl" style={{ color }}>{value}</p>
      <p className="text-xs text-[#1C2B4A]/50 mt-1">{subtext}</p>
    </div>
  )
}
