import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="text-center">
        <p className="font-heading text-4xl sm:text-6xl text-foreground mb-4">403</p>
        <h1 className="font-heading text-2xl text-foreground mb-2">Không có quyền truy cập</h1>
        <p className="text-foreground/50 text-sm mb-6">Bạn không có quyền xem trang này.</p>
        <Button asChild className="bg-ink-soft text-paper">
          <Link href="/">Về trang chủ</Link>
        </Button>
      </div>
    </div>
  )
}
