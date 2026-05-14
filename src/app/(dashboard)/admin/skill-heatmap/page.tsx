import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { COURSE_SKILLS } from '@/config/constants'
import { BarChart2 } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'

type SearchParams = Promise<{ course?: string }>

export default async function SkillHeatmapPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['admin'])
  const params = await searchParams
  const courseCode = (params.course ?? 'ECH') as keyof typeof COURSE_SKILLS

  const course = await prisma.course.findFirst({ where: { code: courseCode } })
  if (!course) return <div className="min-h-screen grid place-items-center text-foreground/55">Không tìm thấy khoá</div>

  const skills = COURSE_SKILLS[courseCode] ?? []

  const scores = await prisma.assessmentScore.findMany({
    where: { assessment: { courseId: course.id } },
    select: { skillKey: true, score: true, assessment: { select: { studentId: true, assessmentDate: true } } },
    orderBy: { assessment: { assessmentDate: 'desc' } },
  })

  const latestByStudentSkill = new Map<string, number>()
  for (const s of scores) {
    const key = `${s.assessment.studentId}::${s.skillKey}`
    if (!latestByStudentSkill.has(key)) latestByStudentSkill.set(key, s.score)
  }

  const skillStats = skills.map(skill => {
    const studentScores: number[] = []
    for (const [k, v] of latestByStudentSkill.entries()) {
      if (k.endsWith(`::${skill.key}`)) studentScores.push(v)
    }
    const count = studentScores.length
    const avg = count > 0 ? studentScores.reduce((s, n) => s + n, 0) / count : 0
    const weak = studentScores.filter(s => s <= 2).length
    const strong = studentScores.filter(s => s >= 4).length
    return { key: skill.key, label: skill.label, count, avg, weak, strong }
  })

  const sorted = [...skillStats].sort((a, b) => a.avg - b.avg)

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-5xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
            <BarChart2 className="h-3 w-3 text-accent" strokeWidth={1.75} /> Phân bố kỹ năng cả lớp
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Heatmap kỹ năng</h1>
          <p className="text-sm text-paper/65 mt-2">Trung bình điểm gần nhất — sắp xếp theo kỹ năng yếu nhất.</p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-5xl mx-auto space-y-4 relative z-10">
        <div className="flex gap-2 flex-wrap">
          {(['ECH', 'SAI', 'BUOM'] as const).map(code => (
            <a key={code} href={`/admin/skill-heatmap?course=${code}`}>
              <Chip asButton active={courseCode === code}>
                {code === 'ECH' ? 'Bơi Ếch' : code === 'SAI' ? 'Bơi Sải' : 'Bơi Bướm'}
              </Chip>
            </a>
          ))}
        </div>

        <div className="glass-card glass-card-hover overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-paper-tint/30 border-b border-foreground/8">
                <tr>
                  <th className="text-left px-5 py-3 eyebrow text-foreground/55">Kỹ năng</th>
                  <th className="text-center px-5 py-3 eyebrow text-foreground/55">TB lớp</th>
                  <th className="text-center px-5 py-3 eyebrow text-foreground/55">Số HV</th>
                  <th className="text-center px-5 py-3 eyebrow text-foreground/55">Yếu ≤2</th>
                  <th className="text-center px-5 py-3 eyebrow text-foreground/55">Mạnh ≥4</th>
                  <th className="text-left px-5 py-3 eyebrow text-foreground/55">Phân bố</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(s => {
                  const tone = s.avg >= 4 ? 'success' : s.avg >= 3 ? 'warn' : 'danger'
                  const bgClass = tone === 'success' ? 'bg-success/12' : tone === 'warn' ? 'bg-warn/12' : 'bg-danger/12'
                  const textClass = tone === 'success' ? 'text-success' : tone === 'warn' ? 'text-warn' : 'text-danger'
                  return (
                    <tr key={s.key} className={`border-b border-foreground/5 last:border-b-0 hover:bg-paper-tint/20 transition ${s.count === 0 ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-3 text-sm font-medium text-foreground">{s.label}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-block font-heading italic text-xl ${textClass} ${bgClass} px-3 py-1 rounded-pill`}>
                          {s.count > 0 ? s.avg.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-sm text-foreground/65">{s.count}</td>
                      <td className="px-5 py-3 text-center text-sm text-danger font-medium">{s.weak > 0 ? s.weak : '—'}</td>
                      <td className="px-5 py-3 text-center text-sm text-success font-medium">{s.strong > 0 ? s.strong : '—'}</td>
                      <td className="px-5 py-3">
                        {s.count > 0 && (
                          <div className="flex h-2 rounded-full overflow-hidden bg-ink/8">
                            <div className="bg-danger" style={{ width: `${(s.weak / s.count) * 100}%` }} />
                            <div className="bg-warn" style={{ width: `${((s.count - s.weak - s.strong) / s.count) * 100}%` }} />
                            <div className="bg-success" style={{ width: `${(s.strong / s.count) * 100}%` }} />
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-foreground/55 text-center">
          <span className="inline-flex items-center gap-1 mr-3"><span className="h-2 w-2 rounded-pill bg-danger" /> &lt; 3 cần luyện</span>
          <span className="inline-flex items-center gap-1 mr-3"><span className="h-2 w-2 rounded-pill bg-warn" /> 3–4 trung bình</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-pill bg-success" /> ≥4 vững</span>
        </p>
      </div>
    </div>
  )
}
