'use client'

import { useState } from 'react'
import { Sun, Moon, ArrowRight, Sparkles, Waves, ShieldCheck, Star, Quote, ChevronRight } from 'lucide-react'
import { AmbientMesh } from './components/AmbientMesh'
import { GlassCard } from './components/GlassCard'
import { GlassButton } from './components/GlassButton'
import { GlassInput } from './components/GlassInput'
import { RefinedNumber } from './components/RefinedNumber'

export default function LiquidGlassSandbox() {
  const [isDark, setIsDark] = useState(false)

  return (
    <div className={`lqg-root ${isDark ? 'lqg-dark' : ''} relative min-h-screen overflow-x-hidden`}>
      <AmbientMesh />

      {/* Theme toggle — góc trên phải */}
      <button
        onClick={() => setIsDark(v => !v)}
        aria-label={isDark ? 'Sang sáng' : 'Sang tối'}
        className="fixed top-6 right-6 z-50 grid place-items-center w-11 h-11 rounded-full"
        style={{
          background: 'var(--lqg-bg-glass-strong)',
          backdropFilter: 'var(--lqg-lens-light)',
          border: '1px solid var(--lqg-edge-hi)',
          boxShadow: 'var(--lqg-shadow-card)',
          color: 'var(--lqg-text-primary)',
          transition: 'transform 250ms var(--lqg-ease-overshoot)',
        }}
      >
        {isDark ? <Sun className="w-5 h-5" strokeWidth={2} /> : <Moon className="w-5 h-5" strokeWidth={2} />}
      </button>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-32">

        {/* ───────── SECTION 1 — HERO ───────── */}
        <section className="grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
          <div className="space-y-8">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs uppercase tracking-[0.2em]"
              style={{
                background: 'var(--lqg-bg-glass)',
                backdropFilter: 'var(--lqg-lens-light)',
                border: '1px solid var(--lqg-edge-hi)',
                color: 'var(--lqg-text-secondary)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--lqg-accent)' }} strokeWidth={2.5} />
              Pola Project · Liquid Glass
            </div>

            <h1
              className="lqg-display"
              style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', position: 'relative' }}
            >
              Học bơi <span style={{ color: 'var(--lqg-accent)' }}>không chỉ</span><br />
              để bơi.
              <span
                aria-hidden
                className="lqg-specular"
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              />
            </h1>

            <p
              className="max-w-xl text-lg leading-relaxed"
              style={{ color: 'var(--lqg-text-secondary)' }}
            >
              Lớp dạy bơi cho người lớn 16–40 tuổi. Kết nối thân với tâm, xây dựng cộng đồng cùng tiến bộ — không khí nhẹ nhàng mở đầu cho buổi tối bình yên.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <GlassButton variant="primary" size="lg">
                Đăng ký tư vấn <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </GlassButton>
              <GlassButton variant="secondary" size="lg">
                Xem 3 khoá học
              </GlassButton>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ color: 'var(--lqg-text-tertiary)' }}>
              <span className="inline-flex items-center gap-1.5">
                <Star className="w-4 h-4" style={{ color: 'var(--lqg-accent)' }} fill="currentColor" strokeWidth={0} />
                4.9/5 đánh giá
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" strokeWidth={1.75} /> 1-1 review kỹ thuật
              </span>
            </div>
          </div>

          {/* Right — Floating glass cards */}
          <div className="relative h-[480px]">
            <GlassCard
              tier="heavy"
              radius="xl"
              className="absolute top-0 right-0 w-[85%] p-6"
            >
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--lqg-text-tertiary)' }}>
                Lịch tuần này
              </p>
              <h3 className="lqg-display mb-5" style={{ fontSize: '1.5rem' }}>Mở đăng ký</h3>
              <div className="space-y-2.5">
                {[
                  { day: 'T2', time: '18:00 — 20:00', course: 'Bơi Sải' },
                  { day: 'T4', time: '18:00 — 20:00', course: 'Bơi Ếch', active: true },
                  { day: 'T6', time: '05:30 — 07:30', course: 'Bơi Bướm' },
                ].map(s => (
                  <div
                    key={s.day}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
                    style={{
                      background: s.active ? 'var(--lqg-accent-soft)' : 'var(--lqg-bg-glass)',
                      border: s.active ? '1px solid var(--lqg-accent)' : '1px solid var(--lqg-edge-hi)',
                    }}
                  >
                    <span
                      className="w-8 h-8 grid place-items-center rounded-xl text-xs font-bold"
                      style={{
                        background: s.active ? 'var(--lqg-accent)' : 'var(--lqg-bg-glass-strong)',
                        color: s.active ? 'var(--lqg-text-on-accent)' : 'var(--lqg-text-primary)',
                      }}
                    >
                      {s.day}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--lqg-text-primary)' }}>{s.course}</p>
                      <p className="text-xs" style={{ color: 'var(--lqg-text-secondary)' }}>{s.time}</p>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--lqg-text-tertiary)' }} strokeWidth={2} />
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard
              tier="medium"
              radius="xl"
              className="absolute bottom-0 left-0 w-[70%] p-5"
              specular={false}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl grid place-items-center"
                  style={{
                    background: 'linear-gradient(135deg, var(--lqg-accent), var(--lqg-accent-deep))',
                    color: 'var(--lqg-text-on-accent)',
                  }}
                >
                  <Waves className="w-6 h-6" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--lqg-text-tertiary)' }}>Đăng ký 1 phút</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--lqg-text-primary)' }}>Tư vấn miễn phí</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* ───────── SECTION 2 — CARD STACK ───────── */}
        <section>
          <header className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.25em] mb-3" style={{ color: 'var(--lqg-text-tertiary)' }}>
              Multi-tier glass
            </p>
            <h2 className="lqg-display" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}>
              Ba chặng đường, một dòng chảy.
            </h2>
          </header>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { code: 'ECH', name: 'Bơi Ếch', tag: 'Khởi đầu', price: '1.600.000đ', desc: 'Bơi cơ bản, làm quen với nước. Học thở, đạp chân, lướt nước thư giãn.', tier: 'light' as const },
              { code: 'SAI', name: 'Bơi Sải', tag: 'Phổ biến', price: '2.100.000đ', desc: 'Bơi nhanh, hiệu quả. Vào tay — kéo nước — thở nghiêng 2 bên.', tier: 'medium' as const },
              { code: 'BUOM', name: 'Bơi Bướm', tag: 'Nâng cao', price: '3.500.000đ', desc: 'Kỹ thuật khó nhất. Sóng người, đạp cá heo, nhịp điệu liền mạch.', tier: 'heavy' as const },
            ].map((c, i) => (
              <GlassCard key={c.code} tier={c.tier} radius="xl" className="p-7" style={{ transform: `translateY(${i * 12}px)` }}>
                <div className="flex items-center justify-between mb-5">
                  <span
                    className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--lqg-accent-soft)', color: 'var(--lqg-accent-deep)' }}
                  >
                    {c.tag}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--lqg-text-tertiary)' }}>0{i + 1}</span>
                </div>

                <h3 className="lqg-display mb-2" style={{ fontSize: '2rem' }}>{c.name}</h3>
                <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--lqg-text-secondary)' }}>{c.desc}</p>

                <div className="flex items-baseline gap-2 pt-4" style={{ borderTop: '1px solid var(--lqg-edge-hi)' }}>
                  <RefinedNumber size="xl" style={{ color: 'var(--lqg-text-primary)' }}>{c.price}</RefinedNumber>
                  <span className="text-xs" style={{ color: 'var(--lqg-text-tertiary)' }}>/ 10 buổi</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ───────── SECTION 3 — FEATURE GRID ───────── */}
        <section>
          <header className="mb-12 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.25em] mb-3" style={{ color: 'var(--lqg-text-tertiary)' }}>
              Vì sao Poolane
            </p>
            <h2 className="lqg-display" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}>
              Không chỉ là lớp học bơi.
            </h2>
          </header>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Waves, n: '5+7', label: 'Sức chứa', desc: 'Tối đa 5 sáng / 7 chiều. Mỗi học viên được giáo viên quan sát trực tiếp.' },
              { icon: Sparkles, n: '8+', label: 'Kỹ năng', desc: 'Thang điểm 1–5 cho 8–9 kỹ năng cốt lõi, radar chart cá nhân theo dõi tiến độ.' },
              { icon: ShieldCheck, n: '∞', label: 'Cam kết', desc: 'Chưa đạt sau 10 buổi? Học thêm — chỉ trả vé bơi, không tốn học phí mới.' },
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <GlassCard key={i} tier="medium" radius="lg" className="p-6">
                  <div
                    className="w-12 h-12 rounded-2xl grid place-items-center mb-5"
                    style={{
                      background: 'var(--lqg-accent-soft)',
                      color: 'var(--lqg-accent-deep)',
                    }}
                  >
                    <Icon className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <div className="flex items-baseline gap-3 mb-2">
                    <RefinedNumber size="xl" style={{ color: 'var(--lqg-accent)' }}>{f.n}</RefinedNumber>
                    <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--lqg-text-tertiary)' }}>{f.label}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--lqg-text-secondary)' }}>{f.desc}</p>
                </GlassCard>
              )
            })}
          </div>
        </section>

        {/* ───────── SECTION 4 — TESTIMONIAL ───────── */}
        <section>
          <GlassCard tier="heavy" radius="2xl" specular className="p-10 sm:p-14 text-center max-w-3xl mx-auto">
            <Quote className="w-8 h-8 mx-auto mb-6" style={{ color: 'var(--lqg-accent)' }} strokeWidth={1.5} />
            <blockquote className="lqg-display mb-6" style={{ fontSize: 'clamp(1.5rem, 3.2vw, 2.5rem)', color: 'var(--lqg-text-primary)' }}>
              "Pola = Polaris — ngôi sao Bắc Đẩu, đứng yên giữa bầu trời, dẫn đường cho người lênh đênh trên biển khơi."
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold"
                    style={{
                      background: `linear-gradient(135deg, var(--lqg-accent), var(--lqg-accent-deep))`,
                      border: '2px solid var(--lqg-bg-base)',
                      color: 'var(--lqg-text-on-accent)',
                    }}
                  >
                    {String.fromCharCode(64 + n)}
                  </div>
                ))}
              </div>
              <p className="text-sm" style={{ color: 'var(--lqg-text-secondary)' }}>
                200+ học viên đang bơi cùng Poolane
              </p>
            </div>
          </GlassCard>
        </section>

        {/* ───────── SECTION 5 — CTA BAND ───────── */}
        <section className="relative">
          <div
            className="rounded-3xl p-10 sm:p-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            style={{
              background: 'linear-gradient(135deg, var(--lqg-mesh-1), var(--lqg-mesh-2))',
              border: '1px solid var(--lqg-edge-hi)',
              boxShadow: 'var(--lqg-shadow-glass)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div className="relative z-10 max-w-xl">
              <p className="text-xs uppercase tracking-[0.25em] mb-3" style={{ color: 'var(--lqg-text-secondary)' }}>
                Bắt đầu từ buổi tư vấn miễn phí
              </p>
              <h3 className="lqg-display" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)' }}>
                Nói với mình bạn đang ở đâu,<br />mình sẽ chỉ đường.
              </h3>
            </div>
            <div className="relative z-10 flex flex-wrap items-center gap-3">
              <GlassInput placeholder="Số điện thoại" style={{ width: '220px' }} />
              <GlassButton variant="primary" size="lg">
                Đặt lịch <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </GlassButton>
            </div>
          </div>
        </section>

        <footer className="text-center text-xs pt-12" style={{ color: 'var(--lqg-text-tertiary)' }}>
          Sandbox — Liquid Glass Reset · Phase 12.0 · family.co reference
        </footer>
      </div>
    </div>
  )
}
