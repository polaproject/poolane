import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ImageIcon } from 'lucide-react'
import { format } from 'date-fns'

export default async function StudentPhotosPage() {
  await requireRole(['student'])

  const photos = await prisma.sessionPhoto.findMany({
    where: { visibleTo: 'all_students' },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <h1 className="font-heading text-2xl text-[#F6F1EA]">Album ảnh lớp</h1>
        <p className="text-[#F6F1EA]/50 text-xs mt-1">Khoảnh khắc cùng cộng đồng Poolane 📸</p>
      </div>

      <div className="px-4 -mt-4 max-w-5xl mx-auto">
        {photos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <ImageIcon className="w-10 h-10 text-[#1C2B4A]/20 mx-auto mb-3" />
            <p className="text-sm text-[#1C2B4A]/50">Chưa có ảnh nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {photos.map(p => (
              <a key={p.id} href={p.photoUrl} target="_blank" rel="noopener"
                className="group block bg-white rounded-xl border border-[#1C2B4A]/8 overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-[#F6F1EA]/40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photoUrl} alt={p.caption ?? ''}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                {p.caption && (
                  <p className="text-xs text-[#1C2B4A]/70 px-2 py-1.5 line-clamp-2">{p.caption}</p>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
