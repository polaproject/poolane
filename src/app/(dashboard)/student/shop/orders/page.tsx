import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  ArrowLeft, ShoppingBag, BookOpen, Waves, Sparkles, Box, ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { VietQRPayButton } from '@/components/features/VietQRPayButton'
import { CancelOrderButton } from '@/components/features/CancelOrderButton'
import { Chip } from '@/components/ui/Chip'

type Variant = 'neutral' | 'accent' | 'mist' | 'success' | 'warn' | 'danger'
const STATUS_CONFIG: Record<string, { label: string; variant: Variant; desc: string }> = {
  pending:   { label: 'Chờ duyệt',     variant: 'warn',    desc: 'Lớp sẽ duyệt và liên hệ bạn sớm' },
  approved:  { label: 'Đã duyệt',      variant: 'mist',    desc: 'Đơn đã duyệt, chờ thanh toán' },
  paid:      { label: 'Đã thanh toán', variant: 'success', desc: 'Chờ nhận hàng / lên lịch' },
  fulfilled: { label: 'Hoàn thành',    variant: 'accent',  desc: 'Đã giao / hoàn tất' },
  cancelled: { label: 'Đã huỷ',        variant: 'danger',  desc: 'Đơn đã huỷ' },
}

const PRODUCT_TYPE_ICON: Record<string, typeof BookOpen> = {
  course: BookOpen,
  improvement_pack: Waves,
  service: Sparkles,
  physical: Box,
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function StudentOrdersPage() {
  const user = await requireRole(['student'])

  const student = await prisma.student.findFirst({ where: { userId: user.id }, select: { id: true } })
  if (!student) {
    return <div className="p-8 text-center text-foreground/55">Không tìm thấy hồ sơ học viên</div>
  }

  const orders = await prisma.order.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      orderItems: { include: { product: { select: { name: true, type: true } } } },
    },
  })

  return (
    <div className="min-h-screen bg-paper pb-12">
      {/* Hero */}
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-3xl mx-auto">
          <Link
            href="/student/shop"
            className="inline-flex items-center gap-1.5 text-sm text-paper/65 hover:text-paper transition mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
            Quay lại Shop
          </Link>
          <p className="eyebrow text-paper/55 mb-2">{orders.length} đơn hàng</p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Đơn của tôi</h1>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-3xl mx-auto space-y-3 relative z-10">
        {orders.length === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <ShoppingBag className="h-10 w-10 text-foreground/30 mx-auto mb-3" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">Chưa có đơn hàng</p>
            <p className="text-sm text-foreground/55 mb-6">Hãy ghé Shop xem các sản phẩm.</p>
            <Link
              href="/student/shop"
              className="inline-flex items-center gap-1.5 bg-ink text-paper font-semibold px-5 py-2.5 rounded-pill text-sm hover:bg-foreground/90 transition"
            >
              Khám phá Shop <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </Link>
          </div>
        ) : (
          orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
            return (
              <div key={order.id} className="glass-card glass-card-hover p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs text-foreground/55">
                      {format(order.createdAt, 'HH:mm · dd/MM/yyyy', { locale: vi })}
                    </p>
                    <p className="font-mono text-[10px] text-foreground/40 mt-0.5">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <Chip variant={cfg.variant} active>{cfg.label}</Chip>
                </div>

                <div className="space-y-1.5 mb-4">
                  {order.orderItems.map(item => {
                    const Icon = PRODUCT_TYPE_ICON[item.product.type] ?? Box
                    return (
                      <div key={item.id} className="flex items-center justify-between text-sm gap-3">
                        <span className="text-foreground inline-flex items-center gap-2 min-w-0">
                          <Icon className="h-3.5 w-3.5 text-accent shrink-0" strokeWidth={1.75} />
                          <span className="truncate">{item.product.name}</span>
                          {item.quantity > 1 && <span className="text-foreground/55 shrink-0">× {item.quantity}</span>}
                        </span>
                        <span className="text-foreground/65 shrink-0">{fmt(item.lineTotal)}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t border-foreground/8 pt-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    {order.discountAmount > 0 && (
                      <p className="text-xs text-success">Giảm {fmt(order.discountAmount)}</p>
                    )}
                    <p className="text-xs text-foreground/55 truncate">{cfg.desc}</p>
                  </div>
                  <p className="lqg-headline text-2xl text-foreground shrink-0">{fmt(order.finalAmount)}</p>
                </div>

                {order.status === 'approved' && (
                  <div className="mt-3 pt-3 border-t border-foreground/8">
                    <VietQRPayButton orderId={order.id} />
                  </div>
                )}

                {(order.status === 'pending' || order.status === 'approved') && (
                  <div className="mt-3 pt-3 border-t border-foreground/8 flex justify-end">
                    <CancelOrderButton
                      orderId={order.id}
                      orderStatus={order.status}
                      orderRef={order.id.slice(0, 8).toUpperCase()}
                    />
                  </div>
                )}

                {order.noteFromStudent && (
                  <div className="mt-3 pt-3 border-t border-foreground/8">
                    <p className="eyebrow text-foreground/55 mb-1">Ghi chú của bạn</p>
                    <p className="text-sm text-foreground/75">{order.noteFromStudent}</p>
                  </div>
                )}

                {order.fulfillmentNote && (
                  <div className="mt-3 pt-3 border-t border-foreground/8">
                    <p className="eyebrow text-accent mb-1">Phản hồi từ lớp</p>
                    <p className="text-sm text-foreground/75">{order.fulfillmentNote}</p>
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
