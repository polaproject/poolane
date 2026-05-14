import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { COURSE_SKILLS, SCALE_DESCRIPTIONS } from '@/config/constants'
import { RadarChart } from '@/components/features/assessment/RadarChart'

export default async function ProgressPage() {
  const user = await requireRole(['admin', 'staff', 'student'])

  // Lấy student với enrollments
  const student = await prisma.student.findFirst({
    where: { userId: user.id },
    include: {
      enrollments: {
        where: { status: { in: ['active', 'extension', 'completed'] } },
        include: { course: true }
      }
    }
  })

  if (!student || student.enrollments.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="font-heading text-2xl text-[#1C2B4A] mb-2">Tiến độ học tập</p>
        <p className="text-[#1C2B4A]/50">Chưa có dữ liệu đánh giá</p>
      </div>
    )
  }

  // Lấy assessments riêng (assessment thuộc student+course, không phải enrollment)
  const assessmentsByEnrollment = await Promise.all(
    student.enrollments.map(async (enrollment) => {
      const assessments = await prisma.assessment.findMany({
        where: { studentId: student.id, courseId: enrollment.courseId },
        orderBy: { sessionNumber: 'asc' },
        include: { scores: true, metrics: true }
      })
      return { enrollment, assessments }
    })
  )

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="font-heading text-3xl text-[#1C2B4A] mb-6">Tiến độ của bạn</h1>

      {assessmentsByEnrollment.map(({ enrollment, assessments }) => {
        const courseCode = enrollment.course.code as 'ECH' | 'SAI' | 'BUOM'
        const skills = COURSE_SKILLS[courseCode] ?? COURSE_SKILLS.ECH

        if (assessments.length === 0) return (
          <div key={enrollment.id} className="bg-white rounded-2xl border border-[#1C2B4A]/8 p-5 mb-4">
            <h2 className="font-heading text-xl text-[#1C2B4A]">{enrollment.course.name}</h2>
            <p className="text-sm text-[#1C2B4A]/50 mt-2">Chưa có đánh giá nào</p>
          </div>
        )

        const latest = assessments[assessments.length - 1]
        const latestScores = Object.fromEntries(latest.scores.map(s => [s.skillKey, s.score]))
        const avg = latest.scores.length > 0
          ? latest.scores.reduce((sum, s) => sum + s.score, 0) / latest.scores.length
          : 0
        const weakSkills = latest.scores
          .filter(s => s.score <= 2)
          .map(s => skills.find(sk => sk.key === s.skillKey)?.label ?? s.skillKey)

        return (
          <div key={enrollment.id} className="mb-8">
            {/* Course header */}
            <div className="bg-[#1C2B4A] rounded-2xl p-5 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[#F6F1EA]/50 text-xs mb-1">Khoá học</p>
                  <h2 className="font-heading text-2xl text-[#F6F1EA]">{enrollment.course.name}</h2>
                </div>
                <div className="text-right">
                  <p className="font-heading text-4xl text-[#C8A84B]">{avg.toFixed(1)}</p>
                  <p className="text-[#F6F1EA]/40 text-xs">điểm TB</p>
                </div>
              </div>
              <div className="mt-3 flex gap-3 text-xs text-[#F6F1EA]/50">
                <span>{assessments.length} lần đánh giá</span>
                <span>·</span>
                <span>Buổi {latest.sessionNumber}</span>
                <span>·</span>
                <span className={`font-medium ${enrollment.status === 'completed' ? 'text-[#C8A84B]' : 'text-[#F6F1EA]/50'}`}>
                  {enrollment.status === 'completed' ? '🎓 Đã tốt nghiệp' : enrollment.status === 'extension' ? '🔄 Ôn luyện' : '📚 Đang học'}
                </span>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 p-5 mb-4">
              <h3 className="font-semibold text-[#1C2B4A] text-sm mb-4">Biểu đồ kỹ năng</h3>
              <RadarChart
                skills={skills}
                scores={latestScores}
                previousScores={
                  assessments.length > 1
                    ? Object.fromEntries(assessments[0].scores.map(s => [s.skillKey, s.score]))
                    : undefined
                }
              />
            </div>

            {/* Skill list */}
            <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden mb-4">
              <div className="px-4 py-3 border-b border-[#1C2B4A]/8">
                <h3 className="font-semibold text-[#1C2B4A] text-sm">Chi tiết kỹ năng — Buổi {latest.sessionNumber}</h3>
              </div>
              <div className="divide-y divide-[#1C2B4A]/5">
                {skills.map(skill => {
                  const score = latestScores[skill.key] ?? 0
                  const first = assessments[0].scores.find(s => s.skillKey === skill.key)?.score ?? 0
                  return (
                    <div key={skill.key} className="px-4 py-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm text-[#1C2B4A]">{skill.label}</span>
                        <div className="flex items-center gap-2">
                          {first > 0 && first !== score && (
                            <span className="text-xs text-[#1C2B4A]/40">{first}→</span>
                          )}
                          <span className={`text-sm font-bold ${score <= 2 ? 'text-red-500' : score >= 4 ? 'text-green-600' : 'text-[#1C2B4A]'}`}>
                            {score || '—'}/5
                          </span>
                        </div>
                      </div>
                      {score > 0 && (
                        <div className="h-1.5 bg-[#1C2B4A]/8 rounded-full">
                          <div
                            className={`h-full rounded-full transition-all ${score <= 2 ? 'bg-red-400' : score >= 4 ? 'bg-green-500' : 'bg-[#5B8E9F]'}`}
                            style={{ width: `${(score / 5) * 100}%` }}
                          />
                        </div>
                      )}
                      {score > 0 && (
                        <p className="text-xs text-[#1C2B4A]/40 mt-1">
                          {SCALE_DESCRIPTIONS[score as keyof typeof SCALE_DESCRIPTIONS]}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Weak skills */}
            {weakSkills.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">🎯 Cần tập trung luyện thêm:</p>
                <p className="text-sm text-amber-700">{weakSkills.join(' · ')}</p>
              </div>
            )}

            {/* Metrics */}
            {latest.metrics.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 p-4">
                <h3 className="font-semibold text-[#1C2B4A] text-sm mb-3">Chỉ số thực tế</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {latest.metrics.map(m => (
                    <div key={m.metricKey} className="text-center">
                      <p className="font-heading text-2xl text-[#1C2B4A]">{m.value}</p>
                      <p className="text-xs text-[#1C2B4A]/50 mt-0.5">{m.unit}</p>
                      <p className="text-xs text-[#1C2B4A]/40">
                        {m.metricKey === 'continuous_meters' ? 'Mét liên tục'
                          : m.metricKey === 'time_25m' ? 'Thời gian 25m'
                          : 'Nhịp/hồ'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
