import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PhotoUploadForm } from './PhotoUploadForm'
import { format } from 'date-fns'
import { ImageIcon } from 'lucide-react'

export default async function AdminPhotosPage() {
  await requireRole(['admin', 'staff'])

  const photos = await prisma.sessionPhoto.findMany({
    orderBy: { createdAt: 'desc' },
    take: 60,
  })

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-5xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2">Cộng đồng · {photos.length} ảnh</p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Album ảnh lớp</h1>
          <p className="text-sm text-paper/65 mt-2">Upload ảnh để học viên xem trong tab Cộng đồng.</p>
        </div>
      </div>

      <div className="pl-5 pr-[5rem] sm:px-8 -mt-6 max-w-5xl mx-auto space-y-6 relative z-10">
        <div className="glass-card glass-card-hover p-5 sm:p-6">
          <PhotoUploadForm />
        </div>

        <div>
          <p className="eyebrow text-foreground/55 mb-3">Album hiện có ({photos.length})</p>
          {photos.length === 0 ? (
            <div className="glass-card glass-card-hover p-12 text-center">
              <ImageIcon className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
              <p className="lqg-headline text-2xl text-foreground mb-1">Chưa có ảnh</p>
              <p className="text-sm text-foreground/55">Upload ảnh đầu tiên qua form bên trên.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map(p => (
                <div key={p.id} className="rounded-card overflow-hidden ring-1 ring-foreground/8 bg-[var(--surface)] shadow-soft">
                  <div className="aspect-square bg-paper-tint overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.photoUrl} alt={p.caption ?? 'Ảnh lớp Poolane'} className="w-full h-full object-cover" />
                  </div>
                  {p.caption && <p className="text-xs text-foreground/70 px-3 pt-2 line-clamp-2">{p.caption}</p>}
                  <p className="text-[10px] text-foreground/45 px-3 pb-2 pt-1">{format(p.createdAt, 'dd/MM/yyyy')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
