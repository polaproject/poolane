import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, Package } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const STATUS_CONFIG: Record<string, { label: string; className: string; description: string }> = {
  pending:   { label: 'Chờ duyệt',     className: 'bg-amber-50 text-amber-700 border-amber-200',   description: 'Lớp sẽ duyệt và liên hệ bạn sớm' },
  approved:  { label: 'Đã duyệt',      className: 'bg-blue-50 text-blue-700 border-blue-200',     description: 'Đơn đã được duyệt, đang chờ thanh toán' },
  paid:      { label: 'Đã thanh toán', className: 'bg-green-50 text-green-700 border-green-200',  description: 'Đã thanh toán, chờ nhận hàng/lên lịch' },
  fulfilled: { label: 'Hoàn thành',    className: 'bg-[#5B8E9F]/10 text-[#5B8E9F] border-[#5B8E9F]/20', description: 'Đã giao / hoàn tất' },
  cancelled: { label: 'Đã huỷ',        className: 'bg-red-50 text-red-700 border-red-200',         description: 'Đơn đã bị huỷ' },
}

const PRODUCT_TYPE_EMOJI: Record<string, string> = {
  course: '📚', improvement_pack: '🏊', service: '⭐', physical: '📦',
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function StudentOrdersPage() {
  const user = await requireRole(['student'])

  const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })
  if (!student) {
    return (
      <div className="p-6 text-center text-[#1C2B4A]/40">Không tìm thấy hồ sơ học viên</div>
    )
  }

  const orders = await prisma.order.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      orderItems: { include: { product: { select: { name: true, type: true } } } }
    }
  })

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <Link
          href="/student/shop"
          className="inline-flex items-center gap-1 text-sm text-[#F6F1EA]/60 hover:text-[#F6F1EA] mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Shop
        </Link>
        <h1 className="font-heading text-2xl text-[#F6F1EA]">Đơn của tôi</h1>
        <p className="text-[#F6F1EA]/50 text-xs mt-1">{orders.length} đơn hàng đã đặt</p>
      </div>

      <div className="px-4 -mt-4 max-w-lg mx-auto space-y-3">
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-8 text-center">
            <ShoppingBag className="w-10 h-10 text-[#1C2B4A]/20 mx-auto mb-3" />
            <p className="text-sm text-[#1C2B4A]/50 mb-4">Bạn chưa có đơn hàng nào</p>
            <Link
              href="/student/shop"
              className="inline-block px-4 py-2 text-sm font-semibold rounded-lg bg-[#1C2B4A] text-[#F6F1EA] hover:bg-[#1C2B4A]/90"
            >
              Khám phá Shop
            </Link>
          </div>
        ) : (
          orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-[#1C2B4A]/40">
                      Đặt {format(order.createdAt, 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                    <p className="font-mono text-xs text-[#1C2B4A]/40 mt-0.5">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${cfg.className}`}>
                    {cfg.label}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  {order.orderItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-[#1C2B4A] flex items-center gap-1.5">
                        <span>{PRODUCT_TYPE_EMOJI[item.product.type] ?? '📦'}</span>
                        {item.product.name}
                        {item.quantity > 1 && <span className="text-[#1C2B4A]/50">× {item.quantity}</span>}
                      </span>
                      <span className="text-[#1C2B4A]/60">{fmt(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#1C2B4A]/5 pt-3 flex items-center justify-between">
                  <div>
                    {order.discountAmount > 0 && (
                      <p className="text-xs text-green-600">Giảm {fmt(order.discountAmount)}</p>
                    )}
                    <p className="text-xs text-[#1C2B4A]/50">{cfg.description}</p>
                  </div>
                  <p className="font-heading text-lg text-[#1C2B4A]">{fmt(order.finalAmount)}</p>
                </div>

                {order.noteFromStudent && (
                  <div className="mt-3 pt-3 border-t border-[#1C2B4A]/5">
                    <p className="text-xs text-[#1C2B4A]/40 uppercase tracking-wider mb-0.5">Ghi chú của bạn</p>
                    <p className="text-sm text-[#1C2B4A]/70">{order.noteFromStudent}</p>
                  </div>
                )}

                {order.fulfillmentNote && (
                  <div className="mt-3 pt-3 border-t border-[#1C2B4A]/5">
                    <p className="text-xs text-[#1C2B4A]/40 uppercase tracking-wider mb-0.5">Phản hồi từ lớp</p>
                    <p className="text-sm text-[#1C2B4A]/70">{order.fulfillmentNote}</p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
