import Link from 'next/link'
import { ThemeSwitcherCompact } from '@/components/ui/ThemeSwitcher'
import { Compass } from 'lucide-react'

const NAV_LINKS = [
  { href: '/courses', label: 'Khoá học' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'Câu hỏi thường gặp' },
]

export function PublicHeader() {
  return (
    <header className="sticky top-4 z-40 px-3 sm:px-4">
      <nav className="mx-auto max-w-6xl glass-pill px-3 py-2 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 pl-2 pr-3 py-1 group">
          <span className="grid place-items-center h-8 w-8 rounded-pill bg-accent text-ink shadow-soft transition-transform group-hover:rotate-12">
            <Compass className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div className="hidden sm:block">
            <p className="font-body font-bold text-sm tracking-[0.16em] text-ink leading-none">POOLANE</p>
            <p className="text-[10px] tracking-wide text-mist leading-none mt-0.5">a Pola Project</p>
          </div>
        </Link>

        <ul className="hidden md:flex items-center gap-1 ml-2 text-sm">
          {NAV_LINKS.map(l => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="px-3 py-1.5 rounded-pill text-ink/75 hover:text-ink hover:bg-ink/5 transition"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeSwitcherCompact className="p-2 rounded-pill text-ink/70 hover:text-ink hover:bg-ink/5 transition" />
          <Link
            href="/login"
            className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium text-ink/80 hover:text-ink rounded-pill hover:bg-ink/5 transition"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="inline-flex px-4 py-2 text-sm font-semibold bg-ink text-paper rounded-pill hover:bg-ink/90 transition shadow-soft"
          >
            Tạo tài khoản
          </Link>
        </div>
      </nav>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="mt-16 bg-ink text-paper/75 py-10">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="grid place-items-center h-7 w-7 rounded-pill bg-accent text-ink">
              <Compass className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
            <p className="font-body font-bold text-paper tracking-[0.18em] text-lg leading-none">POOLANE</p>
          </div>
          <p className="text-xs tracking-wider text-paper/40 ml-9">a Pola Project</p>
          <p className="mt-4 text-paper/65 leading-relaxed">
            Dạy bơi không chỉ để bơi — kết nối thân với tâm, xây dựng cộng đồng những người trưởng thành cùng sở thích.
          </p>
        </div>
        <div>
          <p className="eyebrow text-paper/40 mb-3">Khám phá</p>
          <ul className="space-y-2">
            <li><Link href="/courses" className="hover:text-paper transition">Khoá học</Link></li>
            <li><Link href="/blog" className="hover:text-paper transition">Blog</Link></li>
            <li><Link href="/faq" className="hover:text-paper transition">Câu hỏi thường gặp</Link></li>
            <li><Link href="/privacy" className="hover:text-paper transition">Chính sách bảo mật</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-paper/40 mb-3">Liên hệ</p>
          <ul className="space-y-2 text-paper/70">
            <li>Email: <a href="mailto:support@poolane.vn" className="hover:text-paper transition">support@poolane.vn</a></li>
            <li>Domain: poolane.vn</li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 mt-8 pt-6 border-t border-paper/10 text-xs text-paper/40">
        © {new Date().getFullYear()} Poolane · a Pola Project
      </div>
    </footer>
  )
}
