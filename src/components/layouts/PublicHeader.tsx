import Link from 'next/link'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 bg-[#F6F1EA]/95 backdrop-blur-sm border-b border-[#1C2B4A]/8">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <svg width="22" height="28" viewBox="0 0 52 68" fill="none">
            <path d="M26 2 C26 2 28.5 22 29.5 25.5 C33 26.5 50 26 50 26 C50 26 33 26 29.5 27.5 C28.5 31 26 50 26 50 C26 50 23.5 31 22.5 27.5 C19 26 2 26 2 26 C2 26 19 26 22.5 25.5 C23.5 22 26 2 26 2 Z" fill="#1C2B4A" />
            <line x1="8" y1="58" x2="44" y2="58" stroke="#1C2B4A" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div>
            <p className="font-body font-bold text-sm tracking-[0.16em] text-[#1C2B4A] leading-none">POOLANE</p>
            <p className="text-[10px] tracking-wide text-[#5B8E9F] leading-none mt-0.5">a Pola Project</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-[#1C2B4A]/70">
          <Link href="/courses" className="hover:text-[#1C2B4A]">Khoá học</Link>
          <Link href="/blog" className="hover:text-[#1C2B4A]">Blog</Link>
          <Link href="/faq" className="hover:text-[#1C2B4A]">Câu hỏi thường gặp</Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className="px-3 py-1.5 text-sm font-semibold text-[#1C2B4A] hover:underline">
            Đăng nhập
          </Link>
          <Link href="/register" className="px-3 py-1.5 text-sm font-semibold bg-[#1C2B4A] text-[#F6F1EA] rounded-lg hover:bg-[#1C2B4A]/90">
            Tạo tài khoản
          </Link>
        </div>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="mt-16 bg-[#1C2B4A] text-[#F6F1EA]/70 py-10">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <p className="font-body font-bold text-[#F6F1EA] tracking-[0.18em] text-lg">POOLANE</p>
          <p className="text-xs tracking-wider text-[#F6F1EA]/40 mt-1">a Pola Project</p>
          <p className="mt-4 text-[#F6F1EA]/60">
            Dạy bơi không chỉ để bơi — kết nối thân với tâm, xây dựng cộng đồng những người trưởng thành cùng sở thích.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-[#F6F1EA]/40 font-semibold mb-3">Khám phá</p>
          <ul className="space-y-2">
            <li><Link href="/courses" className="hover:text-[#F6F1EA]">Khoá học</Link></li>
            <li><Link href="/blog" className="hover:text-[#F6F1EA]">Blog</Link></li>
            <li><Link href="/faq" className="hover:text-[#F6F1EA]">Câu hỏi thường gặp</Link></li>
            <li><Link href="/privacy" className="hover:text-[#F6F1EA]">Chính sách bảo mật</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-[#F6F1EA]/40 font-semibold mb-3">Liên hệ</p>
          <ul className="space-y-2 text-[#F6F1EA]/70">
            <li>Email: <a href="mailto:support@poolane.vn" className="hover:text-[#F6F1EA]">support@poolane.vn</a></li>
            <li>Domain: poolane.vn</li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 mt-8 pt-6 border-t border-[#F6F1EA]/10 text-xs text-[#F6F1EA]/40">
        © {new Date().getFullYear()} Poolane · a Pola Project
      </div>
    </footer>
  )
}
