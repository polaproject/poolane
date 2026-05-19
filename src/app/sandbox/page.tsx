import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Sandbox · Layout Direction Picker',
}

const VARIANTS = [
  {
    id: 'layout-primitives',
    name: 'v1 — Current (Hero + Liquid Glass)',
    tag: 'Marketing style',
    desc: 'Bố cục hiện tại Poolane đang dùng: hero block với gradient dark + italic Cormorant title + cards Liquid Glass với backdrop blur.',
    note: 'Phản hồi owner: "chưa phải tiêu chuẩn UI của một hệ thống".',
    tone: 'muted',
  },
  {
    id: 'layout-v2',
    name: 'v2 — Linear / Vercel style',
    tag: 'Compact app dashboard',
    desc: 'Compact PageBar (breadcrumb + title nhỏ + actions cùng hàng) • subtle border cards • dense whitespace • sans bold không italic • monochrome + 1 accent.',
    note: 'Tham khảo: linear.app, vercel.com/dashboard, dashboard.stripe.com.',
    tone: 'primary',
  },
  {
    id: 'layout-v3',
    name: 'v3 — Notion editorial style',
    tag: 'Document-like reading',
    desc: 'Title lớn vừa phải (text-3xl) • whitespace generous • cards không border (chỉ background tint) • flow như document đọc dài • cảm giác "đọc sách" hơn "app".',
    note: 'Tham khảo: notion.so, arc.net, plain.com.',
    tone: 'primary',
  },
] as const

export default function SandboxHub() {
  return (
    <div className="min-h-screen px-6 py-12 sm:px-12 sm:py-20 max-w-3xl mx-auto">
      <header className="mb-12">
        <p className="text-xs tracking-widest uppercase text-foreground/55 mb-3">
          Layout Direction Picker
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
          Chọn bố cục cho Poolane
        </h1>
        <p className="text-base text-foreground/72 mt-3 leading-relaxed">
          So sánh 3 bố cục — bản hiện tại (v1) vs 2 đề xuất mới (v2 Linear, v3 Notion).
          Mở cả 3 ở các tab khác nhau, toggle Sáng/Tối, test mobile/desktop.
        </p>
      </header>

      <div className="space-y-4">
        {VARIANTS.map((v) => (
          <Link
            key={v.id}
            href={`/sandbox/${v.id}`}
            className="block rounded-lg border border-foreground/15 hover:border-foreground/30 p-6 transition group"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-xs tracking-widest uppercase text-accent mb-1.5">
                  {v.tag}
                </p>
                <h2 className="text-lg font-semibold">{v.name}</h2>
              </div>
              <ArrowRight
                className="h-5 w-5 text-foreground/40 group-hover:translate-x-1 transition"
                strokeWidth={1.75}
              />
            </div>
            <p className="text-sm text-foreground/72 leading-relaxed mt-2">{v.desc}</p>
            <p className="text-xs text-foreground/55 italic mt-2">{v.note}</p>
          </Link>
        ))}
      </div>

      <footer className="mt-12 pt-8 border-t border-foreground/10">
        <p className="text-xs text-foreground/55 leading-relaxed">
          Mỗi sandbox render CÙNG nội dung demo (page "Quản lý học viên") để bạn so sánh
          trực tiếp visual khác nhau. Sau khi bạn chọn 1 hướng → tôi build primitives chuẩn
          + migrate 99 trang sang pattern đó.
        </p>
      </footer>
    </div>
  )
}
