import Link from 'next/link'
import { Calendar, Sparkles, Star, TrendingUp, Users, Waves, BookOpen, ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Chip } from '@/components/ui/Chip'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { StatCard } from '@/components/ui/StatCard'
import { FloatingCard } from '@/components/ui/FloatingCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'

const SWATCHES = [
  { token: 'ink',         className: 'bg-ink text-paper' },
  { token: 'ink-soft',    className: 'bg-ink-soft text-paper' },
  { token: 'paper',       className: 'bg-paper text-ink ring-1 ring-ink/10' },
  { token: 'paper-tint',  className: 'bg-paper-tint text-ink ring-1 ring-ink/10' },
  { token: 'accent',      className: 'bg-accent text-ink' },
  { token: 'accent-soft', className: 'bg-accent-soft text-ink' },
  { token: 'mist',        className: 'bg-mist text-paper' },
  { token: 'success',     className: 'bg-success text-paper' },
  { token: 'warn',        className: 'bg-warn text-paper' },
  { token: 'danger',      className: 'bg-danger text-paper' },
]

export default function PreviewPage() {
  return (
    <main className="ambient-bg min-h-screen pb-20">
      {/* Floating glass nav with theme switcher */}
      <header className="sticky top-4 z-40 px-4">
        <nav className="mx-auto max-w-6xl glass-pill px-3 py-2 flex items-center gap-2">
          <Link href="/sandbox" className="flex items-center gap-2 pl-3 pr-4 py-1.5 text-sm">
            <span className="grid place-items-center h-8 w-8 rounded-pill bg-accent text-ink">
              <Sparkles className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span className="font-heading italic text-xl leading-none">Preview</span>
          </Link>
          <span className="hidden sm:inline-block text-xs opacity-60 ml-2">
            Phase 1 foundation · toggle theme để verify
          </span>
          <div className="ml-auto">
            <ThemeSwitcher />
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-12 space-y-12">
        <PageHeader
          eyebrow="Sandbox · Phase 1"
          title="Design tokens & primitives"
          display
          description="Toggle giao diện A ↔ B ở góc trên để xác nhận mọi token, primitive, và utility chuyển palette mượt. Trang này sẽ bị xoá khi vào Phase 2."
          actions={
            <Link
              href="/sandbox"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill ring-1 ring-current/20 text-sm hover:bg-current/5 transition"
            >
              ← Sandbox
            </Link>
          }
        />

        {/* Swatches */}
        <section className="space-y-4">
          <p className="eyebrow">Palette tokens</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {SWATCHES.map(s => (
              <div
                key={s.token}
                className={`rounded-card aspect-[5/3] p-3 flex flex-col justify-between text-xs font-medium ${s.className}`}
              >
                <span className="opacity-80 font-mono">{s.token}</span>
                <span className="font-heading text-base italic">Poolane</span>
              </div>
            ))}
          </div>
        </section>

        {/* Stat cards */}
        <section className="space-y-4">
          <p className="eyebrow">Stat cards</p>
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard label="Học viên tuần này" value="42" trend={8} trendLabel="vs tuần trước" icon={Users} />
            <StatCard label="Doanh thu tháng" value="12.4M" unit="đ" trend={-3} trendLabel="vs tháng trước" icon={TrendingUp} tone="dark" />
            <StatCard label="Vé bơi đã bán" value="186" trend={12} trendLabel="vs tháng trước" icon={Waves} tone="accent" />
          </div>
        </section>

        {/* Chips */}
        <section className="space-y-4">
          <p className="eyebrow">Chips</p>
          <div className="flex flex-wrap gap-2">
            <Chip active>Tất cả</Chip>
            <Chip>Hôm nay</Chip>
            <Chip>Tuần này</Chip>
            <Chip variant="accent">Bơi Ếch</Chip>
            <Chip variant="mist">Bơi Sải</Chip>
            <Chip variant="success">Đã thanh toán</Chip>
            <Chip variant="warn">Nợ học phí</Chip>
            <Chip variant="danger">Quá hạn</Chip>
          </div>
        </section>

        {/* Glass panel demo with floating card */}
        <section className="space-y-4">
          <p className="eyebrow">Glass panel + floating card</p>
          <div className="relative">
            <GlassPanel edge className="p-6 lg:p-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="eyebrow">Lịch tuần này</p>
                  <p className="font-heading italic text-2xl mt-1">Tuần 14 → 20 / 05</p>
                </div>
                <Chip variant="accent" active>
                  <Waves className="h-3 w-3" /> Đang mở
                </Chip>
              </div>
              <div className="space-y-2.5">
                {[
                  { day: 'T2', date: '14', time: '18:00 – 20:00', course: 'Bơi Sải', slots: '5 / 7' },
                  { day: 'T4', date: '16', time: '18:00 – 20:00', course: 'Bơi Ếch', slots: '4 / 7', active: true },
                  { day: 'T6', date: '18', time: '05:30 – 07:30', course: 'Bơi Bướm', slots: '2 / 5' },
                ].map((s) => (
                  <div
                    key={s.date}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-card transition ${
                      s.active ? 'bg-paper-tint text-ink ring-1 ring-accent/30' : 'bg-current/5 hover:bg-current/8'
                    }`}
                  >
                    <div className="text-center w-11 shrink-0">
                      <div className="text-[10px] tracking-widest uppercase opacity-60">{s.day}</div>
                      <div className="font-heading text-2xl leading-none italic">{s.date}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{s.course}</div>
                      <div className="text-xs opacity-60">{s.time}</div>
                    </div>
                    <Chip variant="mist">{s.slots}</Chip>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <div className="absolute -bottom-6 -right-6 hidden sm:block">
              <FloatingCard
                icon={Calendar}
                label="Buổi tiếp theo"
                title="18:00 hôm nay · Bơi Ếch"
                meta="4 / 7 chỗ đã giữ"
                action={{ label: 'Vào lớp', href: '#' }}
              />
            </div>
          </div>
        </section>

        {/* Empty state */}
        <section className="space-y-4">
          <p className="eyebrow">Empty state</p>
          <div className="rounded-card-lg bg-paper ring-1 ring-ink/8">
            <EmptyState
              icon={Star}
              title="Chưa có thử thách nào"
              description="Khi admin tạo thử thách tháng, danh sách sẽ hiện ở đây."
              action={{ label: 'Khám phá blog', href: '/blog' }}
            />
          </div>
        </section>

        {/* CTA band */}
        <section>
          <div className="rounded-card-xl bg-gradient-to-br from-accent to-accent-soft text-ink p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-cta">
            <div className="max-w-xl">
              <p className="eyebrow mb-2">Foundation đã sẵn sàng</p>
              <h3 className="font-heading text-2xl sm:text-3xl italic leading-tight">
                Mọi token, primitive, utility đều theme-aware.
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="inline-flex items-center gap-2 bg-ink text-paper font-semibold px-5 py-3 rounded-pill hover:bg-ink/90 transition">
                Về trang chính <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              <Link href="/sandbox/hero-a" className="inline-flex items-center gap-2 px-5 py-3 rounded-pill ring-1 ring-ink/20 hover:bg-ink/5 transition">
                <BookOpen className="h-4 w-4" /> Hero A
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
