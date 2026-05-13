import { requireRole } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NewEventForm } from './NewEventForm'

export default async function NewEventPage() {
  await requireRole(['admin', 'staff'])
  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link href="/admin/events" className="inline-flex items-center gap-1 text-sm text-[#1C2B4A]/70 hover:text-[#1C2B4A] mb-6">
        <ArrowLeft className="w-4 h-4" /> Danh sách sự kiện
      </Link>
      <h1 className="font-heading text-3xl text-[#1C2B4A] mb-6">Tạo sự kiện mới</h1>
      <NewEventForm />
    </div>
  )
}
