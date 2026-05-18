import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'
import { getAllSettings } from '@/lib/settings'
import { DashboardViewClient } from './DashboardViewClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DashboardViewPage({ params }: PageProps) {
  const user = await requireRole(['admin'])
  const { id } = await params

  const dashboard = await prisma.dashboard.findUnique({
    where: { id },
    include: { widgets: { orderBy: { createdAt: 'asc' } } },
  })
  if (!dashboard) notFound()
  if (dashboard.ownerId !== user.id) redirect('/admin/dashboards')

  const settings = await getAllSettings()

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block pt-6 pb-10 relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto">
          <Link
            href="/admin/dashboards"
            className="inline-flex items-center gap-1 text-xs text-paper/65 hover:text-paper mb-3"
          >
            <ArrowLeft className="h-3 w-3" /> Quay lại danh sách
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-heading text-3xl sm:text-4xl italic leading-tight">{dashboard.name}</h1>
              {dashboard.description && (
                <p className="text-paper/65 text-sm mt-2 max-w-2xl">{dashboard.description}</p>
              )}
            </div>
            {dashboard.isHome && (
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-pill bg-accent/20 text-accent text-xs">
                <Home className="h-3 w-3" /> Home
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="-mt-4 max-w-6xl mx-auto relative z-10">
        <DashboardViewClient
          dashboard={{
            id: dashboard.id,
            name: dashboard.name,
            description: dashboard.description,
            isHome: dashboard.isHome,
            layout: dashboard.layout as never,
            slicers: dashboard.slicers as never,
            timeRange: dashboard.timeRange as never,
            widgets: dashboard.widgets.map(w => ({
              id: w.id,
              title: w.title,
              type: w.type,
              config: w.config as never,
              position: w.position as never,
            })),
          }}
          globalFormat={{
            amountStyle: settings['format.amount_style'],
            percentDecimals: settings['format.percent_decimals'],
            thousandSeparator: settings['format.thousand_separator'],
          }}
        />
      </div>
    </div>
  )
}
