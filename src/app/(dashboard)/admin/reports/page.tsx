import { requireRole } from '@/lib/auth'
import { Info, BarChart2 } from 'lucide-react'
import { ReportsTools } from './ReportsTools'

export default async function AdminReportsPage() {
  await requireRole(['admin'])

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-3xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
            <BarChart2 className="h-3 w-3 text-accent" strokeWidth={1.75} /> Xuất Excel · Đối chiếu
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Báo cáo</h1>
          <p className="text-sm text-paper/65 mt-2">Xuất Excel doanh thu theo khoảng + đối chiếu sao kê + payments DB.</p>
        </div>
      </div>

      <div className="pl-5 pr-[5rem] sm:px-8 -mt-6 max-w-3xl mx-auto space-y-4 relative z-10">
        <div className="glass-card glass-card-hover p-5 sm:p-6">
          <ReportsTools />
        </div>

        <div className="rounded-card-lg bg-mist/10 ring-1 ring-mist/30 p-4 flex items-start gap-3 backdrop-blur-sm">
          <div className="grid place-items-center h-9 w-9 rounded-pill bg-mist/20 shrink-0">
            <Info className="h-4 w-4 text-mist" strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground mb-1">Cron job đối chiếu</p>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Đối chiếu hàng ngày chạy tự động lúc 6:00 sáng (cần <code className="font-mono bg-ink/5 px-1 rounded">CRON_SECRET</code> env). Hiện cũng có thể chạy thủ công qua nút bên trên.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
