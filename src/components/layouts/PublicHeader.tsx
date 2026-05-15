import Link from 'next/link'
import { ThemeSwitcherCompact } from '@/components/ui/ThemeSwitcher'
import { PolarisStar } from '@/components/brand/PolarisStar'

const NAV_LINKS = [
  { href: '/courses', label: 'Khoá học' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'Câu hỏi thường gặp' },
]

export function PublicHeader() {
  return (
    <header className="sticky top-4 z-40 px-3 sm:px-4">
      <nav
        className="mx-auto max-w-6xl px-3 py-2 flex items-center gap-2 lqg-card lqg-card-medium"
        style={{ borderRadius: 'var(--lqg-r-pill)' }}
      >
        <Link
          href="/"
          aria-label="Poolane — về trang chủ"
          className="flex items-center gap-2 pl-2 pr-3 py-1 group relative z-10"
        >
          <span
            className="grid place-items-center h-8 w-8 rounded-full transition-transform duration-300 group-hover:rotate-[18deg] group-hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, var(--lqg-accent), var(--lqg-accent-deep))',
              color: 'var(--lqg-text-on-accent)',
              boxShadow: '0 4px 12px -4px color-mix(in srgb, var(--lqg-accent) 50%, transparent)',
              transitionTimingFunction: 'var(--lqg-ease-overshoot)',
            }}
          >
            <PolarisStar size={18} withReflection={false} animated />
          </span>
          <div className="hidden sm:block">
            <p className="font-body font-bold text-sm tracking-[0.16em] leading-none lqg-text-primary">POOLANE</p>
            <p className="text-[10px] tracking-wide leading-none mt-0.5 lqg-text-tertiary">a Pola Project</p>
          </div>
        </Link>

        <ul className="hidden md:flex items-center gap-1 ml-2 text-sm relative z-10">
          {NAV_LINKS.map(l => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="px-3 py-1.5 rounded-full lqg-text-secondary hover:lqg-text-primary transition"
                style={{ transitionTimingFunction: 'var(--lqg-ease-soft)', transitionDuration: '200ms' }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1.5 relative z-10">
          <ThemeSwitcherCompact className="p-2 rounded-full lqg-text-secondary hover:lqg-text-primary transition" />
          <Link
            href="/login"
            className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium rounded-full lqg-text-secondary hover:lqg-text-primary transition"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="lqg-btn lqg-btn-primary lqg-btn-sm"
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
    <footer
      className="mt-20 py-12 relative z-10"
      style={{
        background: 'var(--lqg-bg-elevated)',
        borderTop: '1px solid var(--lqg-edge-hi)',
        backdropFilter: 'var(--lqg-lens-light)',
        WebkitBackdropFilter: 'var(--lqg-lens-light)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="grid place-items-center h-7 w-7 rounded-full"
              style={{
                background: 'linear-gradient(135deg, var(--lqg-accent), var(--lqg-accent-deep))',
                color: 'var(--lqg-text-on-accent)',
              }}
            >
              <PolarisStar size={14} withReflection={false} animated={false} />
            </span>
            <p className="font-body font-bold tracking-[0.18em] text-lg leading-none lqg-text-primary">POOLANE</p>
          </div>
          <p className="text-xs tracking-wider ml-9 lqg-text-tertiary">a Pola Project</p>
          <p className="mt-4 leading-relaxed lqg-text-secondary">
            Dạy bơi không chỉ để bơi — kết nối thân với tâm, xây dựng cộng đồng những người trưởng thành cùng sở thích.
          </p>
        </div>
        <div>
          <p className="lqg-eyebrow mb-3">Khám phá</p>
          <ul className="space-y-2 lqg-text-secondary">
            <li><Link href="/courses" className="hover:lqg-text-primary transition">Khoá học</Link></li>
            <li><Link href="/blog" className="hover:lqg-text-primary transition">Blog</Link></li>
            <li><Link href="/faq" className="hover:lqg-text-primary transition">Câu hỏi thường gặp</Link></li>
            <li><Link href="/privacy" className="hover:lqg-text-primary transition">Chính sách bảo mật</Link></li>
          </ul>
        </div>
        <div>
          <p className="lqg-eyebrow mb-3">Liên hệ</p>
          <ul className="space-y-2 lqg-text-secondary">
            <li>Email: <a href="mailto:support@poolane.vn" className="hover:lqg-text-primary transition">support@poolane.vn</a></li>
            <li>Domain: poolane.vn</li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 mt-8 pt-6 text-xs lqg-text-tertiary" style={{ borderTop: '1px solid var(--lqg-edge-hi)' }}>
        © {new Date().getFullYear()} Poolane · a Pola Project
      </div>
    </footer>
  )
}
