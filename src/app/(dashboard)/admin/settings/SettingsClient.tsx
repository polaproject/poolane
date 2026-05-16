'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, Zap, Bell, LayoutDashboard, Palette } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import type {
  SettingsMap, QuickAddCatalogItem, NotificationTypeKey, QuickAddItemKey,
} from '@/lib/settings'
import type { UserRole } from '@/lib/auth'
import { QuickAddEditor } from './QuickAddEditor'
import { NotificationFilterEditor } from './NotificationFilterEditor'
import { SidebarLabelsEditor } from './SidebarLabelsEditor'

type Tab = 'quick_add' | 'notif_filter' | 'sidebar' | 'theme'

interface NotifType { key: string; label: string; emoji: string }

interface Props {
  initial: SettingsMap
  catalog: QuickAddCatalogItem[]
  notifTypes: NotifType[]
  sidebarGroupKeys: Record<UserRole, string[]>
}

export function SettingsClient({ initial, catalog, notifTypes, sidebarGroupKeys }: Props) {
  const [tab, setTab] = useState<Tab>('quick_add')
  const [baseline, setBaseline] = useState<SettingsMap>(initial)
  const [draft, setDraft] = useState<SettingsMap>(initial)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  function updateDraft<K extends keyof SettingsMap>(key: K, value: SettingsMap[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  async function save() {
    setSaving(true)
    try {
      // Build diff: chỉ gửi key đã đổi (so với baseline)
      const updates: Record<string, unknown> = {}
      for (const k of Object.keys(draft) as Array<keyof SettingsMap>) {
        if (JSON.stringify(draft[k]) !== JSON.stringify(baseline[k])) {
          updates[k] = draft[k]
        }
      }
      if (Object.keys(updates).length === 0) {
        toast.info('Không có thay đổi để lưu')
        setSaving(false)
        return
      }
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Không thể lưu')
        return
      }
      toast.success(`Đã lưu ${json.data.updated} thiết lập`)
      // Cập nhật baseline tại chỗ — không cần reload
      setBaseline(draft)
      setDirty(false)
    } catch {
      toast.error('Không thể kết nối')
    } finally {
      setSaving(false)
    }
  }

  const TABS: Array<{ id: Tab; label: string; icon: typeof Zap }> = [
    { id: 'quick_add',   label: 'Thao tác nhanh', icon: Zap },
    { id: 'notif_filter', label: 'Lọc thông báo', icon: Bell },
    { id: 'sidebar',      label: 'Sidebar',        icon: LayoutDashboard },
    { id: 'theme',        label: 'Bộ màu',         icon: Palette },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="inline-flex">
              <Chip active={tab === t.id} className="cursor-pointer">
                <Icon className="h-3 w-3" strokeWidth={2.25} /> {t.label}
              </Chip>
            </button>
          )
        })}
      </div>

      <div className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/10 p-5">
        {tab === 'quick_add' && (
          <QuickAddEditor
            catalog={catalog}
            value={{
              admin: draft['quick_add.admin'],
              staff: draft['quick_add.staff'],
              student: draft['quick_add.student'],
            }}
            onChange={(role, items) => updateDraft(`quick_add.${role}` as const, items as QuickAddItemKey[])}
          />
        )}
        {tab === 'notif_filter' && (
          <NotificationFilterEditor
            types={notifTypes}
            value={draft['notif_filter.types']}
            onChange={v => updateDraft('notif_filter.types', v as NotificationTypeKey[])}
          />
        )}
        {tab === 'sidebar' && (
          <SidebarLabelsEditor
            groupKeys={sidebarGroupKeys}
            value={{
              admin:   draft['sidebar_labels.admin'],
              staff:   draft['sidebar_labels.staff'],
              student: draft['sidebar_labels.student'],
            }}
            onChange={(role, labels) => updateDraft(`sidebar_labels.${role}` as const, labels)}
          />
        )}
        {tab === 'theme' && (
          <div className="text-center py-10">
            <Palette className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="lqg-headline text-xl text-foreground mb-1">Bộ màu giao diện</p>
            <p className="text-sm text-foreground/55 max-w-md mx-auto">
              Hiện tại đổi giữa <strong>Sáng/Tối</strong> qua nút ở góc dưới bên trái sidebar.
              Bộ màu custom (đổi accent, paper, ink...) sẽ phát triển sau khi owner xác nhận
              palette mong muốn.
            </p>
          </div>
        )}
      </div>

      <div className="sticky bottom-4 z-20">
        <div className="rounded-card-lg bg-ink text-paper ring-1 ring-paper/12 px-4 py-3 shadow-glass flex items-center gap-3">
          <p className="text-sm flex-1">
            {dirty ? (
              <span className="text-accent font-medium">Có thay đổi chưa lưu</span>
            ) : (
              <span className="text-paper/55">Mọi thiết lập đã đồng bộ</span>
            )}
          </p>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2 rounded-pill text-sm hover:bg-accent/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" strokeWidth={2.5} />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  )
}
