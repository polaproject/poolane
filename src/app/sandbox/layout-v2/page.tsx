/**
 * Sandbox v2 — Linear / Vercel / Stripe inspired
 *
 * Triết lý: "Application Shell" compact dashboard
 *  - Breadcrumb tiny + PageBar inline + subtle divider
 *  - NO hero block, NO italic display, NO backdrop blur
 *  - Sans bold tỉnh, monochrome + 1 accent CTA
 *  - Dense cards (border 1px, no shadow), generous whitespace giữa sections
 *
 * Demo content: "Quản lý học viên" page giả lập
 */
import Link from 'next/link'
import {
  Search, Filter, ArrowUpDown, Plus, ChevronRight,
  MoreHorizontal, Users, TrendingUp, AlertCircle,
} from 'lucide-react'

export const metadata = { title: 'Sandbox v2 — Linear style' }

const STATS = [
  { label: 'Tổng học viên', value: '247', delta: '+12 tuần này', tone: 'neutral' },
  { label: 'Đang học', value: '184', delta: '74.5%', tone: 'success' },
  { label: 'Hết vé / quá hạn', value: '8', delta: 'Cần follow-up', tone: 'warn' },
]

const STUDENTS = [
  { code: 'POLA-2026-0047', name: 'Nguyễn Thị Hà My', course: 'ECH', status: 'active', sessions: '7/10', joined: '14/05' },
  { code: 'POLA-2026-0046', name: 'Trần Văn Đức', course: 'SAI', status: 'active', sessions: '4/10', joined: '12/05' },
  { code: 'POLA-2026-0045', name: 'Lê Hoài Anh', course: 'ECH', status: 'extension', sessions: '11/12', joined: '02/05' },
  { code: 'POLA-2026-0044', name: 'Phạm Minh Châu', course: 'BUOM', status: 'active', sessions: '6/10', joined: '28/04' },
  { code: 'POLA-2026-0043', name: 'Đỗ Thị Quỳnh', course: 'SAI', status: 'inactive', sessions: '2/10', joined: '15/04' },
]

const STATUS_BADGE = {
  active: 'bg-success/12 text-success ring-success/25',
  extension: 'bg-mist/12 text-mist ring-mist/25',
  inactive: 'bg-foreground/8 text-foreground/55 ring-foreground/15',
}

const STATUS_LABEL = {
  active: 'Đang học',
  extension: 'Ôn luyện',
  inactive: 'Nghỉ tạm',
}

export default function LayoutV2Sandbox() {
  return (
    <div className="min-h-screen bg-[color-mix(in_srgb,var(--paper)_98%,var(--ink))]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        {/* Sandbox banner */}
        <Link
          href="/sandbox"
          className="inline-flex items-center gap-1.5 text-xs text-foreground/55 hover:text-foreground mb-6"
        >
          <ChevronRight className="h-3 w-3 rotate-180" strokeWidth={2} />
          Sandbox hub
        </Link>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-foreground/55 mb-3">
          <span>Quản trị</span>
          <ChevronRight className="h-3 w-3" strokeWidth={2} />
          <span className="text-foreground/72">Học viên</span>
        </nav>

        {/* PageBar — title + actions inline */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight">
              Học viên
            </h1>
            <p className="text-sm text-foreground/72 mt-1">
              Quản lý 247 học viên · 184 đang hoạt động
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md border border-foreground/15 hover:bg-foreground/5 transition">
              <Filter className="h-3.5 w-3.5" strokeWidth={2} />
              Bộ lọc
            </button>
            <button className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md bg-foreground text-paper hover:bg-foreground/90 transition">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Thêm học viên
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-foreground/10 my-6" />

        {/* Stats row — dense, border-only */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-md border border-foreground/12 p-4 hover:border-foreground/25 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-foreground/55 font-medium">{s.label}</p>
                {s.tone === 'success' && <TrendingUp className="h-3.5 w-3.5 text-success" strokeWidth={2} />}
                {s.tone === 'warn' && <AlertCircle className="h-3.5 w-3.5 text-warn" strokeWidth={2} />}
                {s.tone === 'neutral' && <Users className="h-3.5 w-3.5 text-foreground/40" strokeWidth={2} />}
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                <p className="text-xs text-foreground/55">{s.delta}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar — search + filter chips */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40" strokeWidth={2} />
            <input
              type="search"
              placeholder="Tìm theo tên hoặc mã..."
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-foreground/15 bg-transparent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
            />
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            {['Tất cả · 247', 'Đang học · 184', 'Ôn luyện · 12', 'Nghỉ · 51'].map((chip, i) => (
              <button
                key={chip}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-md ring-1 transition ${
                  i === 0
                    ? 'bg-foreground text-paper ring-foreground'
                    : 'ring-foreground/15 hover:bg-foreground/5 hover:ring-foreground/30'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded-md ring-1 ring-foreground/15 hover:bg-foreground/5">
            <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="hidden sm:inline">Sắp xếp</span>
          </button>
        </div>

        {/* Data list — row pattern, border-bottom dividers */}
        <div className="rounded-md border border-foreground/12 overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_120px_100px_60px_24px] gap-3 px-4 py-2.5 bg-foreground/4 border-b border-foreground/12 text-xs font-medium text-foreground/55 uppercase tracking-wider">
            <span>Họ tên</span>
            <span>Khoá</span>
            <span>Trạng thái</span>
            <span>Buổi học</span>
            <span>Vào lớp</span>
            <span></span>
          </div>
          {/* Rows */}
          {STUDENTS.map((s, i) => (
            <div
              key={s.code}
              className={`grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_80px_120px_100px_60px_24px] gap-3 px-4 py-3 hover:bg-foreground/3 transition ${
                i < STUDENTS.length - 1 ? 'border-b border-foreground/8' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-foreground/55 font-mono">{s.code}</p>
              </div>
              <span className="hidden sm:inline-flex items-center text-xs font-semibold text-accent">{s.course}</span>
              <span className="hidden sm:inline-flex">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ring-1 ${STATUS_BADGE[s.status as keyof typeof STATUS_BADGE]}`}>
                  {STATUS_LABEL[s.status as keyof typeof STATUS_LABEL]}
                </span>
              </span>
              <span className="hidden sm:inline-flex items-center text-sm tabular-nums">{s.sessions}</span>
              <span className="hidden sm:inline-flex items-center text-xs text-foreground/55">{s.joined}</span>
              <button className="text-foreground/30 hover:text-foreground/60">
                <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer pagination */}
        <div className="flex items-center justify-between mt-4 text-xs text-foreground/55">
          <span>Hiển thị 1-5 trong tổng 247</span>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded ring-1 ring-foreground/15 hover:bg-foreground/5">Trước</button>
            <button className="px-2.5 py-1 rounded bg-foreground text-paper">1</button>
            <button className="px-2.5 py-1 rounded ring-1 ring-foreground/15 hover:bg-foreground/5">2</button>
            <button className="px-2.5 py-1 rounded ring-1 ring-foreground/15 hover:bg-foreground/5">3</button>
            <button className="px-2.5 py-1 rounded ring-1 ring-foreground/15 hover:bg-foreground/5">Sau</button>
          </div>
        </div>

        {/* Spec footer */}
        <div className="mt-16 pt-8 border-t border-foreground/10">
          <p className="text-xs tracking-widest uppercase text-accent mb-2">v2 — Linear style spec</p>
          <ul className="text-xs text-foreground/72 space-y-1 leading-relaxed">
            <li>• Background: subtle solid (98% paper) — KHÔNG ambient blob/mesh</li>
            <li>• PageBar: text-xl/2xl bold + actions inline trên 1 hàng — KHÔNG hero block</li>
            <li>• Divider 1px solid border giữa header và content</li>
            <li>• Cards: border-only, no shadow, hover bumps border color</li>
            <li>• Typography: sans bold tỉnh, KHÔNG italic, KHÔNG display font</li>
            <li>• Density: tight (py-3 rows, px-4 padding) — Linear convention</li>
            <li>• Color: monochrome + 1 accent CHỈ cho primary action</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
