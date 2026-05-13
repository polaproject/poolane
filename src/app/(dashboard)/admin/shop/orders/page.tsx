'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

type Order = {
  id: string; status: string; finalAmount: number; createdAt: string
  noteFromStudent: string | null
  student: { user: { fullName: string } }
  orderItems: Array<{ quantity: number; product: { name: string; type: string } }>
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Chờ duyệt',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved:  { label: 'Đã duyệt',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid:      { label: 'Đã thanh toán', color: 'bg-green-50 text-green-700 border-green-200' },
  fulfilled: { label: 'Hoàn thành',  color: 'bg-[#5B8E9F]/10 text-[#5B8E9F] border-[#5B8E9F]/20' },
  cancelled: { label: 'Đã huỷ',      color: 'bg-red-50 text-red-700 border-red-200' },
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [processing, setProcessing] = useState<string | null>(null)

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

  async function handleAction(orderId: string, action: string) {
    setProcessing(orderId)
    try {
      const res = await fetch(`/api/shop/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      const data = await res.json()
      if (!res.ok || data.error) { toast.error(data.error?.message ?? 'Lỗi'); return }
      toast.success(`Đã ${action === 'approve' ? 'duyệt' : action === 'fulfill' ? 'hoàn thành' : 'cập nhật'} đơn hàng!`)
      loadOrders()
    } catch { toast.error('Không thể kết nối') }
    finally { setProcessing(null) }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Đơn hàng Shop</h1>
        <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
              filter === status ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]' : 'bg-white text-[#1C2B4A]/60 border-[#1C2B4A]/15 hover:border-[#1C2B4A]/40'
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#1C2B4A]/40" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-[#1C2B4A]/40">Không có đơn hàng nào</div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-[#1C2B4A]/8 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <Link href={`/admin/students`} className="font-semibold text-[#1C2B4A] hover:underline">
                    {order.student.user.fullName}
                  </Link>
                  <p className="text-xs text-[#1C2B4A]/50 mt-0.5">
                    {format(new Date(order.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#1C2B4A]">{fmt(order.finalAmount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_CONFIG[order.status]?.color ?? ''}`}>
                    {STATUS_CONFIG[order.status]?.label ?? order.status}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1 mb-3">
                {order.orderItems.map((item, i) => (
                  <p key={i} className="text-sm text-[#1C2B4A]/70">
                    {item.quantity}× {item.product.name}
                    <span className="text-xs text-[#1C2B4A]/40 ml-1">({item.product.type})</span>
                  </p>
                ))}
              </div>

              {order.noteFromStudent && (
                <p className="text-xs italic text-[#1C2B4A]/50 mb-3">"{order.noteFromStudent}"</p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <>
                    <Button size="sm" variant="outline" className="flex-1"
                      disabled={processing === order.id}
                      onClick={() => handleAction(order.id, 'reject')}>
                      Từ chối
                    </Button>
                    <Button size="sm" className="flex-2 bg-[#1C2B4A] text-[#F6F1EA]"
                      style={{ flex: 2 }}
                      disabled={processing === order.id}
                      onClick={() => handleAction(order.id, 'approve')}>
                      {processing === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : '✓ Duyệt'}
                    </Button>
                  </>
                )}
                {order.status === 'paid' && (
                  <Button size="sm" className="flex-1 bg-[#5B8E9F] text-white"
                    disabled={processing === order.id}
                    onClick={() => handleAction(order.id, 'fulfill')}>
                    Hoàn thành giao hàng
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
