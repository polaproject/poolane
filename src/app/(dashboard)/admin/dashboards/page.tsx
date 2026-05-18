import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BarChart3 } from 'lucide-react'
import { DashboardsListClient } from './DashboardsListClient'

export default async function DashboardsListPage() {
  const user = await requireRole(['admin'])

  // Nếu owner có Home dashboard → tự động chuyển vào
  const home = await prisma.dashboard.findFirst({
    where: { ownerId: user.id, isHome: true },
    select: { id: true },
  })
  if (home) {
    redirect(`/admin/dashboards/${home.id}`)
  }

  const dashboards = await prisma.dashboard.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, name: true, description: true, isHome: true,
      createdAt: true, updatedAt: true,
      _count: { select: { widgets: true } },
    },
  })

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block pt-8 pb-12 relative overflow-hidden">
        <div className="relative max-w-5xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
            <BarChart3 className="h-3 w-3 text-accent" strokeWidth={1.75} /> Báo cáo tuỳ chỉnh
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Dashboard của tôi</h1>
          <p className="text-paper/65 text-sm mt-2 max-w-xl">
            Build pivot + chart từ 10 bảng dữ liệu cốt lõi. Mỗi dashboard là 1 báo cáo bạn tự thiết kế.
          </p>
        </div>
      </div>

      <div className="-mt-6 max-w-5xl mx-auto relative z-10">
        <DashboardsListClient initial={dashboards.map(d => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        }))} />
      </div>
    </div>
  )
}
