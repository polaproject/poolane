import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Calendar, Plus, Users } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Chip } from '@/components/ui/Chip'

export default async function AdminEventsPage() {
  await requireRole(['admin', 'staff'])
  const events = await prisma.event.findMany({ orderBy: { date: 'desc' }, take: 50 })

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-4xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2">{events.length} sự kiện</p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Sự kiện</h1>
          </div>
          <Link
            href="/admin/events/new"
            className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2.5 rounded-pill text-sm hover:bg-accent/90 transition shadow-cta"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Tạo sự kiện
          </Link>
        </div>
      </div>

      <div className="px-5 sm:px-8 -mt-6 max-w-4xl mx-auto relative z-10">
        {events.length === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">Chưa có sự kiện</p>
            <p className="text-sm text-foreground/55">Tạo sự kiện minigame/cộng đồng đầu tiên.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(e => (
              <div key={e.id} className="glass-card glass-card-hover p-5 flex items-start gap-4">
                <div className="text-center w-14 shrink-0">
                  <div className="text-[10px] tracking-widest uppercase text-accent">
                    {format(e.date, 'MMM', { locale: vi })}
                  </div>
                  <div className="lqg-headline text-3xl text-foreground leading-none mt-0.5">
                    {format(e.date, 'dd', { locale: vi })}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="lqg-headline text-xl text-foreground leading-tight">{e.name}</h2>
                  {e.description && <p className="text-sm text-foreground/65 mt-2 leading-relaxed">{e.description}</p>}
                  {e.participantCount && (
                    <div className="mt-3">
                      <Chip variant="mist">
                        <Users className="h-3 w-3" strokeWidth={2.25} /> {e.participantCount} người
                      </Chip>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
