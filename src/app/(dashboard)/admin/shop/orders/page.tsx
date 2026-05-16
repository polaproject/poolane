'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Loader2, RefreshCw, ShoppingBag, CheckCircle, X as XIcon,
  DollarSign, Truck, Trash2,
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ConfirmTransferButton } from '@/components/features/ConfirmTransferButton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Chip } from '@/components/ui/Chip'

type Order = {
  id: string
  status: string
  finalAmount: number
  createdAt: string
  noteFromStudent: string | null
  student: { user: { fullName: string } }
  orderItems: Array<{ quantity: number; product: { name: string; type: string } }>
}

type Variant = 'neutral' | 'accent' | 'mist' | 'success' | 'warn' | 'danger'

const STATUS_CONFIG: Record<string, { label: string; variant: Variant }> = {
  pending:   { label: 'Chờ duyệt',     variant: 'warn' },
  approved:  { label: 'Đã duyệt',      variant: 'mist' },
  paid:      { label: 'Đã thanh toán', variant: 'success' },
  fulfilled: { label: 'Hoàn thành',    variant: 'accent' },
  cancelled: { label: 'Đã huỷ',        variant: 'danger' },
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'bank_transfer', label: 'Chuyển khoản' },
  { value: 'card', label: 'Thẻ' },
  { value: 'other', label: 'Khác' },
] as const

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'card' | 'other'>('cash')
  const [referenceNumber, setReferenceNumber] = useState('')

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/shop/orders?status=${filter}`)
      const data = await res.json()
      if (data.data) setOrders(data.data)
    } catch { toast.error('Không thể tải đơn hàng') }
    finally { setLoading(false) }
  }, [filter])

   
  useEffect(() => { loadOrders() }, [loadOrders])

  async function handleAction(orderId: string, action: string, extra?: Record<string, unknown>) {
    setProcessing(orderId)
    try {
      const res = await fetch(`/api/shop/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { toast.error(data.error?.message ?? 'Lỗi'); return }
      const label = action === 'approve' ? 'duyệt' :
        action === 'reject' ? 'từ chối' :
        action === 'pay' ? 'ghi nhận thanh toán' :
        action === 'fulfill' ? 'hoàn thành' : 'cập nhật'
      toast.success(`Đã ${label} đơn hàng`)
      if (action === 'pay') {
        setPayingOrderId(null)
        setReferenceNumber('')
      }
      loadOrders()
    } catch { toast.error('Không thể kết nối') }
    finally { setProcessing(null) }
  }

  function submitPay(orderId: string) {
    if (paymentMethod === 'bank_transfer' && !referenceNumber.trim()) {
      toast.error('Chuyển khoản cần nhập mã giao dịch')
      return
    }
    handleAction(orderId, 'pay', {
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
    })
  }

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-5xl mx-auto flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="eyebrow text-paper/55 mb-2">Duyệt · Thanh toán · Giao hàng</p>
            <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Đơn hàng Shop</h1>
          </div>
          <button
            onClick={loadOrders}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-pill ring-1 ring-paper/20 hover:bg-paper/5 transition text-sm disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} /> Làm mới
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-5xl mx-auto space-y-4 relative z-10">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
            <Chip
              key={status}
              asButton
              active={filter === status}
              onClick={() => setFilter(status)}
            >
              {cfg.label}
            </Chip>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={1.75} />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-card-xl bg-[var(--surface)] shadow-soft ring-1 ring-foreground/8 p-12 text-center">
            <ShoppingBag className="h-10 w-10 mx-auto mb-3 text-foreground/30" strokeWidth={1.5} />
            <p className="lqg-headline text-2xl text-foreground mb-1">Không có đơn hàng</p>
            <p className="text-sm text-foreground/55">Tab này chưa có đơn nào.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
              return (
                <div key={order.id} className="glass-card glass-card-hover p-5">
                  <div className="flex justify-between items-start gap-3 mb-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{order.student.user.fullName}</p>
                      <p className="text-xs text-foreground/55 mt-0.5">
                        {format(new Date(order.createdAt), 'HH:mm · dd/MM/yyyy', { locale: vi })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="lqg-headline text-2xl text-foreground leading-none">{fmt(order.finalAmount)}</p>
                      <Chip variant={cfg.variant} active className="text-[10px] mt-2">{cfg.label}</Chip>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    {order.orderItems.map((item, i) => (
                      <p key={i} className="text-sm text-foreground/75">
                        {item.quantity}× {item.product.name}
                        <span className="text-xs text-foreground/45 ml-1">({item.product.type})</span>
                      </p>
                    ))}
                  </div>

                  {order.noteFromStudent && (
                    <p className="text-xs italic text-foreground/55 mb-3 px-3 py-2 rounded-card bg-paper-tint/40">&ldquo;{order.noteFromStudent}&rdquo;</p>
                  )}

                  {payingOrderId === order.id ? (
                    <div className="border-t border-foreground/8 pt-3 space-y-3">
                      <div>
                        <p className="eyebrow text-foreground/55 mb-2">Phương thức thanh toán</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {PAYMENT_METHODS.map(m => (
                            <Chip
                              key={m.value}
                              asButton
                              active={paymentMethod === m.value}
                              className="w-full justify-center"
                              onClick={() => setPaymentMethod(m.value)}
                            >
                              {m.label}
                            </Chip>
                          ))}
                        </div>
                      </div>
                      {paymentMethod === 'bank_transfer' && (
                        <div>
                          <p className="eyebrow text-foreground/55 mb-1.5">Mã giao dịch <span className="text-danger">*</span></p>
                          <input
                            type="text"
                            value={referenceNumber}
                            onChange={e => setReferenceNumber(e.target.value)}
                            placeholder="VD: FT250513..."
                            className="w-full h-10 px-3 text-sm rounded-pill bg-paper-tint/40 ring-1 ring-foreground/10 focus:ring-accent/40 focus:outline-none transition"
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitPay(order.id)}
                          disabled={processing === order.id}
                          className="flex-1 h-10 rounded-pill bg-success text-paper text-sm font-semibold hover:bg-success/90 transition disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                        >
                          {processing === order.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <><CheckCircle className="h-4 w-4" strokeWidth={2} /> Xác nhận {fmt(order.finalAmount)}</>
                          }
                        </button>
                        <button
                          onClick={() => setPayingOrderId(null)}
                          disabled={processing === order.id}
                          className="px-4 h-10 rounded-pill ring-1 ring-foreground/15 text-sm hover:bg-foreground/5 transition"
                        >
                          Huỷ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(order.id, 'reject')}
                            disabled={processing === order.id}
                            className="flex-1 h-10 rounded-pill ring-1 ring-danger/30 text-danger text-sm hover:bg-danger/5 transition inline-flex items-center justify-center gap-1.5"
                          >
                            <XIcon className="h-4 w-4" strokeWidth={2.25} /> Từ chối
                          </button>
                          <button
                            onClick={() => handleAction(order.id, 'approve')}
                            disabled={processing === order.id}
                            className="flex-[2] h-10 rounded-pill bg-ink text-paper text-sm font-semibold hover:bg-foreground/90 transition inline-flex items-center justify-center gap-1.5"
                          >
                            {processing === order.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <><CheckCircle className="h-4 w-4" strokeWidth={2} /> Duyệt đơn</>
                            }
                          </button>
                        </>
                      )}
                      {order.status === 'approved' && (
                        <>
                          <ConfirmTransferButton
                            orderId={order.id}
                            memo={`POLA${order.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`}
                            amount={order.finalAmount}
                          />
                          <button
                            onClick={() => setPayingOrderId(order.id)}
                            className="px-4 h-10 rounded-pill ring-1 ring-foreground/15 text-sm hover:bg-foreground/5 transition inline-flex items-center gap-1.5"
                          >
                            <DollarSign className="h-4 w-4 text-accent" strokeWidth={1.75} /> Tiền mặt/khác
                          </button>
                          <ConfirmDialog
                            trigger={
                              <button
                                disabled={processing === order.id}
                                className="px-4 h-10 rounded-pill ring-1 ring-danger/30 text-danger text-sm hover:bg-danger/5 transition inline-flex items-center gap-1.5 disabled:opacity-50"
                                title="Huỷ đơn này"
                              >
                                <Trash2 className="h-4 w-4" strokeWidth={1.75} /> Huỷ đơn
                              </button>
                            }
                            title="Huỷ đơn hàng?"
                            description={`Đơn ${fmt(order.finalAmount)} của ${order.student.user.fullName} sẽ chuyển sang Đã huỷ. Stock vật phẩm (nếu có) sẽ được hoàn lại. Học viên sẽ nhận thông báo. Thao tác này không thể hoàn tác.`}
                            confirmLabel="Huỷ đơn"
                            cancelLabel="Đóng"
                            variant="danger"
                            onConfirm={() => handleAction(order.id, 'cancel')}
                          />
                        </>
                      )}
                      {order.status === 'paid' && (
                        <button
                          onClick={() => handleAction(order.id, 'fulfill')}
                          disabled={processing === order.id}
                          className="flex-1 h-10 rounded-pill bg-mist text-paper text-sm font-semibold hover:bg-mist/90 transition inline-flex items-center justify-center gap-1.5"
                        >
                          <Truck className="h-4 w-4" strokeWidth={1.75} /> Hoàn thành giao hàng
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
