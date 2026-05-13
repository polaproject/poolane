import Link from 'next/link'
import { PublicHeader, PublicFooter } from '@/components/layouts/PublicHeader'
import { COURSE_PRICES, COURSE_NAMES, COURSE_SESSIONS, POOL_TICKET, COURSE_SKILLS, CAPACITY, SESSION_TIMES } from '@/config/constants'
import { Check, Clock, Users, Trophy } from 'lucide-react'

export const metadata = {
  title: 'Khoá học bơi · Poolane',
  description: 'Bơi Ếch · Bơi Sải · Bơi Bướm — mỗi khoá 10 buổi, hệ thống đánh giá 8-9 kỹ năng cốt lõi.',
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

const COURSES = [
  {
    code: 'ECH', emoji: '🐸', level: 'Bắt đầu',
    intro: 'Khoá học vỡ lòng dành cho người chưa biết bơi hoặc bơi chưa đúng kỹ thuật.',
    paymentPlans: ['Đóng toàn bộ', 'Học phí trước, vé sau', 'Cọc 30% — đóng nốt trước buổi 2'],
  },
  {
    code: 'SAI', emoji: '🦈', level: 'Trung cấp',
    intro: 'Khoá học cho người đã bơi ếch thành thạo, muốn nâng cấp sang sải để bơi xa và nhanh hơn.',
    paymentPlans: ['Đóng toàn bộ', 'Học phí trước, vé sau', 'Cọc 30%'],
  },
  {
    code: 'BUOM', emoji: '🦋', level: 'Nâng cao',
    intro: 'Khoá học khó nhất — đòi hỏi sức bền, kỹ thuật và sự kiên trì. Dành cho HV đã có nền tảng tốt.',
    paymentPlans: ['Đóng toàn bộ', 'Học phí trước, vé sau', 'Cọc 30%'],
  },
] as const

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-[#F6F1EA]">
      <PublicHeader />

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="font-heading text-4xl text-[#1C2B4A] mb-2">Khoá học</h1>
        <p className="text-[#1C2B4A]/60 max-w-2xl">
          Poolane có 3 khoá học chính. Mỗi khoá 10 buổi, đánh giá kỹ năng theo thang chuẩn 1-5.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 space-y-6 pb-12">
        {COURSES.map(c => {
          const price = COURSE_PRICES[c.code as keyof typeof COURSE_PRICES]
          const skills = COURSE_SKILLS[c.code as keyof typeof COURSE_SKILLS]
          const sessions = COURSE_SESSIONS[c.code as keyof typeof COURSE_SESSIONS]
          return (
            <div key={c.code} className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden shadow-sm">
              <div className="grid md:grid-cols-3">
                <div className="bg-[#1C2B4A] p-6 text-[#F6F1EA]">
                  <p className="text-xs uppercase tracking-wider text-[#F6F1EA]/50 font-semibold">{c.level}</p>
                  <div className="text-5xl mb-2 mt-1">{c.emoji}</div>
                  <h2 className="font-heading text-3xl">{COURSE_NAMES[c.code as keyof typeof COURSE_NAMES]}</h2>
                  <p className="text-[#F6F1EA]/60 text-sm mt-2">{c.intro}</p>
                  <div className="mt-4 space-y-1 text-sm text-[#F6F1EA]/70">
                    <p className="inline-flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {sessions} buổi học</p>
                    <p className="inline-flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Lớp nhỏ {CAPACITY.MORNING_MAX}–{CAPACITY.EVENING_MAX} HV</p>
                  </div>
                  <p className="font-heading text-3xl text-[#C8A84B] mt-5">{fmt(price)}</p>
                  <p className="text-xs text-[#F6F1EA]/40">+ vé bơi {fmt(POOL_TICKET.FIRST_PRICE)} (lần đầu, 10 buổi)</p>
                </div>

                <div className="md:col-span-2 p-6">
                  <h3 className="font-semibold text-[#1C2B4A] mb-3">Kỹ năng được đánh giá</h3>
                  <div className="grid sm:grid-cols-2 gap-1.5 mb-6">
                    {skills.map(s => (
                      <p key={s.key} className="text-sm text-[#1C2B4A]/70 inline-flex items-start gap-1.5">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        {s.label}
                      </p>
                    ))}
                  </div>

                  <h3 className="font-semibold text-[#1C2B4A] mb-2">Phương án thanh toán</h3>
                  <div className="space-y-1 mb-6">
                    {c.paymentPlans.map((p, i) => (
                      <p key={i} className="text-sm text-[#1C2B4A]/70">
                        <span className="font-semibold text-[#1C2B4A]">{String.fromCharCode(65 + i)}.</span> {p}
                      </p>
                    ))}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Link href="/register" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg text-sm font-semibold hover:bg-[#1C2B4A]/90">
                      Đăng ký tài khoản
                    </Link>
                    <Link href="/faq" className="inline-flex items-center px-4 py-2 border border-[#1C2B4A]/15 text-[#1C2B4A]/70 rounded-lg text-sm font-semibold hover:bg-[#1C2B4A]/5">
                      Câu hỏi thường gặp
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <section className="bg-[#1C2B4A] py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Trophy className="w-8 h-8 text-[#C8A84B] mx-auto mb-3" />
          <h2 className="font-heading text-2xl text-[#F6F1EA] mb-2">Tiêu chí tốt nghiệp</h2>
          <p className="text-[#F6F1EA]/70 text-sm leading-relaxed">
            Học viên cần đạt ≥ 3/5 ở mọi kỹ năng, ≥ 4/5 ở phối hợp và thở, bơi liên tục ≥ 25m đúng kiểu, và được giáo viên xác nhận. Chưa đạt sau buổi 10? Bạn được học thêm trong giai đoạn ôn luyện — chỉ trả vé bơi, không tốn học phí.
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
