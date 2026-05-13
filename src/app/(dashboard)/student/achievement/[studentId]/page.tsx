import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

type Params = { params: Promise<{ studentId: string }> }

// Achievement card — public shareable page
export default async function AchievementPage({ params }: Params) {
  const { studentId } = await params

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { fullName: true } },
      enrollments: {
        where: { status: 'completed' },
        include: { course: true },
        orderBy: { graduationDate: 'asc' }
      }
    }
  })

  if (!student || student.enrollments.length === 0) notFound()

  const lastGrad = student.enrollments[student.enrollments.length - 1]
  const courseBadges: Record<string, { emoji: string; color: string }> = {
    ECH:  { emoji: '🐸', color: '#5B8E9F' },
    SAI:  { emoji: '🏊', color: '#1C2B4A' },
    BUOM: { emoji: '🦋', color: '#C8A84B' },
  }

  return (
    <div className="min-h-screen bg-[#F6F1EA] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm">

        {/* Header */}
        <div className="bg-[#1C2B4A] px-8 py-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/4 translate-x-1/4" />
          <div className="relative z-10">
            <div className="text-5xl mb-3">
              {courseBadges[lastGrad.course.code]?.emoji ?? '🏅'}
            </div>
            <p className="text-[#F6F1EA]/60 text-xs tracking-wider uppercase mb-1">Tốt nghiệp</p>
            <h1 className="font-heading text-2xl text-[#F6F1EA] leading-tight">
              {lastGrad.course.name}
            </h1>
            <p className="text-[#C8A84B] text-sm mt-1 font-medium">
              {student.user.fullName}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <div className="text-center mb-6">
            <p className="text-xs text-[#1C2B4A]/40 uppercase tracking-wider mb-1">Ngày hoàn thành</p>
            <p className="font-heading text-xl text-[#1C2B4A]">
              {lastGrad.graduationDate
                ? format(lastGrad.graduationDate, "dd 'tháng' MM, yyyy", { locale: vi })
                : 'Đã hoàn thành'}
            </p>
          </div>

          {/* All completed courses */}
          {student.enrollments.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-[#1C2B4A]/40 uppercase tracking-wider text-center mb-3">Các khoá đã hoàn thành</p>
              <div className="flex justify-center gap-3">
                {student.enrollments.map(e => (
                  <div key={e.id} className="text-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-1"
                      style={{ background: `${courseBadges[e.course.code]?.color ?? '#1C2B4A'}20` }}
                    >
                      {courseBadges[e.course.code]?.emoji ?? '🏅'}
                    </div>
                    <p className="text-xs text-[#1C2B4A]/60">{e.course.code}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student code */}
          <div className="bg-[#F6F1EA] rounded-xl py-3 text-center">
            <p className="text-xs text-[#1C2B4A]/40">{student.studentCode}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#1C2B4A]/8 px-8 py-4 text-center">
          <p className="font-body font-bold text-sm tracking-[0.15em] text-[#1C2B4A]">POOLANE</p>
          <p className="text-xs text-[#5B8E9F]">a Pola Project</p>
          <p className="text-xs text-[#1C2B4A]/30 mt-1 italic">"Dạy bơi không chỉ để bơi"</p>
        </div>
      </div>
    </div>
  )
}
