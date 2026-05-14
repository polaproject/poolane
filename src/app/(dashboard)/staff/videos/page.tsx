import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { VideoForm } from './VideoForm'
import { format } from 'date-fns'
import { Video as VideoIcon, ExternalLink } from 'lucide-react'

export default async function StaffVideosPage() {
  await requireRole(['admin', 'staff'])

  const students = await prisma.student.findMany({
    where: { status: { in: ['active', 'extension'] } },
    select: { id: true, studentCode: true, user: { select: { fullName: true, phone: true } } },
    orderBy: { user: { fullName: 'asc' } },
    take: 200,
  })

  const recent = await prisma.videoLink.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: { student: { select: { studentCode: true, user: { select: { fullName: true } } } } },
  })

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="bg-ink text-paper px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-mist/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-4xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
            <VideoIcon className="h-3 w-3 text-accent" strokeWidth={1.75} /> Phân tích kỹ thuật
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Video bơi</h1>
          <p className="text-sm text-paper/65 mt-2">Gắn link Google Drive cho học viên xem.</p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-4xl mx-auto space-y-6 relative z-10">
        <div className="rounded-card-lg bg-white shadow-soft ring-1 ring-ink/8 p-5 sm:p-6">
          <VideoForm
            students={students.map(s => ({ id: s.id, studentCode: s.studentCode, fullName: s.user.fullName, phone: s.user.phone }))}
          />
        </div>

        <div>
          <p className="eyebrow text-ink/55 mb-3">Video đã gửi gần đây · {recent.length}</p>
          {recent.length === 0 ? (
            <div className="rounded-card-lg bg-white shadow-soft ring-1 ring-ink/8 p-12 text-center">
              <VideoIcon className="h-10 w-10 mx-auto mb-3 text-ink/30" strokeWidth={1.5} />
              <p className="font-heading italic text-2xl text-ink">Chưa có video</p>
            </div>
          ) : (
            <div className="rounded-card-lg bg-white shadow-soft ring-1 ring-ink/8 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-paper-tint/30 border-b border-ink/8">
                    <tr>
                      <th className="text-left px-5 py-3 eyebrow text-ink/55">Học viên</th>
                      <th className="text-left px-5 py-3 eyebrow text-ink/55">Caption</th>
                      <th className="text-left px-5 py-3 eyebrow text-ink/55">Ngày gửi</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(v => (
                      <tr key={v.id} className="border-b border-ink/5 last:border-b-0 hover:bg-paper-tint/20 transition">
                        <td className="px-5 py-3 text-sm">
                          <p className="font-medium text-ink">{v.student.user.fullName}</p>
                          <p className="text-xs text-ink/45 font-mono mt-0.5">{v.student.studentCode}</p>
                        </td>
                        <td className="px-5 py-3 text-sm text-ink/70 max-w-md truncate">{v.caption ?? '—'}</td>
                        <td className="px-5 py-3 text-xs text-ink/55">{format(v.createdAt, 'HH:mm · dd/MM/yyyy')}</td>
                        <td className="px-5 py-3 text-right">
                          <a
                            href={v.driveUrl}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                          >
                            Mở Drive <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
