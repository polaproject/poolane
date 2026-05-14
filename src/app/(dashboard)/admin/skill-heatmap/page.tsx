import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { COURSE_SKILLS } from '@/config/constants'

type SearchParams = Promise<{ course?: string }>

export default async function SkillHeatmapPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(['admin'])
  const params = await searchParams
  const courseCode = (params.course ?? 'ECH') as keyof typeof COURSE_SKILLS

  const course = await prisma.course.findFirst({ where: { code: courseCode } })
  if (!course) {
    return <div className="p-6 text-center text-[#1C2B4A]/40">Không tìm thấy khoá</div>
  }

  const skills = COURSE_SKILLS[courseCode] ?? []

  // Lấy điểm gần nhất của mỗi học viên cho mỗi kỹ năng
  const scores = await prisma.assessmentScore.findMany({
    where: { assessment: { courseId: course.id } },
    select: {
      skillKey: true,
      score: true,
      assessment: { select: { studentId: true, assessmentDate: true } }
    },
    orderBy: { assessment: { assessmentDate: 'desc' } },
  })

  // Group: per student per skill → lấy điểm mới nhất
  const latestByStudentSkill = new Map<string, number>()
  for (const s of scores) {
    const key = `${s.assessment.studentId}::${s.skillKey}`
    if (!latestByStudentSkill.has(key)) {
      latestByStudentSkill.set(key, s.score)
    }
  }

  // Aggregate per skill
  const skillStats = skills.map(skill => {
    const studentScores: number[] = []
    for (const [k, v] of latestByStudentSkill.entries()) {
      if (k.endsWith(`::${skill.key}`)) studentScores.push(v)
    }
    const count = studentScores.length
    const avg = count > 0 ? studentScores.reduce((s, n) => s + n, 0) / count : 0
    const weak = studentScores.filter(s => s <= 2).length // điểm yếu
    const strong = studentScores.filter(s => s >= 4).length
    return { key: skill.key, label: skill.label, count, avg, weak, strong }
  })

  // Sắp xếp theo avg tăng dần → kỹ năng yếu lên đầu
  const sorted = [...skillStats].sort((a, b) => a.avg - b.avg)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Heatmap kỹ năng</h1>
        <p className="text-sm text-[#1C2B4A]/50 mt-1">
          Trung bình điểm gần nhất của lớp — sắp xếp theo kỹ năng yếu nhất
        </p>
      </div>

      {/* Course selector */}
      <div className="flex gap-2 mb-6">
        {(['ECH', 'SAI', 'BUOM'] as const).map(code => (
          <a key={code} href={`/admin/skill-heatmap?course=${code}`}
            className={`px-4 py-2 text-sm rounded-lg border ${
              courseCode === code ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]' : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15'
            }`}>
            {code === 'ECH' ? 'Bơi Ếch' : code === 'SAI' ? 'Bơi Sải' : 'Bơi Bướm'}
          </a>
        ))}
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">

        <table className="w-full min-w-[640px]">
          <thead className="bg-[#F6F1EA]/40">
            <tr className="text-left text-xs uppercase tracking-wider text-[#1C2B4A]/50">
              <th className="px-5 py-3">Kỹ năng</th>
              <th className="px-5 py-3 text-center">TB lớp</th>
              <th className="px-5 py-3 text-center">Số HV đánh giá</th>
              <th className="px-5 py-3 text-center">HV yếu (≤2)</th>
              <th className="px-5 py-3 text-center">HV mạnh (≥4)</th>
              <th className="px-5 py-3">Phân bố</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2B4A]/5">
            {sorted.map(s => {
              const heat = s.avg >= 4 ? 'green' : s.avg >= 3 ? 'amber' : 'red'
              const bgClass = heat === 'green' ? 'bg-green-50' : heat === 'amber' ? 'bg-amber-50' : 'bg-red-50'
              return (
                <tr key={s.key} className={s.count === 0 ? 'opacity-50' : ''}>
                  <td className="px-5 py-3 text-sm text-[#1C2B4A] font-semibold">{s.label}</td>
                  <td className={`px-5 py-3 text-center text-lg font-heading ${bgClass}`}>
                    {s.count > 0 ? s.avg.toFixed(1) : '—'}
                  </td>
                  <td className="px-5 py-3 text-center text-sm text-[#1C2B4A]/60">{s.count}</td>
                  <td className="px-5 py-3 text-center text-sm text-red-600 font-semibold">{s.weak > 0 ? s.weak : '—'}</td>
                  <td className="px-5 py-3 text-center text-sm text-green-700 font-semibold">{s.strong > 0 ? s.strong : '—'}</td>
                  <td className="px-5 py-3">
                    {s.count > 0 && (
                      <div className="flex h-2 rounded-full overflow-hidden bg-[#1C2B4A]/8">
                        <div className="bg-red-500" style={{ width: `${(s.weak / s.count) * 100}%` }} />
                        <div className="bg-amber-400" style={{ width: `${((s.count - s.weak - s.strong) / s.count) * 100}%` }} />
                        <div className="bg-green-500" style={{ width: `${(s.strong / s.count) * 100}%` }} />
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

      <p className="text-xs text-[#1C2B4A]/40 mt-4">
        🔴 TB &lt; 3 = lớp cần luyện thêm · 🟡 3-4 = trung bình · 🟢 ≥4 = vững vàng
      </p>
    </div>
  )
}
