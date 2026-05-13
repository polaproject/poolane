import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Calendar, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default async function AdminEventsPage() {
  await requireRole(['admin', 'staff'])
  const events = await prisma.event.findMany({ orderBy: { date: 'desc' }, take: 50 })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Sự kiện</h1>
        <Link href="/admin/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg text-sm font-semibold hover:bg-[#1C2B4A]/90">
          <Plus className="w-4 h-4" /> Tạo sự kiện
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 p-8 text-center">
          <Calendar className="w-10 h-10 text-[#1C2B4A]/20 mx-auto mb-3" />
          <p className="text-sm text-[#1C2B4A]/50">Chưa có sự kiện nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(e => (
            <div key={e.id} className="bg-white rounded-2xl border border-[#1C2B4A]/8 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <h2 className="font-semibold text-[#1C2B4A]">{e.name}</h2>
                <span className="text-xs text-[#1C2B4A]/50">
                  {format(e.date, 'dd/MM/yyyy', { locale: vi })}
                </span>
              </div>
              {e.description && <p className="text-sm text-[#1C2B4A]/70 mb-2">{e.description}</p>}
              {e.participantCount && (
                <p className="text-xs text-[#5B8E9F]">👥 {e.participantCount} người tham gia</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
