import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PhotoUploadForm } from './PhotoUploadForm'
import { format } from 'date-fns'

export default async function AdminPhotosPage() {
  await requireRole(['admin', 'staff'])

  const photos = await prisma.sessionPhoto.findMany({
    orderBy: { createdAt: 'desc' },
    take: 60,
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Album ảnh lớp</h1>
        <p className="text-sm text-[#1C2B4A]/50 mt-1">Upload ảnh để học viên xem trong tab Cộng đồng</p>
      </div>

      <PhotoUploadForm />

      <div className="mt-8">
        <h2 className="font-semibold text-[#1C2B4A] mb-3">Album hiện có ({photos.length})</h2>
        {photos.length === 0 ? (
          <p className="text-sm text-[#1C2B4A]/40">Chưa có ảnh nào</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-[#1C2B4A]/8 overflow-hidden">
                <div className="aspect-square bg-[#F6F1EA]/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photoUrl} alt={p.caption ?? ''} className="w-full h-full object-cover" />
                </div>
                {p.caption && <p className="text-xs text-[#1C2B4A]/70 p-2 line-clamp-2">{p.caption}</p>}
                <p className="text-[10px] text-[#1C2B4A]/40 px-2 pb-2">{format(p.createdAt, 'dd/MM/yyyy')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
