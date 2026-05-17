import Link from 'next/link'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Chip } from '@/components/ui/Chip'
import { PageHeader } from '@/components/ui/PageHeader'
import { ScrollReveal } from '@/components/motion/ScrollReveal'
import {
  COURSE_PRICES, COURSE_NAMES, COURSE_SESSIONS, POOL_TICKET,
  COURSE_SKILLS, CAPACITY,
} from '@/config/constants'
import { Check, Clock, Users, Trophy, ArrowRight, Waves } from 'lucide-react'

export const metadata = {
  title: 'Khoá học bơi · Poolane',
  description: 'Bơi Ếch · Bơi Sải · Bơi Bướm — mỗi khoá 10 buổi, hệ thống đánh giá 8-9 kỹ năng cốt lõi.',
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

const COURSES = [
  {
    code: 'ECH' as const,
    tag: 'Khởi đầu',
    intro: 'Khoá học vỡ lòng dành cho người chưa biết bơi hoặc bơi chưa đúng kỹ thuật. Sau 10 buổi, bạn có nền tảng vững để học các kỹ thuật khó hơn.',
    paymentPlans: [
      { label: 'Đóng toàn bộ', desc: 'Học phí + vé bơi cùng lúc khi đăng ký' },
      { label: 'Học phí trước, vé sau', desc: 'Đóng học phí khi đăng ký, vé bơi tại buổi 1' },
      { label: 'Cọc 30%', desc: 'Đóng 30% học phí, còn lại trước hoặc tại buổi 2' },
    ],
  },
  {
    code: 'SAI' as const,
    tag: 'Phổ biến',
    intro: 'Dành cho người đã bơi ếch thành thạo, muốn nâng cấp sang sải để bơi xa và nhanh hơn. Kỹ thuật high-elbow catch và thở 2 bên là điểm nhấn.',
    paymentPlans: [
      { label: 'Đóng toàn bộ', desc: 'Học phí + vé bơi cùng lúc' },
      { label: 'Học phí trước, vé sau', desc: 'Vé bơi tại buổi 1' },
      { label: 'Cọc 30%', desc: 'Đóng nốt trước buổi 2' },
    ],
  },
  {
    code: 'BUOM' as const,
    tag: 'Nâng cao',
    intro: 'Kỹ thuật khó nhất — đòi hỏi sức bền, kỹ thuật và sự kiên trì. Phù hợp với học viên đã có nền tảng tốt từ sải, muốn thử sức với bướm.',
    paymentPlans: [
      { label: 'Đóng toàn bộ', desc: 'Học phí + vé bơi cùng lúc' },
      { label: 'Học phí trước, vé sau', desc: 'Vé bơi tại buổi 1' },
      { label: 'Cọc 30%', desc: 'Đóng nốt trước buổi 2' },
    ],
  },
] as const

export default function CoursesPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12">
        <PageHeader
          eyebrow="3 hành trình · 1 phương pháp"
          title="Khoá học"
          display
          description="Poolane có 3 khoá học chính. Mỗi khoá 10 buổi, đánh giá kỹ năng theo thang chuẩn 1-5. Bạn có thể học song song nhiều khoá hoặc chọn đúng 1 khoá phù hợp nhu cầu."
          actions={
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-accent text-ink font-semibold px-5 py-3 rounded-pill hover:bg-accent/90 transition shadow-cta"
            >
              Đăng ký tư vấn <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          }
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 space-y-6 pb-16">
        {COURSES.map((c, idx) => {
          const price = COURSE_PRICES[c.code]
          const skills = COURSE_SKILLS[c.code]
          const sessions = COURSE_SESSIONS[c.code]
          return (
            <ScrollReveal key={c.code} delay={idx * 0.1} y={32}>
            <GlassPanel edge interactive className="overflow-hidden">
              <div className="grid md:grid-cols-[1fr_1.5fr]">
                {/* Left — name + price */}
                <div className="bg-ink text-paper p-6 lg:p-8 relative">
                  <div className="absolute top-5 right-5">
                    <Chip variant="accent">{c.tag}</Chip>
                  </div>
                  <p className="eyebrow opacity-60">0{idx + 1}</p>
                  <h2 className="font-heading text-4xl lg:text-5xl italic mt-2 mb-3">{COURSE_NAMES[c.code]}</h2>
                  <p className="text-sm text-paper/70 leading-relaxed">{c.intro}</p>

                  <div className="mt-6 space-y-1.5 text-sm">
                    <p className="inline-flex items-center gap-2 text-paper/75">
                      <Clock className="h-4 w-4" strokeWidth={1.75} /> {sessions} buổi học
                    </p>
                    <p className="inline-flex items-center gap-2 text-paper/75">
                      <Users className="h-4 w-4" strokeWidth={1.75} /> Lớp nhỏ {CAPACITY.MORNING_MAX}–{CAPACITY.EVENING_MAX} HV
                    </p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-paper/12">
                    <div className="font-heading text-3xl sm:text-4xl text-accent leading-none">{fmt(price)}</div>
                    <p className="text-xs text-paper/55 mt-1.5">+ vé bơi {fmt(POOL_TICKET.FIRST_PRICE)} (lần đầu, {POOL_TICKET.SESSIONS_INCLUDED} buổi)</p>
                  </div>
                </div>

                {/* Right — skills + payment + CTA */}
                <div className="p-6 lg:p-8 space-y-6">
                  <div>
                    <p className="eyebrow mb-3">Kỹ năng được đánh giá</p>
                    <div className="grid sm:grid-cols-2 gap-1.5">
                      {skills.map(s => (
                        <p key={s.key} className="text-sm inline-flex items-start gap-2 opacity-90">
                          <Check className="h-4 w-4 text-success shrink-0 mt-0.5" strokeWidth={2.25} />
                          {s.label}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="eyebrow mb-3">Phương án thanh toán</p>
                    <div className="space-y-2">
                      {c.paymentPlans.map((p, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-card bg-current/5 ring-1 ring-current/10">
                          <span className="grid place-items-center h-6 w-6 rounded-pill bg-accent text-ink text-xs font-bold shrink-0">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{p.label}</p>
                            <p className="text-xs opacity-65">{p.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap pt-2">
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-1.5 bg-ink text-paper font-semibold px-4 py-2.5 rounded-pill text-sm hover:bg-foreground/90 transition"
                    >
                      Đăng ký tài khoản <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </Link>
                    <Link
                      href="/faq"
                      className="inline-flex items-center px-4 py-2.5 rounded-pill ring-1 ring-current/20 text-sm font-medium hover:bg-current/5 transition"
                    >
                      Câu hỏi thường gặp
                    </Link>
                  </div>
                </div>
              </div>
            </GlassPanel>
            </ScrollReveal>
          )
        })}
      </section>

      {/* ── TIÊU CHÍ TỐT NGHIỆP ──────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 pb-20">
        <div className="rounded-card-xl bg-ink text-paper p-8 sm:p-12 text-center shadow-glass relative overflow-hidden">
<Trophy className="relative h-8 w-8 mx-auto mb-4 text-accent" strokeWidth={1.5} />
          <h2 className="relative font-heading text-3xl sm:text-4xl italic mb-4">Tiêu chí tốt nghiệp</h2>
          <p className="relative text-paper/75 text-base leading-relaxed max-w-2xl mx-auto">
            Học viên cần đạt <strong className="text-paper">≥ 3/5</strong> ở mọi kỹ năng, <strong className="text-paper">≥ 4/5</strong> ở phối hợp và thở, bơi liên tục <strong className="text-paper">≥ 25m</strong> đúng kiểu, và được giáo viên xác nhận. Chưa đạt sau buổi 10? Bạn được học thêm trong giai đoạn ôn luyện — chỉ trả vé bơi, <strong className="text-paper">không tốn học phí</strong>.
          </p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-card-xl bg-gradient-to-br from-accent to-accent-soft text-foreground p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-cta">
          <div className="max-w-xl">
            <p className="eyebrow mb-2 opacity-70">Sẵn sàng bắt đầu?</p>
            <h3 className="font-heading text-3xl sm:text-4xl italic leading-tight">
              Tạo tài khoản, lớp sẽ liên hệ tư vấn miễn phí trong 24h.
            </h3>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-ink text-paper font-semibold px-6 py-3.5 rounded-pill hover:bg-foreground/90 transition"
            >
              Đăng ký <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-pill ring-1 ring-foreground/20 hover:bg-foreground/5 transition"
            >
              <Waves className="h-4 w-4" strokeWidth={1.75} /> Về trang chính
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
