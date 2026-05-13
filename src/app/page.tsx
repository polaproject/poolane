import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser, getDashboardPath } from '@/lib/auth'
import { PublicHeader, PublicFooter } from '@/components/layouts/PublicHeader'
import { COURSE_PRICES, COURSE_NAMES, POOL_TICKET } from '@/config/constants'
import { Users, Star, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react'

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

export default async function LandingPage() {
  const user = await getCurrentUser()
  if (user) redirect(getDashboardPath(user.role))

  const courses = [
    { code: 'ECH', name: COURSE_NAMES.ECH, price: COURSE_PRICES.ECH, level: 'Bắt đầu', desc: 'Bơi cơ bản, làm quen với nước. 10 buổi, 8 kỹ năng cốt lõi.' },
    { code: 'SAI', name: COURSE_NAMES.SAI, price: COURSE_PRICES.SAI, level: 'Trung cấp', desc: 'Bơi nhanh, tăng sức bền. Học kỹ thuật high-elbow catch và thở 2 bên.' },
    { code: 'BUOM', name: COURSE_NAMES.BUOM, price: COURSE_PRICES.BUOM, level: 'Nâng cao', desc: 'Kỹ thuật khó nhất. Sóng người, đạp cá heo, nhịp điệu hoàn hảo.' },
  ]

  return (
    <div className="min-h-screen bg-[#F6F1EA]">
      <PublicHeader />

      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#5B8E9F] font-semibold mb-3">
            Lớp dạy bơi cho người lớn
          </p>
          <h1 className="font-heading text-4xl md:text-6xl text-[#1C2B4A] mb-4 leading-tight">
            Học bơi không chỉ để bơi 🌊
          </h1>
          <p className="text-lg text-[#1C2B4A]/70 max-w-2xl mx-auto leading-relaxed">
            Poolane là nơi chân thật, được quan tâm, ấm áp — không khí nhẹ nhàng mở đầu cho một buổi tối bình yên.
          </p>
          <div className="flex gap-3 justify-center mt-8 flex-wrap">
            <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1C2B4A] text-[#F6F1EA] rounded-xl font-semibold hover:bg-[#1C2B4A]/90">
              Khám phá khoá học <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#1C2B4A] text-[#1C2B4A] rounded-xl font-semibold hover:bg-[#1C2B4A]/5">
              Tạo tài khoản
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="font-heading text-3xl text-[#1C2B4A] text-center mb-2">3 khoá học chính</h2>
        <p className="text-sm text-[#1C2B4A]/50 text-center mb-10">Mỗi khoá 10 buổi · 1 hồ bơi · 2 ca/ngày</p>
        <div className="grid md:grid-cols-3 gap-4">
          {courses.map(c => (
            <div key={c.code} className="bg-white rounded-2xl p-6 border border-[#1C2B4A]/8 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs uppercase tracking-wider text-[#5B8E9F] font-semibold">{c.level}</p>
              <h3 className="font-heading text-2xl text-[#1C2B4A] mt-1 mb-2">{c.name}</h3>
              <p className="text-sm text-[#1C2B4A]/60 mb-4">{c.desc}</p>
              <p className="font-heading text-xl text-[#1C2B4A]">{fmt(c.price)}</p>
              <p className="text-xs text-[#1C2B4A]/40 mt-1">+ vé bơi {fmt(POOL_TICKET.FIRST_PRICE)} (lần đầu)</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#1C2B4A] py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-heading text-3xl text-[#F6F1EA] text-center mb-10">Vì sao chọn Poolane?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Feature icon={Users} title="Lớp nhỏ" desc="Tối đa 5 (sáng) / 7 (chiều) học viên — đảm bảo từng người được quan tâm" />
            <Feature icon={Sparkles} title="Đánh giá kỹ năng chuẩn" desc="8-9 kỹ năng cốt lõi cho mỗi khoá, thang điểm 1-5, theo dõi tiến độ qua radar chart" />
            <Feature icon={ShieldCheck} title="Cam kết tốt nghiệp" desc="Sau buổi 10 chưa đạt? Học thêm chỉ trả vé bơi, không tốn học phí" />
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Star className="w-8 h-8 text-[#C8A84B] mx-auto mb-4" />
        <p className="font-heading text-2xl md:text-3xl text-[#1C2B4A] leading-relaxed italic">
          &ldquo;Pola = Polaris — ngôi sao Bắc Đẩu, đứng yên giữa bầu trời, dẫn đường cho người lênh đênh trên biển khơi tìm đúng hướng đi.&rdquo;
        </p>
        <p className="text-sm text-[#1C2B4A]/50 mt-4">Triết lý của Pola Project</p>
      </section>

      <PublicFooter />
    </div>
  )
}

function Feature({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-[#F6F1EA]/10 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-[#C8A84B]" />
      </div>
      <h3 className="font-semibold text-[#F6F1EA] text-lg mb-1">{title}</h3>
      <p className="text-sm text-[#F6F1EA]/60">{desc}</p>
    </div>
  )
}
