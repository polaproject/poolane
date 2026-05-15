import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser, getDashboardPath } from '@/lib/auth'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { FloatingCard } from '@/components/ui/FloatingCard'
import { Chip } from '@/components/ui/Chip'
import { StarField } from '@/components/brand/StarField'
import { ScrollReveal } from '@/components/motion/ScrollReveal'
import { Stagger } from '@/components/motion/Stagger'
import { TiltCard } from '@/components/ui/TiltCard'
import { COURSE_PRICES, COURSE_NAMES, POOL_TICKET } from '@/config/constants'
import {
  ArrowRight, Sparkles, Star, Users, ShieldCheck, Compass,
  Calendar, Waves, BookOpen,
} from 'lucide-react'

export const metadata = {
  title: 'Poolane — Học bơi cùng cộng đồng người lớn',
  description: 'Lớp dạy bơi cho người lớn 16-40 tuổi. Bơi Ếch, Sải, Bướm — hệ thống đánh giá kỹ năng chuẩn hoá, theo dõi tiến độ trực quan.',
  openGraph: {
    title: 'Poolane — Học bơi cùng cộng đồng',
    description: 'Dạy bơi không chỉ để bơi — kết nối thân với tâm.',
    type: 'website',
  },
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

const COURSES = [
  {
    code: 'ECH' as const,
    tag: 'Khởi đầu',
    desc: 'Bơi cơ bản, làm quen với nước. Học cách thở dài, đạp chân ếch chuẩn, lướt nước thư giãn.',
    skills: ['Tư thế thân', 'Đạp chân ếch', 'Phối hợp thở', 'Quay đầu hồ'],
  },
  {
    code: 'SAI' as const,
    tag: 'Phổ biến',
    desc: 'Bơi nhanh, hiệu quả. Vào tay - kéo nước - thở nghiêng 2 bên với kỹ thuật high-elbow catch.',
    skills: ['Xoay hông', 'High elbow catch', 'Thở 2 bên', 'Sức bền tốc độ'],
  },
  {
    code: 'BUOM' as const,
    tag: 'Nâng cao',
    desc: 'Kỹ thuật khó nhất. Sóng người, đạp cá heo, nhịp điệu liền mạch và sức bền.',
    skills: ['Sóng người', 'Đạp cá heo', 'Phục hồi tay', 'Nhịp điệu'],
  },
]

const JOURNEY = [
  { step: '01', title: 'Tạo tài khoản', desc: 'Đăng ký online trong 1 phút, không cần xác minh phức tạp.' },
  { step: '02', title: 'Tư vấn miễn phí', desc: 'Lớp liên hệ qua Zalo để hiểu nhu cầu và đề xuất khoá phù hợp.' },
  { step: '03', title: 'Học 10 buổi chuẩn', desc: 'Lớp tối đa 5-7 HV, đánh giá kỹ năng sau mỗi buổi, video kỹ thuật cá nhân.' },
  { step: '04', title: 'Tốt nghiệp', desc: 'Bơi tự do, không lo nước. Chưa đạt? Ôn luyện miễn học phí.' },
]

export default async function LandingPage() {
  const user = await getCurrentUser()
  if (user) redirect(getDashboardPath(user.role))

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 lg:pt-24">
        {/* Star field — chỉ render trong vùng hero */}
        <StarField density={28} className="text-accent/60" />
        <div className="relative grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center">
          {/* Left — copy */}
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 text-xs tracking-[0.25em] uppercase px-3 py-1.5 rounded-pill glass-pill">
              <Sparkles className="h-3.5 w-3.5 text-accent" strokeWidth={2.25} />
              Pola Project · Poolane
            </div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
              Học bơi <span className="italic">không chỉ</span><br />
              <span className="italic">để bơi.</span>
            </h1>
            <p className="text-lg sm:text-xl opacity-80 max-w-xl leading-relaxed">
              Lớp dạy bơi cho người lớn 16–40 tuổi. Kết nối thân với tâm, xây dựng cộng đồng cùng tiến bộ — không khí nhẹ nhàng mở đầu cho một buổi tối bình yên.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-accent text-ink font-semibold px-6 py-3.5 rounded-pill hover:bg-accent/90 transition shadow-cta"
              >
                Đăng ký tư vấn <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-pill ring-1 ring-current/20 hover:bg-current/5 transition"
              >
                Xem 3 khoá học
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-sm opacity-70">
              <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 text-accent fill-accent" strokeWidth={0} /> 4.9 / 5 đánh giá</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" strokeWidth={1.75} /> 200+ học viên</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" strokeWidth={1.75} /> 1-1 review kỹ thuật</span>
            </div>
          </div>

          {/* Right — floating glass panel stack */}
          <div className="relative lg:pl-6">
            <GlassPanel edge className="p-6 lg:p-7">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="eyebrow">Lịch tuần này</p>
                  <p className="lqg-headline text-2xl mt-0.5">Mở đăng ký</p>
                </div>
                <Chip variant="accent" active>
                  <Waves className="h-3 w-3" /> Đang mở
                </Chip>
              </div>
              <div className="space-y-2.5">
                {[
                  { day: 'T2', date: '—', time: '18:00 – 20:00', course: 'Bơi Sải' },
                  { day: 'T4', date: '—', time: '18:00 – 20:00', course: 'Bơi Ếch', active: true },
                  { day: 'T6', date: '—', time: '05:30 – 07:30', course: 'Bơi Bướm' },
                ].map((s, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-card transition ${
                      s.active ? 'bg-paper-tint text-ink ring-1 ring-accent/30' : 'bg-current/5 hover:bg-current/8'
                    }`}
                  >
                    <div className="text-center w-11 shrink-0">
                      <div className="text-[10px] tracking-widest uppercase opacity-60">{s.day}</div>
                      <Calendar className="h-4 w-4 mx-auto mt-1 opacity-70" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{s.course}</div>
                      <div className="text-xs opacity-75">{s.time}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-50" strokeWidth={1.75} />
                  </div>
                ))}
              </div>
            </GlassPanel>

            <div className="absolute -bottom-6 -left-6 lg:-left-10 hidden sm:block">
              <FloatingCard
                icon={Compass}
                label="Đăng ký 1 phút"
                title="Tư vấn miễn phí"
                meta="Trả lời trong 24h"
                action={{ label: 'Đăng ký', href: '/register' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 KHOÁ ───────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <ScrollReveal>
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="eyebrow mb-2">3 hành trình</p>
              <h2 className="font-heading text-3xl sm:text-4xl italic">Chọn khoá hợp với bạn</h2>
            </div>
            <Link href="/courses" className="hidden sm:inline-flex items-center gap-1.5 text-sm opacity-80 hover:opacity-100">
              Xem chi tiết <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </Link>
          </div>
        </ScrollReveal>

        <Stagger step={0.12} className="grid md:grid-cols-3 gap-5">
          {COURSES.map((c, i) => (
            <GlassPanel
              key={c.code}
              interactive
              className="group relative p-6"
            >
              <div className="absolute top-5 right-5">
                <Chip variant="accent">{c.tag}</Chip>
              </div>
              <div className="eyebrow mb-1">0{i + 1}</div>
              <h3 className="lqg-headline text-3xl mb-1.5">{COURSE_NAMES[c.code]}</h3>
              <p className="text-sm opacity-70 leading-relaxed mb-5">{c.desc}</p>

              <ul className="space-y-1.5 mb-6">
                {c.skills.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-sm opacity-80">
                    <span className="h-1 w-1 rounded-full bg-accent" /> {s}
                  </li>
                ))}
              </ul>

              <div className="flex items-end justify-between pt-4 border-t border-current/10">
                <div>
                  <div className="font-heading text-2xl">{fmt(COURSE_PRICES[c.code])}</div>
                  <div className="text-xs opacity-75">10 buổi · vé bơi {fmt(POOL_TICKET.FIRST_PRICE)}</div>
                </div>
                <Link
                  href="/courses"
                  className="grid place-items-center h-10 w-10 rounded-pill bg-accent text-ink group-hover:scale-110 transition"
                  aria-label={`Xem chi tiết ${COURSE_NAMES[c.code]}`}
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </Link>
              </div>
            </GlassPanel>
          ))}
        </Stagger>
      </section>

      {/* ── VÌ SAO CHỌN POOLANE ──────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="eyebrow mb-2">Vì sao chọn Poolane</p>
            <h2 className="font-heading text-3xl sm:text-4xl italic">Không chỉ là một lớp học bơi</h2>
          </div>
        </ScrollReveal>
        <Stagger step={0.1} className="grid md:grid-cols-3 gap-5">
          <Feature
            icon={Users}
            title="Lớp nhỏ, tận tâm"
            desc="Tối đa 5 (sáng) / 7 (chiều) học viên. Mỗi người được giáo viên quan sát và sửa kỹ thuật trực tiếp."
          />
          <Feature
            icon={Sparkles}
            title="Đánh giá chuẩn hoá"
            desc="8-9 kỹ năng cốt lõi cho mỗi khoá, thang điểm 1-5, theo dõi tiến độ qua radar chart cá nhân."
          />
          <Feature
            icon={ShieldCheck}
            title="Cam kết tốt nghiệp"
            desc="Chưa đạt sau buổi 10? Bạn được học thêm — chỉ trả vé bơi, không tốn thêm học phí."
          />
        </Stagger>
      </section>

      {/* ── HÀNH TRÌNH ───────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="eyebrow mb-2">Hành trình của bạn</p>
            <h2 className="font-heading text-3xl sm:text-4xl italic">4 bước để bắt đầu bơi cùng Poolane</h2>
          </div>
        </ScrollReveal>
        <Stagger step={0.08} className="grid md:grid-cols-4 gap-4">
          {JOURNEY.map((s) => (
            <div key={s.step} className="rounded-card-lg bg-current/5 ring-1 ring-current/10 p-5 backdrop-blur-sm transition-all duration-300 [transition-timing-function:var(--ease-spring-soft)] hover:-translate-y-1 hover:bg-current/10">
              <p className="lqg-headline text-5xl text-accent leading-none mb-3">{s.step}</p>
              <h3 className="font-semibold mb-1.5">{s.title}</h3>
              <p className="text-sm opacity-70 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </Stagger>
      </section>

      {/* ── TRIẾT LÝ ─────────────────────────────────────── */}
      <section className="relative mx-auto max-w-4xl px-4 pb-24">
        <ScrollReveal y={32} duration={0.7}>
          <TiltCard maxTilt={4}>
            <GlassPanel edge className="p-8 sm:p-12 text-center">
              <Star className="h-6 w-6 mx-auto mb-5 text-accent motion-twinkle" strokeWidth={1.5} fill="currentColor" />
              <blockquote className="font-heading italic text-2xl sm:text-3xl leading-snug max-w-3xl mx-auto mb-4">
                &ldquo;Pola = Polaris — ngôi sao Bắc Đẩu, đứng yên giữa bầu trời, dẫn đường cho người lênh đênh trên biển khơi tìm đúng hướng đi.&rdquo;
              </blockquote>
              <p className="text-sm opacity-70">Triết lý của Pola Project</p>
            </GlassPanel>
          </TiltCard>
        </ScrollReveal>
      </section>

      {/* ── CTA BAND ─────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <ScrollReveal y={20}>
        <div className="rounded-card-xl bg-gradient-to-br from-accent to-accent-soft text-foreground p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-cta">
          <div className="max-w-xl">
            <p className="eyebrow mb-2 opacity-70">Bắt đầu từ buổi tư vấn miễn phí</p>
            <h3 className="font-heading text-3xl sm:text-4xl italic leading-tight">
              Nói với mình bạn đang ở đâu, mình sẽ chỉ đường.
            </h3>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-ink text-paper font-semibold px-6 py-3.5 rounded-pill hover:bg-foreground/90 transition"
            >
              Đặt lịch tư vấn <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-pill ring-1 ring-foreground/20 hover:bg-foreground/5 transition"
            >
              <BookOpen className="h-4 w-4" strokeWidth={1.75} /> Đọc blog
            </Link>
          </div>
        </div>
        </ScrollReveal>
      </section>
    </>
  )
}

function Feature({
  icon: Icon, title, desc,
}: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; title: string; desc: string }) {
  return (
    <div className="rounded-card-lg bg-current/5 ring-1 ring-current/10 p-6 text-center backdrop-blur-sm">
      <div className="inline-grid place-items-center h-12 w-12 rounded-pill bg-accent/15 mb-4">
        <Icon className="h-6 w-6 text-accent" strokeWidth={1.75} />
      </div>
      <h3 className="lqg-headline text-xl mb-1.5">{title}</h3>
      <p className="text-sm opacity-70 leading-relaxed">{desc}</p>
    </div>
  )
}
