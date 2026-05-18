import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Video as VideoIcon, ExternalLink, Sunrise, Sunset } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

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
    include: { session: { select: { date: true, timeSlot: true } } },
  }) : []

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-3xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2">Phân tích kỹ thuật · {videos.length} video</p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Video bơi của tôi</h1>
          <p className="text-sm text-paper/65 mt-2">Lớp gửi video kỹ thuật cho bạn xem và tự ngẫm.</p>
        </div>
      </div>

      <div className="pl-5 pr-[5rem] sm:px-8 -mt-6 max-w-3xl mx-auto space-y-4 relative z-10">
        {videos.length === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <VideoIcon className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">Chưa có video</p>
            <p className="text-sm text-foreground/55">Lớp sẽ gửi video sau buổi học nếu có ghi hình.</p>
          </div>
        ) : (
          videos.map(v => {
            const embed = toEmbedUrl(v.driveUrl)
            return (
              <div key={v.id} className="glass-card glass-card-hover overflow-hidden">
                <div className="aspect-video bg-ink relative">
                  {embed ? (
                    <iframe src={embed} className="w-full h-full" allow="autoplay" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-paper/65">
                      <a
                        href={v.driveUrl}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-paper/10 ring-1 ring-paper/20 hover:bg-paper/15 transition"
                      >
                        <VideoIcon className="h-4 w-4" strokeWidth={1.75} />
                        Mở trên Google Drive
                        <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </a>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  {v.session && (
                    <p className="eyebrow text-foreground/55 mb-2 inline-flex items-center gap-1.5">
                      {v.session.timeSlot === 'morning' ? (
                        <Sunrise className="h-3 w-3 text-accent" strokeWidth={1.75} />
                      ) : (
                        <Sunset className="h-3 w-3 text-accent" strokeWidth={1.75} />
                      )}
                      Buổi {v.session.timeSlot === 'morning' ? 'sáng' : 'chiều'} · {format(v.session.date, 'dd/MM/yyyy', { locale: vi })}
                    </p>
                  )}
                  {v.caption && <p className="text-sm text-foreground leading-relaxed">{v.caption}</p>}
                  <p className="text-xs text-foreground/45 mt-2">
                    Gửi {format(v.createdAt, 'HH:mm · dd/MM/yyyy')}
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
