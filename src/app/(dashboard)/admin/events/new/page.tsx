import { requireRole } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NewEventForm } from './NewEventForm'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function NewEventPage() {
  await requireRole(['admin', 'staff'])
  return (
    <div className="ambient-bg min-h-screen">
      <div className="p-5 sm:p-6 max-w-xl mx-auto">
        <Link href="/admin/events" className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Danh sách sự kiện
        </Link>
        <PageHeader
          eyebrow="Sự kiện"
          title="Tạo sự kiện mới"
          description="Sự kiện đơn lẻ — minigame, buổi đặc biệt, gặp mặt."
          display
          className="mb-8"
        />
        <NewEventForm />
      </div>
    </div>
  )
}
