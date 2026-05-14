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

export default function HeroA() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0F1B33] text-[#FBF7F0] font-body">
      {/* Ambient background — decorative blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[#1C2B4A] blur-[120px] opacity-70" />
        <div className="absolute top-40 right-0 h-[420px] w-[420px] rounded-full bg-[#7FA8B5]/30 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-[#C8A84B]/20 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.06),transparent_60%)]" />
      </div>

      {/* Sticky glass nav */}
      <header className="sticky top-4 z-50 px-4">
        <nav className="mx-auto max-w-6xl rounded-full bg-[#FBF7F0]/8 backdrop-blur-2xl ring-1 ring-white/15 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)] px-3 py-2 flex items-center gap-2">
          <Link href="/sandbox" className="flex items-center gap-2 pl-3 pr-4 py-1.5 text-sm">
            <span className="grid place-items-center h-8 w-8 rounded-full bg-[#C8A84B] text-[#0F1B33]">
              <Compass className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span className="font-heading italic text-xl leading-none">Poolane</span>
          </Link>
          <div className="hidden md:flex items-center gap-1 text-sm opacity-90">
            <a className="px-3 py-1.5 rounded-full hover:bg-white/8 transition">Khoá học</a>
            <a className="px-3 py-1.5 rounded-full hover:bg-white/8 transition">Phương pháp</a>
            <a className="px-3 py-1.5 rounded-full hover:bg-white/8 transition">Blog</a>
            <a className="px-3 py-1.5 rounded-full hover:bg-white/8 transition">FAQ</a>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ring-1 ring-white/15 hover:bg-white/8 transition">
              <span className="h-2 w-2 rounded-full bg-[#C8A84B]" /> Theme A
            </button>
            <Link href="#" className="inline-flex items-center gap-1.5 bg-[#C8A84B] text-[#0F1B33] text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#d8b85a] transition">
              Đăng ký tư vấn <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero section */}
      <section className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 lg:pt-24">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center">
          {/* Left — copy */}
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 text-xs tracking-[0.25em] uppercase px-3 py-1.5 rounded-full bg-white/5 ring-1 ring-white/10">
              <Sparkles className="h-3.5 w-3.5 text-[#C8A84B]" strokeWidth={2.25} />
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
              <Link href="#" className="inline-flex items-center gap-2 bg-[#C8A84B] text-[#0F1B33] font-semibold px-6 py-3.5 rounded-full hover:bg-[#d8b85a] transition shadow-[0_8px_24px_-8px_rgba(200,168,75,0.5)]">
                Đăng ký tư vấn <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              <Link href="#" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full ring-1 ring-white/20 hover:bg-white/5 transition">
                Xem 3 khoá học
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-sm opacity-70">
              <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 text-[#C8A84B] fill-[#C8A84B]" strokeWidth={0} /> 4.9 / 5 đánh giá</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" strokeWidth={1.75} /> 200+ học viên</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" strokeWidth={1.75} /> 1-1 review kỹ thuật</span>
            </div>
          </div>

          {/* Right — floating glass panel stack */}
          <div className="relative lg:pl-6">
            {/* Main glass panel */}
            <div className="relative rounded-[28px] bg-[#FBF7F0]/8 backdrop-blur-2xl ring-1 ring-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] p-6 lg:p-7 overflow-hidden">
              {/* highlight edge */}
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs tracking-widest uppercase opacity-60">Lịch tuần này</p>
                  <p className="font-heading italic text-2xl mt-0.5">Tuần 14 → 20 / 05</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#C8A84B]/20 text-[#E8D9A8] ring-1 ring-[#C8A84B]/30">
                  <Waves className="h-3 w-3" strokeWidth={2.25} /> Đang mở
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { day: 'T2', date: '14', time: '18:00 – 20:00', course: 'Bơi Sải', slots: '5 / 7', tone: '#7FA8B5' },
                  { day: 'T4', date: '16', time: '18:00 – 20:00', course: 'Bơi Ếch', slots: '4 / 7', tone: '#C8A84B', active: true },
                  { day: 'T6', date: '18', time: '05:30 – 07:30', course: 'Bơi Bướm', slots: '2 / 5', tone: '#9E7BB5' },
                  { day: 'CN', date: '20', time: '18:00 – 20:00', course: 'Bơi Sải', slots: '6 / 7', tone: '#7FA8B5' },
                ].map((s) => (
                  <div
                    key={s.date}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition ${
                      s.active ? 'bg-[#FBF7F0]/15 ring-1 ring-white/20' : 'bg-white/3 hover:bg-white/6'
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
                    <div className="text-xs px-2 py-0.5 rounded-full ring-1 ring-white/15" style={{ color: s.tone }}>
                      {s.slots}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overlay floating mini-card */}
            <div className="absolute -bottom-6 -left-6 lg:-left-10 max-w-[260px] rounded-2xl bg-[#FBF7F0] text-[#0F1B33] p-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)] ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                <div className="grid place-items-center h-10 w-10 rounded-full bg-[#0F1B33] text-[#C8A84B]">
                  <Calendar className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs opacity-60 leading-none">Buổi tiếp theo</p>
                  <p className="font-heading italic text-lg leading-tight mt-1">18:00 hôm nay · Bơi Ếch</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-black/8 flex items-center justify-between text-xs">
                <span className="opacity-70">4 / 7 chỗ đã giữ</span>
                <span className="inline-flex items-center gap-1 font-medium text-[#0F1B33]">
                  Vào lớp <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses section */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase opacity-60 mb-2">3 hành trình</p>
            <h2 className="font-heading text-3xl sm:text-4xl italic">Chọn khoá hợp với bạn</h2>
          </div>
          <Link href="#" className="hidden sm:inline-flex items-center gap-1.5 text-sm opacity-80 hover:opacity-100">
            Xem chi tiết phương pháp <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {COURSES.map((c, i) => (
            <div
              key={c.code}
              className="group relative rounded-[24px] bg-[#FBF7F0]/6 backdrop-blur-xl ring-1 ring-white/12 p-6 hover:bg-[#FBF7F0]/10 hover:-translate-y-0.5 transition-all duration-300 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.4)]"
            >
              <div className="absolute top-5 right-5">
                <span className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-[#C8A84B]/15 text-[#E8D9A8] ring-1 ring-[#C8A84B]/30">
                  {c.tag}
                </span>
              </div>
              <div className="text-xs tracking-[0.25em] uppercase opacity-50 mb-1">0{i + 1}</div>
              <h3 className="font-heading text-3xl italic mb-1.5">{c.name}</h3>
              <p className="text-sm opacity-70 leading-relaxed mb-5">{c.desc}</p>

              <ul className="space-y-1.5 mb-6">
                {c.skills.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-sm opacity-80">
                    <span className="h-1 w-1 rounded-full bg-[#C8A84B]" /> {s}
                  </li>
                ))}
              </ul>

              <div className="flex items-end justify-between pt-4 border-t border-white/10">
                <div>
                  <div className="font-heading text-2xl">{c.price}</div>
                  <div className="text-xs opacity-60">{c.sessions} · vé bơi tách riêng</div>
                </div>
                <button className="grid place-items-center h-10 w-10 rounded-full bg-[#C8A84B] text-[#0F1B33] group-hover:scale-110 transition">
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="relative mx-auto max-w-4xl px-4 pb-24">
        <div className="rounded-[28px] bg-[#FBF7F0]/6 backdrop-blur-xl ring-1 ring-white/12 p-8 sm:p-12 text-center shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute -top-px inset-x-12 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <MessageCircle className="h-6 w-6 mx-auto mb-5 text-[#C8A84B] opacity-80" strokeWidth={1.5} />
          <blockquote className="font-heading italic text-2xl sm:text-3xl leading-snug max-w-3xl mx-auto mb-6">
            “Mình đến Poolane vì áp lực công việc. Sau 10 buổi, mình không chỉ biết bơi sải — mình tìm lại được nhịp thở của chính mình. Cảm ơn cô và cả lớp.”
          </blockquote>
          <div className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#C8A84B] to-[#7FA8B5] ring-2 ring-white/20" />
            <div className="text-left">
              <div className="text-sm font-medium">Linh Nguyễn</div>
              <div className="text-xs opacity-60">Học viên khoá Sải · Tháng 03/2026</div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA band */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-[28px] bg-gradient-to-br from-[#C8A84B]/95 via-[#C8A84B]/90 to-[#E8D9A8]/85 text-[#0F1B33] p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-[0_30px_80px_-25px_rgba(200,168,75,0.5)]">
          <div className="max-w-xl">
            <p className="text-xs tracking-[0.25em] uppercase opacity-60 mb-2">Bắt đầu từ buổi tư vấn miễn phí</p>
            <h3 className="font-heading text-3xl sm:text-4xl italic leading-tight">
              Nói với mình bạn đang ở đâu, mình sẽ chỉ đường.
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <Link href="#" className="inline-flex items-center gap-2 bg-[#0F1B33] text-[#FBF7F0] font-semibold px-6 py-3.5 rounded-full hover:bg-[#1C2B4A] transition">
              Đặt lịch tư vấn <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link href="#" className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full ring-1 ring-[#0F1B33]/20 hover:bg-[#0F1B33]/8 transition">
              <BookOpen className="h-4 w-4" strokeWidth={1.75} /> Đọc blog
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative max-w-6xl mx-auto px-4 pb-10 text-xs opacity-50 flex items-center justify-between">
        <span>Sandbox · Hero A · Poolane Soft Glass</span>
        <Link href="/sandbox" className="hover:opacity-100 opacity-70">← Quay lại sandbox</Link>
      </footer>
    </main>
  )
}
