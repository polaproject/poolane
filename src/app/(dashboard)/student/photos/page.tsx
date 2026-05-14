import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ImageIcon } from 'lucide-react'

export default async function StudentPhotosPage() {
  await requireRole(['student'])

  const photos = await prisma.sessionPhoto.findMany({
    where: { visibleTo: 'all_students' },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="bg-ink text-paper px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-5xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2">{photos.length} ảnh · Cộng đồng</p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Album lớp Poolane</h1>
          <p className="text-sm text-paper/65 mt-2">Khoảnh khắc cùng cộng đồng học viên người lớn.</p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-5xl mx-auto relative z-10">
        {photos.length === 0 ? (
          <div className="rounded-card-xl bg-white shadow-soft ring-1 ring-ink/8 p-12 text-center">
            <ImageIcon className="h-10 w-10 mx-auto mb-3 text-ink/30" strokeWidth={1.5} />
            <p className="font-heading italic text-2xl text-ink mb-1">Chưa có ảnh</p>
            <p className="text-sm text-ink/55">Album đang chờ những khoảnh khắc đầu tiên.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map(p => (
              <a
                key={p.id}
                href={p.photoUrl}
                target="_blank"
                rel="noopener"
                className="group block rounded-card overflow-hidden ring-1 ring-ink/8 bg-white hover:ring-accent/40 hover:-translate-y-0.5 transition-all duration-300 shadow-soft"
              >
                <div className="aspect-square bg-paper-tint overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.photoUrl}
                    alt={p.caption ?? 'Ảnh lớp Poolane'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {p.caption && (
                  <p className="text-xs text-ink/70 px-3 py-2 line-clamp-2 leading-relaxed">{p.caption}</p>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
