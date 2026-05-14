import { PublicHeader, PublicFooter } from '@/components/layouts/PublicHeader'
import { AmbientMesh } from '@/components/ui/glass'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <AmbientMesh />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-[var(--lqg-accent)] focus:text-[var(--lqg-text-on-accent)] focus:rounded-full focus:shadow-lg focus:font-medium focus:text-sm"
      >
        Bỏ qua điều hướng
      </a>
      <PublicHeader />
      <main id="main-content" className="flex-1 relative z-10">{children}</main>
      <PublicFooter />
    </div>
  )
}
