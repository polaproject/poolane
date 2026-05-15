import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { GraduationCap, Compass } from 'lucide-react'

type Params = { params: Promise<{ studentId: string }> }

// Achievement card — public shareable page (no auth required, no ambient layout)
export default async function AchievementPage({ params }: Params) {
  const { studentId } = await params

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { fullName: true } },
      enrollments: {
        where: { status: 'completed' },
        include: { course: true },
        orderBy: { graduationDate: 'asc' },
      },
    },
  })

  if (!student || student.enrollments.length === 0) notFound()

  const lastGrad = student.enrollments[student.enrollments.length - 1]

  return (
    <div className="min-h-screen grid place-items-center p-4 relative overflow-hidden" style={{ background: '#0F1B33' }}>
      {/* Ambient blobs */}
      <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full blur-[120px] opacity-70" style={{ background: '#1C2B4A' }} />
      <div className="absolute top-40 right-0 h-[420px] w-[420px] rounded-full blur-[140px]" style={{ background: 'rgba(127,168,181,0.25)' }} />
      <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full blur-[140px]" style={{ background: 'rgba(200,168,75,0.2)' }} />

      <div
        className="relative rounded-card-xl shadow-glass overflow-hidden w-full max-w-sm"
        style={{ background: '#FBF7F0', color: '#0F1B33' }}
      >
        {/* Header */}
        <div
          className="px-8 py-10 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1C2B4A 0%, #0F1B33 100%)', color: '#FBF7F0' }}
        >
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-30" style={{ background: 'rgba(200,168,75,0.4)', filter: 'blur(60px)' }} />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-20" style={{ background: 'rgba(127,168,181,0.6)', filter: 'blur(50px)' }} />

          <div className="relative">
            <div
              className="inline-grid place-items-center h-16 w-16 rounded-pill mb-4"
              style={{ background: 'rgba(200,168,75,0.18)', border: '1px solid rgba(200,168,75,0.35)' }}
            >
              <GraduationCap className="h-8 w-8" style={{ color: '#C8A84B' }} strokeWidth={1.5} />
            </div>
            <p
              className="text-[10px] tracking-[0.3em] uppercase font-medium mb-2"
              style={{ color: 'rgba(251,247,240,0.55)' }}
            >
              Tốt nghiệp
            </p>
            <h1 className="lqg-headline text-3xl leading-tight">{lastGrad.course.name}</h1>
            <p className="text-sm mt-3 font-medium" style={{ color: '#C8A84B' }}>
              {student.user.fullName}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-7">
          <div className="text-center mb-6">
            <p className="text-[10px] tracking-[0.25em] uppercase font-medium opacity-55 mb-1">
              Ngày hoàn thành
            </p>
            <p className="lqg-headline text-2xl">
              {lastGrad.graduationDate
                ? format(lastGrad.graduationDate, "dd 'tháng' MM, yyyy", { locale: vi })
                : 'Đã hoàn thành'}
            </p>
          </div>

          {student.enrollments.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] tracking-[0.25em] uppercase font-medium opacity-55 text-center mb-3">
                Các khoá đã hoàn thành
              </p>
              <div className="flex justify-center gap-4">
                {student.enrollments.map((e, i) => (
                  <div key={e.id} className="text-center">
                    <div
                      className="w-12 h-12 rounded-pill grid place-items-center mb-1 lqg-headline text-lg"
                      style={{
                        background: i === student.enrollments.length - 1 ? '#C8A84B' : 'rgba(15,27,51,0.08)',
                        color: i === student.enrollments.length - 1 ? '#0F1B33' : '#0F1B33',
                      }}
                    >
                      ✓
                    </div>
                    <p className="text-xs opacity-65 font-medium tracking-wider">{e.course.code}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className="rounded-pill py-2.5 text-center"
            style={{ background: 'rgba(15,27,51,0.05)', border: '1px solid rgba(15,27,51,0.08)' }}
          >
            <p className="text-xs opacity-55 font-mono tracking-widest">{student.studentCode}</p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-8 py-5 text-center"
          style={{ borderTop: '1px solid rgba(15,27,51,0.08)' }}
        >
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="grid place-items-center h-6 w-6 rounded-pill" style={{ background: '#C8A84B', color: '#0F1B33' }}>
              <Compass className="h-3 w-3" strokeWidth={2.25} />
            </span>
            <p className="font-body font-bold text-sm tracking-[0.18em]">POOLANE</p>
          </div>
          <p className="text-[10px] tracking-wider opacity-50">a Pola Project</p>
          <p className="text-xs italic font-heading mt-2 opacity-65">
            “Dạy bơi không chỉ để bơi”
          </p>
        </div>
      </div>
    </div>
  )
}
