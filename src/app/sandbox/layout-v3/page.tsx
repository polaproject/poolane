/**
 * Sandbox v3 — Notion / Arc / Plain inspired
 *
 * Triết lý: "Editorial / Document-like reading"
 *  - Title lớn vừa (text-3xl bold) — to hơn v2 Linear nhưng KHÔNG hero block
 *  - Whitespace generous (gap-8/12) — cảm giác "đọc sách"
 *  - Cards rất subtle: chỉ background tint, KHÔNG border explicit
 *  - Flow content như document, KHÔNG dense data dashboard
 *  - Cảm giác bình tĩnh, không hối hả
 *
 * Demo content: cùng "Quản lý học viên" như v2 để so sánh
 */
import Link from 'next/link'
import { Search, Plus, ChevronRight } from 'lucide-react'

export const metadata = { title: 'Sandbox v3 — Notion style' }

const STATS = [
  { label: 'Tổng học viên', value: '247' },
  { label: 'Đang học', value: '184' },
  { label: 'Hết vé', value: '8' },
]

const STUDENTS = [
  { code: 'POLA-2026-0047', name: 'Nguyễn Thị Hà My', course: 'Bơi Ếch', status: 'Đang học', sessions: '7/10', joined: '14 tháng 5' },
  { code: 'POLA-2026-0046', name: 'Trần Văn Đức', course: 'Bơi Sải', status: 'Đang học', sessions: '4/10', joined: '12 tháng 5' },
  { code: 'POLA-2026-0045', name: 'Lê Hoài Anh', course: 'Bơi Ếch', status: 'Ôn luyện', sessions: '11/12', joined: '2 tháng 5' },
  { code: 'POLA-2026-0044', name: 'Phạm Minh Châu', course: 'Bơi Bướm', status: 'Đang học', sessions: '6/10', joined: '28 tháng 4' },
  { code: 'POLA-2026-0043', name: 'Đỗ Thị Quỳnh', course: 'Bơi Sải', status: 'Nghỉ tạm', sessions: '2/10', joined: '15 tháng 4' },
]

export default function LayoutV3Sandbox() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-12 sm:py-20">
        {/* Sandbox back link */}
        <Link
          href="/sandbox"
          className="inline-flex items-center gap-1.5 text-sm text-foreground/55 hover:text-foreground mb-16"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" strokeWidth={2} />
          Sandbox hub
        </Link>

        {/* Title block — generous whitespace */}
        <header className="mb-12">
          <p className="text-sm text-foreground/55 mb-2">Quản trị</p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight">
            Học viên
          </h1>
          <p className="text-lg text-foreground/72 leading-relaxed mt-4 max-w-lg">
            Toàn bộ học viên đang học và đã hoàn thành tại Poolane. Quản lý hồ sơ,
            theo dõi tiến độ, ghi nhận thanh toán.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <button className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md bg-foreground text-paper hover:bg-foreground/90 transition">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Thêm học viên mới
            </button>
          </div>
        </header>

        {/* Stats — inline subtle */}
        <section className="mb-16">
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold tabular-nums leading-none">{s.value}</p>
                <p className="text-sm text-foreground/55 mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Search input — minimal */}
        <div className="relative mb-8">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" strokeWidth={2} />
          <input
            type="search"
            placeholder="Tìm theo tên..."
            className="w-full pl-7 pr-3 py-3 text-base bg-transparent border-b border-foreground/15 focus:border-foreground/40 focus:outline-none transition placeholder:text-foreground/40"
          />
        </div>

        {/* Student list — no card border, just spacing + subtle hover */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-foreground/55 font-semibold mb-2 px-2">
            5 học viên gần đây
          </h2>
          <div className="-mx-2">
            {STUDENTS.map((s) => (
              <div
                key={s.code}
                className="flex items-center justify-between gap-4 px-2 py-4 rounded-md hover:bg-foreground/5 transition cursor-pointer group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium truncate">{s.name}</p>
                  <p className="text-sm text-foreground/55 mt-0.5">
                    {s.course} · {s.sessions} buổi · {s.joined}
                  </p>
                </div>
                <span className="text-sm text-foreground/55 group-hover:text-foreground/72 transition shrink-0">
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer note */}
        <footer className="mt-24 pt-12 border-t border-foreground/10">
          <p className="text-sm text-foreground/55">
            Hiển thị 5 học viên gần nhất.{' '}
            <Link href="#" className="text-foreground underline underline-offset-4 hover:no-underline">
              Xem toàn bộ 247 học viên →
            </Link>
          </p>
        </footer>

        {/* Spec footer */}
        <div className="mt-20 pt-8 border-t border-foreground/10">
          <p className="text-xs tracking-widest uppercase text-accent mb-2">v3 — Notion editorial spec</p>
          <ul className="text-sm text-foreground/72 space-y-1.5 leading-relaxed">
            <li>• Container hẹp: max-w-2xl (672px) — cảm giác đọc tài liệu</li>
            <li>• Title lớn (text-4xl/5xl) nhưng KHÔNG hero block — chỉ là 1 đoạn mở đầu</li>
            <li>• Whitespace generous: mb-12/16/24 giữa các block</li>
            <li>• Cards KHÔNG explicit border — chỉ hover background subtle</li>
            <li>• Underline cho links thay button styling everywhere</li>
            <li>• Search bar: border-bottom only (input minimal)</li>
            <li>• Stats inline trên 1 hàng, KHÔNG box riêng — đọc như câu văn</li>
            <li>• Cảm giác: "đọc sách" hơn "dashboard"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
