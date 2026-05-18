import { requireRole } from '@/lib/auth'
import { Settings } from 'lucide-react'
import { getAllSettings, QUICK_ADD_CATALOG, NOTIFICATION_TYPES, SIDEBAR_GROUP_KEYS } from '@/lib/settings'
import { SettingsClient } from './SettingsClient'

export default async function AdminSettingsPage() {
  await requireRole(['admin'])
  const settings = await getAllSettings()

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto">
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
            <Settings className="h-3 w-3 text-accent" strokeWidth={1.75} /> Tự cấu hình hệ thống
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Thiết lập</h1>
          <p className="text-paper/65 text-sm mt-2 max-w-xl">
            Đổi các thuộc tính giao diện không cần hỏi dev. Mọi thay đổi áp dụng ngay khi lưu.
          </p>
        </div>
      </div>

      <div className="pl-5 pr-[5rem] sm:px-8 -mt-6 max-w-4xl mx-auto relative z-10">
        <SettingsClient
          initial={settings}
          catalog={QUICK_ADD_CATALOG}
          notifTypes={[...NOTIFICATION_TYPES]}
          sidebarGroupKeys={SIDEBAR_GROUP_KEYS}
        />
      </div>
    </div>
  )
}
