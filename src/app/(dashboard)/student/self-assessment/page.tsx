import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ClipboardCheck, ArrowRight } from 'lucide-react'
import { ASSESSMENT_CHECKPOINTS } from '@/config/constants'

export default async function SelfAssessmentListPage() {
  const user = await requireRole(['student'])

  const student = await prisma.student.findFirst({
    where: { userId: user.id },
    include: {
      enrollments: {
        where: { status: { in: ['active', 'extension'] } },
        include: { course: { select: { id: true, code: true, name: true } } }
      },
    }
  })

  if (!student) {
    return <div className="p-6 text-center text-[#1C2B4A]/40">Không tìm thấy hồ sơ</div>
  }

  if (student.enrollments.length === 0) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <ClipboardCheck className="w-12 h-12 text-[#1C2B4A]/30 mx-auto mb-4" />
        <p className="text-sm text-[#1C2B4A]/60">
          Bạn cần đăng ký khoá học trước khi tự đánh giá kỹ năng
        </p>
      </div>
    )
  }

  // Đếm số buổi đã học từng khoá để biết HV đang ở buổi nào
  const submitted = await prisma.selfAssessment.findMany({
    where: { studentId: student.id },
    select: { courseId: true, sessionNumber: true },
  })
  const submittedMap = new Set(submitted.map(s => `${s.courseId}-${s.sessionNumber}`))

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <h1 className="font-heading text-2xl text-[#F6F1EA]">Tự đánh giá kỹ năng</h1>
        <p className="text-[#F6F1EA]/50 text-xs mt-1">
          Sau buổi 5 và 9, hãy tự cho điểm để so sánh với giáo viên — giúp bạn nhận ra điểm mù của bản thân
        </p>
      </div>

      <div className="px-4 -mt-4 max-w-2xl mx-auto space-y-3">
        {student.enrollments.map(e => (
          <div key={e.id} className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-4">
            <h2 className="font-semibold text-[#1C2B4A] text-sm mb-3">{e.course.name}</h2>
            <div className="space-y-2">
              {[5, 9].map(sn => {
                const done = submittedMap.has(`${e.course.id}-${sn}`)
                return (
                  <Link key={sn}
                    href={`/student/self-assessment/${e.course.id}/${sn}`}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                      done
                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                        : 'bg-white border-[#1C2B4A]/15 hover:border-[#1C2B4A]/30'
                    }`}>
                    <div>
                      <p className="text-sm font-semibold text-[#1C2B4A]">Buổi {sn}</p>
                      <p className="text-xs text-[#1C2B4A]/50">
                        {done ? '✓ Đã đánh giá — bấm để xem/sửa' : 'Chưa đánh giá'}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#1C2B4A]/40" />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
