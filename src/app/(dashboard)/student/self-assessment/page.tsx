import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ClipboardCheck, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'

export default async function SelfAssessmentListPage() {
  const user = await requireRole(['student'])

  const student = await prisma.student.findFirst({
    where: { userId: user.id },
    include: {
      enrollments: {
        where: { status: { in: ['active', 'extension'] } },
        include: { course: { select: { id: true, code: true, name: true } } },
      },
    },
  })

  if (!student) {
    return <div className="p-8 text-center text-foreground/55">Không tìm thấy hồ sơ</div>
  }

  if (student.enrollments.length === 0) {
    return (
      <div className="min-h-screen bg-paper pb-12">
        <div className="hero-block px-5 sm:px-8 pt-8 pb-12">
          <div className="max-w-3xl mx-auto">
            <p className="eyebrow text-paper/55 mb-2">Tự đánh giá kỹ năng</p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Nhận ra điểm mù bản thân</h1>
          </div>
        </div>
        <div className="px-4 sm:px-8 -mt-6 max-w-3xl mx-auto">
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <ClipboardCheck className="h-12 w-12 text-foreground/30 mx-auto mb-4" strokeWidth={1.5} />
            <p className="font-heading italic text-2xl text-foreground mb-1">Chưa có khoá học</p>
            <p className="text-sm text-foreground/55">Bạn cần đăng ký khoá học trước khi tự đánh giá.</p>
          </div>
        </div>
      </div>
    )
  }

  const submitted = await prisma.selfAssessment.findMany({
    where: { studentId: student.id },
    select: { courseId: true, sessionNumber: true },
  })
  const submittedMap = new Set(submitted.map(s => `${s.courseId}-${s.sessionNumber}`))

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-3xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2">Tự đánh giá · Buổi 5 và 9</p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Nhận ra điểm mù</h1>
          <p className="text-sm text-paper/65 mt-2 max-w-lg leading-relaxed">
            Tự cho điểm trước khi giáo viên chấm. So sánh độ lệch giúp bạn nhìn lại bản thân.
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-3xl mx-auto space-y-4 relative z-10">
        {student.enrollments.map(e => (
          <div key={e.id} className="glass-card glass-card-hover overflow-hidden">
            <div className="px-5 py-4 border-b border-foreground/8 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <div>
                <p className="eyebrow text-foreground/55">Khoá học</p>
                <h2 className="font-heading italic text-xl text-foreground mt-0.5">{e.course.name}</h2>
              </div>
            </div>
            <div className="divide-y divide-foreground/5">
              {[5, 9].map(sn => {
                const done = submittedMap.has(`${e.course.id}-${sn}`)
                return (
                  <Link
                    key={sn}
                    href={`/student/self-assessment/${e.course.id}/${sn}`}
                    className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-paper-tint/40 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center w-12 shrink-0">
                        <div className="text-[10px] tracking-widest uppercase text-foreground/45">Buổi</div>
                        <div className="font-heading italic text-2xl text-foreground leading-none">{sn}</div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Đánh giá buổi {sn}</p>
                        <p className="text-xs text-foreground/55 mt-0.5">
                          {done ? 'Đã đánh giá — bấm để xem/sửa' : 'Chưa đánh giá'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {done && (
                        <Chip variant="success" active className="text-[10px]">
                          <CheckCircle2 className="h-3 w-3" strokeWidth={2.25} /> Xong
                        </Chip>
                      )}
                      <ArrowRight className="h-4 w-4 text-foreground/40 group-hover:translate-x-0.5 group-hover:text-accent transition" strokeWidth={2.25} />
                    </div>
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
