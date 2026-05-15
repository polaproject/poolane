import Link from 'next/link'

export default function SandboxIndex() {
  return (
    <main className="min-h-screen bg-[#0F1B33] text-[#FBF7F0] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <header className="space-y-3">
          <p className="text-xs tracking-[0.3em] uppercase opacity-60">Poolane · Sandbox</p>
          <h1 className="font-heading italic text-5xl leading-tight">2 hướng redesign hero</h1>
          <p className="text-base opacity-75 max-w-prose">
            Mở từng link để so sánh. Cùng nội dung, cùng typography (Cormorant + Plus Jakarta), khác palette + kỹ thuật nền.
            Sau khi chọn, mình sẽ xoá thư mục <code className="px-1.5 py-0.5 rounded bg-white/10 text-sm">/sandbox</code> và áp hướng đã chọn vào toàn bộ design system.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/sandbox/preview"
            className="group block rounded-2xl ring-1 ring-[#C8A84B]/40 bg-[#C8A84B]/15 p-6 hover:bg-[#C8A84B]/25 transition sm:col-span-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tracking-widest uppercase text-[#C8A84B]">Phase 1 · Live</p>
                <h2 className="font-heading italic text-2xl mt-1 mb-1">Design tokens & primitives preview</h2>
                <p className="text-sm opacity-70">Toggle giao diện A ↔ B trực tiếp. Verify foundation hoạt động trên mọi primitive mới.</p>
              </div>
              <span className="text-3xl group-hover:translate-x-1 transition">→</span>
            </div>
          </Link>

          <Link
            href="/sandbox/hero-a"
            className="group block rounded-2xl ring-1 ring-white/15 bg-white/5 p-6 hover:bg-white/10 transition"
          >
            <div className="h-32 rounded-xl mb-4 bg-gradient-to-br from-[#1C2B4A] via-[#0F1B33] to-[#0F1B33] ring-1 ring-white/10 relative overflow-hidden">
              <div className="absolute inset-4 rounded-lg bg-[#FBF7F0]/85 backdrop-blur-sm" />
              <div className="absolute bottom-2 right-2 h-8 w-12 rounded-md bg-[#C8A84B]/80" />
            </div>
            <p className="text-xs tracking-widest uppercase text-[#C8A84B] opacity-90">Hướng A</p>
            <h2 className="font-heading italic text-2xl mt-1 mb-1">Poolane Soft Glass</h2>
            <p className="text-sm opacity-70">Giữ navy/cream Poolane. Mượn glassmorphism + layering + serif italic từ ref Callour Studio.</p>
          </Link>

          <Link
            href="/sandbox/hero-b"
            className="group block rounded-2xl ring-1 ring-white/15 bg-white/5 p-6 hover:bg-white/10 transition"
          >
            <div className="h-32 rounded-xl mb-4 bg-gradient-to-br from-[#EEEAFB] via-[#FBF7F0] to-[#F2EAD9] relative overflow-hidden ring-1 ring-white/10">
              <div className="absolute inset-4 rounded-lg bg-white/90" />
              <div className="absolute bottom-2 right-2 h-8 w-12 rounded-md bg-[#E89B7A]/85" />
            </div>
            <p className="text-xs tracking-widest uppercase text-[#E89B7A]">Hướng B</p>
            <h2 className="font-heading italic text-2xl mt-1 mb-1">Lavender Pastel Pivot</h2>
            <p className="text-sm opacity-70">Pivot palette sang lavender + peach. Cảm giác mềm, gần ref Wix + Horizon nhất.</p>
          </Link>
        </div>

        <p className="text-xs opacity-50 pt-4 border-t border-white/10">
          Hai trang dùng cùng content thật của Poolane (3 khoá Ếch/Sải/Bướm, giá thật, testimonial) để bạn so sánh fair.
        </p>
      </div>
    </main>
  )
}
