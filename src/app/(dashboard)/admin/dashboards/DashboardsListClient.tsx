'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, BarChart3, Home, Calendar, Loader2 } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'

interface DashboardItem {
  id: string
  name: string
  description: string | null
  isHome: boolean
  createdAt: string
  updatedAt: string
  _count: { widgets: number }
}

interface Props {
  initial: DashboardItem[]
}

export function DashboardsListClient({ initial }: Props) {
  const router = useRouter()
  const [items] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function createDashboard() {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Không tạo được')
        setSubmitting(false)
        return
      }
      toast.success(`Đã tạo "${json.data.name}"`)
      router.push(`/admin/dashboards/${json.data.id}`)
    } catch {
      toast.error('Lỗi kết nối')
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Create new */}
      {creating ? (
        <div className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/10 p-4 flex flex-col sm:flex-row gap-2">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createDashboard()}
            placeholder="Tên dashboard (vd: Doanh thu Q1)"
            className="flex-1 px-3 py-2 text-sm bg-paper-tint/40 ring-1 ring-foreground/10 rounded-md focus:ring-accent/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={createDashboard}
            disabled={!name.trim() || submitting}
            className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2 rounded-pill text-sm hover:bg-accent/90 transition disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Tạo
          </button>
          <button
            type="button"
            onClick={() => { setCreating(false); setName('') }}
            className="px-3 py-2 text-sm text-foreground/65 hover:text-foreground"
          >
            Huỷ
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="w-full rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/10 hover:ring-accent/40 hover:bg-foreground/3 p-6 transition flex items-center justify-center gap-2 text-foreground/65 hover:text-foreground"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">Tạo dashboard mới</span>
          <span className="text-xs text-foreground/45">(tối đa 10)</span>
        </button>
      )}

      {/* List */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-foreground/55 text-sm">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
          <p className="text-base mb-1">Chưa có dashboard nào</p>
          <p>Bấm &ldquo;Tạo dashboard mới&rdquo; để bắt đầu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(d => (
            <Link
              key={d.id}
              href={`/admin/dashboards/${d.id}`}
              className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/10 hover:ring-accent/40 p-4 transition group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="lqg-headline text-base text-foreground truncate flex-1">{d.name}</h3>
                {d.isHome && (
                  <Chip className="text-[10px] gap-0.5"><Home className="h-2.5 w-2.5" /> Home</Chip>
                )}
              </div>
              {d.description && (
                <p className="text-xs text-foreground/55 line-clamp-2 mb-3">{d.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-foreground/45">
                <span className="inline-flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {d._count.widgets} widget
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(d.updatedAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
