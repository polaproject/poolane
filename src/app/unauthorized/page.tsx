import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F1EA]">
      <div className="text-center">
        <p className="font-heading text-6xl text-[#1C2B4A] mb-4">403</p>
        <h1 className="font-heading text-2xl text-[#1C2B4A] mb-2">Không có quyền truy cập</h1>
        <p className="text-[#1C2B4A]/50 text-sm mb-6">Bạn không có quyền xem trang này.</p>
        <Button asChild className="bg-[#1C2B4A] text-[#F6F1EA]">
          <Link href="/">Về trang chủ</Link>
        </Button>
      </div>
    </div>
  )
}
