import Link from 'next/link'
import { QrCode } from 'lucide-react'

export function VietQRPayButton({ orderId, className }: { orderId: string; className?: string }) {
  return (
    <Link
      href={`/student/shop/orders/${orderId}/pay`}
      className={className ?? 'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg text-sm font-semibold hover:bg-[#1C2B4A]/90'}
    >
      <QrCode className="w-4 h-4" /> Thanh toán qua chuyển khoản
    </Link>
  )
}
