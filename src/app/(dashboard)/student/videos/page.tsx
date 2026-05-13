import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Video as VideoIcon } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

// Convert Drive URL → embed URL
function toEmbedUrl(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) ?? url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null
}

export default async function StudentVideosPage() {
  const user = await requireRole(['student'])
  const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })

  const videos = student ? await prisma.videoLink.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: { session: { select: { date: true, timeSlot: true } } }
  }) : []

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <h1 className="font-heading text-2xl text-[#F6F1EA]">Video bơi của tôi</h1>
        <p className="text-[#F6F1EA]/50 text-xs mt-1">Lớp gửi video phân tích kỹ thuật cho bạn xem 📹</p>
      </div>

      <div className="px-4 -mt-4 max-w-3xl mx-auto space-y-4">
        {videos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <VideoIcon className="w-10 h-10 text-[#1C2B4A]/20 mx-auto mb-3" />
            <p className="text-sm text-[#1C2B4A]/50">Chưa có video nào</p>
            <p className="text-xs text-[#1C2B4A]/40 mt-1">Lớp sẽ gửi video sau buổi học nếu có ghi hình</p>
          </div>
        ) : (
          videos.map(v => {
            const embed = toEmbedUrl(v.driveUrl)
            return (
              <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 overflow-hidden">
                <div className="aspect-video bg-black">
                  {embed ? (
                    <iframe src={embed} className="w-full h-full" allow="autoplay" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/60">
                      <a href={v.driveUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-2 underline">
                        <VideoIcon className="w-5 h-5" /> Mở video trên Google Drive
                      </a>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {v.session && (
                    <p className="text-xs text-[#1C2B4A]/50 mb-1">
                      Buổi {v.session.timeSlot === 'morning' ? 'sáng' : 'chiều'} ngày {format(v.session.date, 'dd/MM/yyyy', { locale: vi })}
                    </p>
                  )}
                  {v.caption && <p className="text-sm text-[#1C2B4A]">{v.caption}</p>}
                  <p className="text-xs text-[#1C2B4A]/40 mt-1">
                    Gửi {format(v.createdAt, 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
