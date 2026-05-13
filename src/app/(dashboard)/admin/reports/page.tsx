import { requireRole } from '@/lib/auth'
import Link from 'next/link'
import { Download, FileSpreadsheet, ShieldCheck } from 'lucide-react'
import { ReportsTools } from './ReportsTools'

export default async function AdminReportsPage() {
  await requireRole(['admin'])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Báo cáo & Đối chiếu</h1>
        <p className="text-sm text-[#1C2B4A]/50 mt-1">Xuất Excel doanh thu và kiểm tra dữ liệu</p>
      </div>

      <ReportsTools />

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-900">
        <p className="font-semibold mb-1">💡 Cron job (chưa cài đặt)</p>
        <p>Đối chiếu nên chạy tự động mỗi ngày lúc 6:00 sáng. Hiện đang chạy thủ công qua nút bên trên.</p>
      </div>
    </div>
  )
}
