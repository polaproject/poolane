import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Calendar } from 'lucide-react'
import { format, isFuture } from 'date-fns'
import { vi } from 'date-fns/locale'

export default async function StudentEventsPage() {
  await requireRole(['student'])
  const events = await prisma.event.findMany({ orderBy: { date: 'desc' }, take: 50 })
  const upcoming = events.filter(e => isFuture(e.date))
  const past = events.filter(e => !isFuture(e.date))

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <h1 className="font-heading text-2xl text-[#F6F1EA]">Sự kiện Poolane</h1>
        <p className="text-[#F6F1EA]/50 text-xs mt-1">Minigame, gặp gỡ cộng đồng</p>
      </div>

      <div className="px-4 -mt-4 max-w-2xl mx-auto space-y-4">
        <Section title="Sắp tới" events={upcoming} highlight />
        <Section title="Đã qua" events={past} />
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Section({ title, events, highlight }: { title: string; events: any[]; highlight?: boolean }) {
  if (events.length === 0) return null
  return (
    <div>
      <h2 className="text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-2">{title}</h2>
      <div className="space-y-3">
        {events.map(e => (
          <div key={e.id} className={`bg-white rounded-2xl shadow-sm border p-4 ${highlight ? 'border-[#C8A84B]/40' : 'border-[#1C2B4A]/8'}`}>
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-[#1C2B4A]">{e.name}</h3>
              <span className="text-xs text-[#1C2B4A]/50 ml-2">
                {format(e.date, 'dd/MM', { locale: vi })}
              </span>
            </div>
            {e.description && <p className="text-sm text-[#1C2B4A]/70 mt-2">{e.description}</p>}
            {e.participantCount && (
              <p className="text-xs text-[#5B8E9F] mt-2">👥 {e.participantCount} người đã tham gia</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
