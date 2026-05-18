import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Calendar, Users, Star } from 'lucide-react'
import { format, isFuture } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Chip } from '@/components/ui/Chip'

export default async function StudentEventsPage() {
  await requireRole(['student'])
  const events = await prisma.event.findMany({ orderBy: { date: 'desc' }, take: 50 })
  const upcoming = events.filter(e => isFuture(e.date))
  const past = events.filter(e => !isFuture(e.date))

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-3xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2">Cộng đồng · {events.length} sự kiện</p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Sự kiện Poolane</h1>
          <p className="text-sm text-paper/65 mt-2">Minigame, gặp gỡ cộng đồng, kết nối ngoài hồ.</p>
        </div>
      </div>

      <div className="px-5 sm:px-8 -mt-6 max-w-3xl mx-auto space-y-6 relative z-10">
        {events.length === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <Star className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">Chưa có sự kiện</p>
            <p className="text-sm text-foreground/55">Lớp đang lên kế hoạch sự kiện đầu tiên.</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <Section eyebrow="Sắp tới" title="Sự kiện sắp diễn ra" highlight>
                {upcoming.map(e => <EventCard key={e.id} e={e} upcoming />)}
              </Section>
            )}
            {past.length > 0 && (
              <Section eyebrow="Đã qua" title="Lưu lại kỷ niệm">
                {past.map(e => <EventCard key={e.id} e={e} />)}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Section({
  eyebrow, title, children, highlight,
}: { eyebrow: string; title: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <section>
      <header className="mb-3 flex items-center gap-2">
        <Calendar className={`h-4 w-4 ${highlight ? 'text-accent' : 'text-foreground/55'}`} strokeWidth={1.75} />
        <div>
          <p className="eyebrow text-foreground/55">{eyebrow}</p>
          <h2 className="lqg-headline text-xl text-foreground mt-0.5">{title}</h2>
        </div>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EventCard({ e, upcoming }: { e: any; upcoming?: boolean }) {
  return (
    <div className={`rounded-card-lg bg-[var(--surface)] shadow-soft p-5 ${upcoming ? 'ring-1 ring-accent/30' : 'ring-1 ring-foreground/8 opacity-90'}`}>
      <div className="flex items-start gap-4">
        <div className="text-center w-14 shrink-0">
          <div className="text-[10px] tracking-widest uppercase text-accent">
            {format(e.date, 'MMM', { locale: vi })}
          </div>
          <div className="lqg-headline text-3xl text-foreground leading-none mt-0.5">
            {format(e.date, 'dd', { locale: vi })}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="lqg-headline text-xl text-foreground leading-tight">{e.name}</h3>
          {e.description && <p className="text-sm text-foreground/65 mt-2 leading-relaxed">{e.description}</p>}
          {e.participantCount && (
            <div className="mt-3">
              <Chip variant="mist">
                <Users className="h-3 w-3" strokeWidth={2.25} /> {e.participantCount} đã tham gia
              </Chip>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
