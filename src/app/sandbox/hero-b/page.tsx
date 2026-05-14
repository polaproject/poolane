import Link from 'next/link'
import { ArrowRight, Sparkles, Calendar, Users, Star, ShieldCheck, MessageCircle, Waves, Compass, BookOpen } from 'lucide-react'

const COURSES = [
  {
    code: 'ECH',
    name: 'Bơi Ếch',
    tag: 'Khởi đầu',
    price: '1.600.000đ',
    sessions: '10 buổi',
    desc: 'Kỹ thuật nền tảng. Học cách thở dài, đạp chân ếch chuẩn, lướt nước thư giãn.',
    skills: ['Tư thế thân', 'Đạp chân ếch', 'Phối hợp thở', 'Quay đầu hồ'],
  },
  {
    code: 'SAI',
    name: 'Bơi Sải',
    tag: 'Phổ biến',
    price: '2.100.000đ',
    sessions: '10 buổi',
    desc: 'Kỹ thuật bơi nhanh, hiệu quả. Vào tay - kéo nước - thở nghiêng 2 bên.',
    skills: ['Xoay hông', 'High elbow catch', 'Thở 2 bên', 'Sức bền tốc độ'],
  },
  {
    code: 'BUOM',
    name: 'Bơi Bướm',
    tag: 'Nâng cao',
    price: '3.500.000đ',
    sessions: '10 buổi',
    desc: 'Kỹ thuật khó nhất. Sóng người - đạp chân cá heo - nhịp điệu liền mạch.',
    skills: ['Sóng người', 'Đạp cá heo', 'Phục hồi tay', 'Nhịp điệu'],
  },
]

export default function HeroB() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F4EFFB] text-[#2D2A4A] font-body">
      {/* Lavender mesh background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[560px] w-[560px] rounded-full bg-[#D8CFFA] blur-[140px] opacity-70" />
        <div className="absolute top-20 -right-32 h-[480px] w-[480px] rounded-full bg-[#FCE7E0] blur-[140px]" />
        <div className="absolute bottom-0 left-1/4 h-[420px] w-[420px] rounded-full bg-[#F2EAD9] blur-[140px]" />
        <div className="absolute bottom-20 right-10 h-[300px] w-[300px] rounded-full bg-[#E89B7A]/15 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.5),transparent_60%)]" />
      </div>

      {/* Sticky soft nav */}
      <header className="sticky top-4 z-50 px-4">
        <nav className="mx-auto max-w-6xl rounded-full bg-white/70 backdrop-blur-2xl ring-1 ring-[#2D2A4A]/8 shadow-[0_8px_32px_-12px_rgba(45,42,74,0.15)] px-3 py-2 flex items-center gap-2">
          <Link href="/sandbox" className="flex items-center gap-2 pl-3 pr-4 py-1.5 text-sm">
            <span className="grid place-items-center h-8 w-8 rounded-full bg-[#E89B7A] text-white">
              <Compass className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span className="font-heading italic text-xl leading-none text-[#2D2A4A]">Poolane</span>
          </Link>
          <div className="hidden md:flex items-center gap-1 text-sm">
            <a className="px-3 py-1.5 rounded-full hover:bg-[#2D2A4A]/5 transition">Khoá học</a>
            <a className="px-3 py-1.5 rounded-full hover:bg-[#2D2A4A]/5 transition">Phương pháp</a>
            <a className="px-3 py-1.5 rounded-full hover:bg-[#2D2A4A]/5 transition">Blog</a>
            <a className="px-3 py-1.5 rounded-full hover:bg-[#2D2A4A]/5 transition">FAQ</a>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ring-1 ring-[#2D2A4A]/10 hover:bg-[#2D2A4A]/5 transition">
              <span className="h-2 w-2 rounded-full bg-[#E89B7A]" /> Theme B
            </button>
            <Link href="#" className="inline-flex items-center gap-1.5 bg-[#E89B7A] text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#dc8765] transition">
              Đăng ký tư vấn <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 lg:pt-24">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center">
          {/* Left — copy */}
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 text-xs tracking-[0.25em] uppercase px-3 py-1.5 rounded-full bg-white/70 ring-1 ring-[#2D2A4A]/8 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#E89B7A]" strokeWidth={2.25} />
              Pola Project · Poolane
            </div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-[#2D2A4A]">
              Học bơi <span className="italic">không chỉ</span><br />
              <span className="italic">để bơi.</span>
            </h1>
            <p className="text-lg sm:text-xl text-[#5B5778] max-w-xl leading-relaxed">
              Lớp dạy bơi cho người lớn 16–40 tuổi. Kết nối thân với tâm, xây dựng cộng đồng cùng tiến bộ — không khí nhẹ nhàng mở đầu cho một buổi tối bình yên.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="#" className="inline-flex items-center gap-2 bg-[#E89B7A] text-white font-semibold px-6 py-3.5 rounded-full hover:bg-[#dc8765] transition shadow-[0_12px_28px_-8px_rgba(232,155,122,0.45)]">
                Đăng ký tư vấn <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              <Link href="#" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full ring-1 ring-[#2D2A4A]/15 hover:bg-white/60 transition">
                Xem 3 khoá học
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-sm text-[#5B5778]">
              <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 text-[#E89B7A] fill-[#E89B7A]" strokeWidth={0} /> 4.9 / 5 đánh giá</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" strokeWidth={1.75} /> 200+ học viên</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" strokeWidth={1.75} /> 1-1 review kỹ thuật</span>
            </div>
          </div>

          {/* Right — floating cream panel stack */}
          <div className="relative lg:pl-6">
            {/* Ghost shadow panel behind */}
            <div className="absolute -inset-3 rounded-[32px] bg-[#9B91D6]/15 blur-2xl" />

            <div className="relative rounded-[28px] bg-white/90 backdrop-blur-xl ring-1 ring-[#2D2A4A]/8 shadow-[0_30px_70px_-20px_rgba(45,42,74,0.25)] p-6 lg:p-7">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs tracking-widest uppercase text-[#9B91D6] font-medium">Lịch tuần này</p>
                  <p className="font-heading italic text-2xl mt-0.5 text-[#2D2A4A]">Tuần 14 → 20 / 05</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#FCE7E0] text-[#A85C40] ring-1 ring-[#E89B7A]/30">
                  <Waves className="h-3 w-3" strokeWidth={2.25} /> Đang mở
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { day: 'T2', date: '14', time: '18:00 – 20:00', course: 'Bơi Sải', slots: '5 / 7', tone: 'bg-[#EEEAFB] text-[#6B57C7]' },
                  { day: 'T4', date: '16', time: '18:00 – 20:00', course: 'Bơi Ếch', slots: '4 / 7', tone: 'bg-[#FCE7E0] text-[#A85C40]', active: true },
                  { day: 'T6', date: '18', time: '05:30 – 07:30', course: 'Bơi Bướm', slots: '2 / 5', tone: 'bg-[#F2EAD9] text-[#8A6B2C]' },
                  { day: 'CN', date: '20', time: '18:00 – 20:00', course: 'Bơi Sải', slots: '6 / 7', tone: 'bg-[#EEEAFB] text-[#6B57C7]' },
                ].map((s) => (
                  <div
                    key={s.date}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition ${
                      s.active ? 'bg-[#FCE7E0]/60 ring-1 ring-[#E89B7A]/20' : 'bg-[#F8F5FD] hover:bg-[#EEEAFB]/60'
                    }`}
                  >
                    <div className="text-center w-11 shrink-0">
                      <div className="text-[10px] tracking-widest uppercase text-[#9B91D6]">{s.day}</div>
                      <div className="font-heading text-2xl leading-none italic text-[#2D2A4A]">{s.date}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#2D2A4A]">{s.course}</div>
                      <div className="text-xs text-[#6B6788]">{s.time}</div>
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full ${s.tone}`}>
                      {s.slots}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating mini-card overlay */}
            <div className="absolute -bottom-6 -left-6 lg:-left-10 max-w-[260px] rounded-2xl bg-[#2D2A4A] text-white p-4 shadow-[0_20px_50px_-15px_rgba(45,42,74,0.5)] ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <div className="grid place-items-center h-10 w-10 rounded-full bg-[#E89B7A] text-white">
                  <Calendar className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs opacity-60 leading-none">Buổi tiếp theo</p>
                  <p className="font-heading italic text-lg leading-tight mt-1">18:00 hôm nay · Bơi Ếch</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="opacity-70">4 / 7 chỗ đã giữ</span>
                <span className="inline-flex items-center gap-1 font-medium">
                  Vào lớp <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-[#9B91D6] mb-2">3 hành trình</p>
            <h2 className="font-heading text-3xl sm:text-4xl italic text-[#2D2A4A]">Chọn khoá hợp với bạn</h2>
          </div>
          <Link href="#" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[#5B5778] hover:text-[#2D2A4A]">
            Xem chi tiết phương pháp <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {COURSES.map((c, i) => {
            const accent = i === 0 ? '#9B91D6' : i === 1 ? '#E89B7A' : '#8A6B2C'
            const bgTint = i === 0 ? '#EEEAFB' : i === 1 ? '#FCE7E0' : '#F2EAD9'
            return (
              <div
                key={c.code}
                className="group relative rounded-[24px] bg-white/90 backdrop-blur-sm ring-1 ring-[#2D2A4A]/6 p-6 hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(45,42,74,0.2)] transition-all duration-300"
              >
                <div className="absolute top-5 right-5">
                  <span
                    className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: bgTint, color: accent }}
                  >
                    {c.tag}
                  </span>
                </div>
                <div className="text-xs tracking-[0.25em] uppercase text-[#9B91D6] mb-1">0{i + 1}</div>
                <h3 className="font-heading text-3xl italic mb-1.5 text-[#2D2A4A]">{c.name}</h3>
                <p className="text-sm text-[#5B5778] leading-relaxed mb-5">{c.desc}</p>

                <ul className="space-y-1.5 mb-6">
                  {c.skills.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-sm text-[#2D2A4A]/80">
                      <span className="h-1 w-1 rounded-full" style={{ backgroundColor: accent }} /> {s}
                    </li>
                  ))}
                </ul>

                <div className="flex items-end justify-between pt-4 border-t border-[#2D2A4A]/8">
                  <div>
                    <div className="font-heading text-2xl text-[#2D2A4A]">{c.price}</div>
                    <div className="text-xs text-[#6B6788]">{c.sessions} · vé bơi tách riêng</div>
                  </div>
                  <button
                    className="grid place-items-center h-10 w-10 rounded-full text-white group-hover:scale-110 transition"
                    style={{ backgroundColor: accent }}
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Testimonial */}
      <section className="relative mx-auto max-w-4xl px-4 pb-24">
        <div className="rounded-[28px] bg-white/85 backdrop-blur-xl ring-1 ring-[#2D2A4A]/8 p-8 sm:p-12 text-center shadow-[0_20px_60px_-20px_rgba(45,42,74,0.2)] relative overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-[#FCE7E0] blur-3xl opacity-60" />
          <MessageCircle className="relative h-6 w-6 mx-auto mb-5 text-[#E89B7A]" strokeWidth={1.5} />
          <blockquote className="relative font-heading italic text-2xl sm:text-3xl leading-snug max-w-3xl mx-auto mb-6 text-[#2D2A4A]">
            “Mình đến Poolane vì áp lực công việc. Sau 10 buổi, mình không chỉ biết bơi sải — mình tìm lại được nhịp thở của chính mình. Cảm ơn cô và cả lớp.”
          </blockquote>
          <div className="relative inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#E89B7A] to-[#9B91D6] ring-2 ring-white" />
            <div className="text-left">
              <div className="text-sm font-medium text-[#2D2A4A]">Linh Nguyễn</div>
              <div className="text-xs text-[#6B6788]">Học viên khoá Sải · Tháng 03/2026</div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA band */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-[28px] bg-gradient-to-br from-[#2D2A4A] via-[#3A3463] to-[#2D2A4A] text-white p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-[0_30px_80px_-25px_rgba(45,42,74,0.45)] relative overflow-hidden">
          <div className="absolute -top-20 -right-10 h-60 w-60 rounded-full bg-[#E89B7A]/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-[#9B91D6]/30 blur-3xl" />
          <div className="relative max-w-xl">
            <p className="text-xs tracking-[0.25em] uppercase opacity-60 mb-2">Bắt đầu từ buổi tư vấn miễn phí</p>
            <h3 className="font-heading text-3xl sm:text-4xl italic leading-tight">
              Nói với mình bạn đang ở đâu, mình sẽ chỉ đường.
            </h3>
          </div>
          <div className="relative flex items-center gap-3">
            <Link href="#" className="inline-flex items-center gap-2 bg-[#E89B7A] text-white font-semibold px-6 py-3.5 rounded-full hover:bg-[#dc8765] transition">
              Đặt lịch tư vấn <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link href="#" className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full ring-1 ring-white/20 hover:bg-white/8 transition">
              <BookOpen className="h-4 w-4" strokeWidth={1.75} /> Đọc blog
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative max-w-6xl mx-auto px-4 pb-10 text-xs text-[#6B6788] flex items-center justify-between">
        <span>Sandbox · Hero B · Lavender Pastel Pivot</span>
        <Link href="/sandbox" className="hover:text-[#2D2A4A]">← Quay lại sandbox</Link>
      </footer>
    </main>
  )
}
