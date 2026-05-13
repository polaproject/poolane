import Link from 'next/link'
import { Compass, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F1EA] p-6">
      <div className="text-center max-w-md">
        <Compass className="w-16 h-16 text-[#C8A84B] mx-auto mb-4" />
        <h1 className="font-heading text-4xl text-[#1C2B4A] mb-2">404</h1>
        <p className="text-sm text-[#1C2B4A]/60 mb-6">
          Trang bạn tìm không tồn tại hoặc đã bị di chuyển
        </p>
        <Link href="/"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg text-sm font-semibold hover:bg-[#1C2B4A]/90">
          <Home className="w-4 h-4" /> Về trang chủ
        </Link>
      </div>
    </div>
  )
}
