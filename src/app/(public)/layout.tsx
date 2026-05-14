import { PublicHeader, PublicFooter } from '@/components/layouts/PublicHeader'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ambient-bg min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-accent focus:text-foreground focus:rounded-pill focus:shadow-soft focus:font-medium focus:text-sm"
      >
        Bỏ qua điều hướng
      </a>
      <PublicHeader />
      <main id="main-content" className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
