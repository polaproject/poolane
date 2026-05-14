import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { COURSE_SKILLS, SCALE_DESCRIPTIONS } from '@/config/constants'
import { RadarChart } from '@/components/features/assessment/RadarChart'
import { Chip } from '@/components/ui/Chip'
import { TrendingUp, Target, GraduationCap, Repeat, BookOpen, Award } from 'lucide-react'

export default async function ProgressPage() {
  const user = await requireRole(['admin', 'staff', 'student'])

  const student = await prisma.student.findFirst({
    where: { userId: user.id },
    include: {
      enrollments: {
        where: { status: { in: ['active', 'extension', 'completed'] } },
        include: { course: true },
      },
    },
  })

  if (!student || student.enrollments.length === 0) {
    return (
      <div className="min-h-screen bg-paper pb-12">
        <div className="bg-ink text-paper px-5 sm:px-8 pt-8 pb-12">
          <div className="max-w-3xl mx-auto">
            <p className="eyebrow text-paper/55 mb-2">Tiến độ học tập</p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Hành trình của bạn</h1>
          </div>
        </div>
        <div className="px-4 sm:px-8 -mt-6 max-w-3xl mx-auto">
          <div className="rounded-card-xl bg-white shadow-soft ring-1 ring-ink/8 p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-ink/30" strokeWidth={1.5} />
            <p className="font-heading italic text-2xl text-ink mb-1">Chưa có dữ liệu đánh giá</p>
            <p className="text-sm text-ink/55">Sau khi học buổi 1, giáo viên sẽ chấm điểm khởi đầu.</p>
          </div>
        </div>
      </div>
    )
  }

  const assessmentsByEnrollment = await Promise.all(
    student.enrollments.map(async (enrollment) => {
      const assessments = await prisma.assessment.findMany({
        where: { studentId: student.id, courseId: enrollment.courseId },
        orderBy: { sessionNumber: 'asc' },
        include: { scores: true, metrics: true },
      })
      return { enrollment, assessments }
    })
  )

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="bg-ink text-paper px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/15 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-mist/10 translate-y-1/2 blur-3xl" />
        <div className="relative max-w-3xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2">Tiến độ học tập</p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Hành trình của bạn</h1>
          <p className="text-sm text-paper/65 mt-3 max-w-lg">
            Đánh giá kỹ năng theo thang 1–5, theo dõi qua biểu đồ radar và chỉ số thực tế.
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-3xl mx-auto space-y-8 relative z-10">
        {assessmentsByEnrollment.map(({ enrollment, assessments }) => {
          const courseCode = enrollment.course.code as 'ECH' | 'SAI' | 'BUOM'
          const skills = COURSE_SKILLS[courseCode] ?? COURSE_SKILLS.ECH

          if (assessments.length === 0) {
            return (
              <div key={enrollment.id} className="rounded-card-lg bg-white shadow-soft ring-1 ring-ink/8 p-6">
                <h2 className="font-heading italic text-2xl text-ink mb-2">{enrollment.course.name}</h2>
                <p className="text-sm text-ink/55">Chưa có đánh giá nào</p>
              </div>
            )
          }

          const latest = assessments[assessments.length - 1]
          const latestScores = Object.fromEntries(latest.scores.map(s => [s.skillKey, s.score]))
          const avg = latest.scores.length > 0
            ? latest.scores.reduce((sum, s) => sum + s.score, 0) / latest.scores.length
            : 0
          const weakSkills = latest.scores
            .filter(s => s.score <= 2)
            .map(s => skills.find(sk => sk.key === s.skillKey)?.label ?? s.skillKey)

          const statusChip = enrollment.status === 'completed'
            ? { variant: 'success' as const, Icon: GraduationCap, label: 'Đã tốt nghiệp' }
            : enrollment.status === 'extension'
              ? { variant: 'warn' as const, Icon: Repeat, label: 'Ôn luyện' }
              : { variant: 'mist' as const, Icon: BookOpen, label: 'Đang học' }

          return (
            <div key={enrollment.id} className="space-y-4">
              {/* Course header */}
              <div className="rounded-card-lg bg-ink text-paper p-6 relative overflow-hidden shadow-soft">
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
                <div className="relative flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <p className="eyebrow text-paper/55 mb-1">Khoá học</p>
                    <h2 className="font-heading italic text-3xl text-paper leading-tight">{enrollment.course.name}</h2>
                    <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-paper/65">
                      <Chip variant={statusChip.variant} active className="text-[10px]">
                        <statusChip.Icon className="h-3 w-3" strokeWidth={2.25} /> {statusChip.label}
                      </Chip>
                      <span>·</span>
                      <span>{assessments.length} lần đánh giá</span>
                      <span>·</span>
                      <span>Buổi {latest.sessionNumber}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-heading italic text-5xl text-accent leading-none">{avg.toFixed(1)}</p>
                    <p className="text-xs text-paper/55 mt-1">điểm TB</p>
                  </div>
                </div>
              </div>

              {/* Radar Chart */}
              <div className="rounded-card-lg bg-white p-5 shadow-soft ring-1 ring-ink/8">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-accent" strokeWidth={1.75} />
                  <p className="eyebrow text-ink/55">Biểu đồ kỹ năng</p>
                </div>
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
              <div className="rounded-card-lg bg-white shadow-soft ring-1 ring-ink/8 overflow-hidden">
                <div className="px-5 py-4 border-b border-ink/8 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-accent" strokeWidth={1.75} />
                    <p className="eyebrow text-ink/55">Chi tiết — Buổi {latest.sessionNumber}</p>
                  </div>
                </div>
                <div className="divide-y divide-ink/5">
                  {skills.map(skill => {
                    const score = latestScores[skill.key] ?? 0
                    const first = assessments[0].scores.find(s => s.skillKey === skill.key)?.score ?? 0
                    const tone = score <= 2 ? 'text-danger' : score >= 4 ? 'text-success' : 'text-ink'
                    const barTone = score <= 2 ? 'bg-danger' : score >= 4 ? 'bg-success' : 'bg-mist'
                    return (
                      <div key={skill.key} className="px-5 py-3.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-ink">{skill.label}</span>
                          <div className="flex items-center gap-2">
                            {first > 0 && first !== score && (
                              <span className="text-xs text-ink/40">{first}→</span>
                            )}
                            <span className={`text-sm font-bold ${tone}`}>{score || '—'}/5</span>
                          </div>
                        </div>
                        {score > 0 && (
                          <>
                            <div className="h-1.5 bg-ink/8 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${barTone}`}
                                style={{ width: `${(score / 5) * 100}%` }}
                              />
                            </div>
                            <p className="text-xs text-ink/55 mt-1">
                              {SCALE_DESCRIPTIONS[score as keyof typeof SCALE_DESCRIPTIONS]}
                            </p>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Weak skills warning */}
              {weakSkills.length > 0 && (
                <div className="rounded-card-lg bg-warn/10 ring-1 ring-warn/30 p-4 flex items-start gap-3">
                  <div className="grid place-items-center h-9 w-9 rounded-pill bg-warn/20 shrink-0">
                    <Target className="h-4 w-4 text-warn" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-warn mb-1">Cần tập trung luyện thêm</p>
                    <p className="text-sm text-ink/75">{weakSkills.join(' · ')}</p>
                  </div>
                </div>
              )}

              {/* Metrics */}
              {latest.metrics.length > 0 && (
                <div className="rounded-card-lg bg-white p-5 shadow-soft ring-1 ring-ink/8">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4 text-accent" strokeWidth={1.75} />
                    <p className="eyebrow text-ink/55">Chỉ số thực tế</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {latest.metrics.map(m => (
                      <div key={m.metricKey} className="rounded-card bg-paper-tint/50 p-4 text-center">
                        <p className="font-heading italic text-3xl text-ink leading-none">{m.value}</p>
                        <p className="text-xs text-ink/55 mt-1.5">{m.unit}</p>
                        <p className="text-xs text-ink/40 mt-0.5">
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
    </div>
  )
}
