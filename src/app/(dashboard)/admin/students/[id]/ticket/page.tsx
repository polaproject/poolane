'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { POOL_TICKET } from '@/config/constants'

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

const TICKET_TYPES = [
  {
    value: 'first',
    label: 'Vé lần đầu',
    price: POOL_TICKET.FIRST_PRICE,
    sessions: POOL_TICKET.SESSIONS_INCLUDED,
    desc: `${POOL_TICKET.SESSIONS_INCLUDED} buổi (tối đa ${POOL_TICKET.MAX_SESSIONS}). Bao gồm đạo cụ + tiện ích hồ bơi.`,
    highlight: true,
  },
  {
    value: 'subsequent',
    label: 'Vé tháng',
    price: 0,
    sessions: 30,
    desc: 'Nhập giá thực tế. Áp dụng cho vé tháng tự mua.',
    highlight: false,
  },
  {
    value: 'single',
    label: 'Vé lẻ',
    price: 0,
    sessions: 1,
    desc: 'Nhập giá thực tế. Buổi bơi đơn lẻ.',
    highlight: false,
  },
]

export default function CreateTicketPage() {
  const { id: studentId } = useParams<{ id: string }>()
  const router = useRouter()

  const [ticketType, setTicketType] = useState('first')
  const [customPrice, setCustomPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedTicket = TICKET_TYPES.find(t => t.value === ticketType)!
  const price = ticketType === 'first' ? POOL_TICKET.FIRST_PRICE : parseInt(customPrice || '0', 10)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!price || price <= 0) { toast.error('Nhập số tiền hợp lệ'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/pool-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          ticketType,
          pricePaid: price,
          totalSessions: selectedTicket.sessions,
        })
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        toast.error(data.error?.message ?? 'Có lỗi xảy ra')
        return
      }

      toast.success('Đã tạo vé bơi thành công!')
      router.push(`/admin/students/${studentId}`)

    } catch { toast.error('Không thể kết nối') }
    finally { setLoading(false) }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/students/${studentId}`}><ArrowLeft className="w-4 h-4 mr-1" /> Hồ sơ</Link>
        </Button>
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Tạo vé bơi</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border-[#1C2B4A]/10 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-6">
            <h2 className="font-semibold text-[#1C2B4A] text-sm">Loại vé <span className="text-red-500">*</span></h2>
          </CardHeader>
          <CardContent className="px-6 pb-5 space-y-2">
            {TICKET_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTicketType(t.value)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  ticketType === t.value
                    ? 'bg-[#1C2B4A] border-[#1C2B4A] text-white'
                    : 'border-[#1C2B4A]/15 hover:border-[#1C2B4A]/40'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{t.label}</p>
                    <p className={`text-xs mt-0.5 ${ticketType === t.value ? 'text-white/60' : 'text-[#1C2B4A]/50'}`}>
                      {t.desc}
                    </p>
                  </div>
                  {t.price > 0 && (
                    <p className={`font-semibold text-sm ml-3 ${ticketType === t.value ? 'text-white' : 'text-[#1C2B4A]'}`}>
                      {fmt(t.price)}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Giá custom cho vé lẻ/tháng */}
        {ticketType !== 'first' && (
          <Card className="border-[#1C2B4A]/10 shadow-sm">
            <CardContent className="px-6 py-5">
              <label className="text-sm font-medium text-[#1C2B4A] block mb-2">
                Số tiền thực thu (VND) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="Ví dụ: 650000"
                value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
                required={ticketType !== 'first'}
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-[#1C2B4A]/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20"
              />
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <div className="bg-[#1C2B4A] rounded-2xl p-5 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">{selectedTicket.label}</p>
              <p className="text-xs text-white/60 mt-0.5">{selectedTicket.sessions} buổi</p>
            </div>
            <p className="font-heading text-2xl text-[#C8A84B]">{price > 0 ? fmt(price) : '—'}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild className="flex-1">
            <Link href={`/admin/students/${studentId}`}>Huỷ</Link>
          </Button>
          <Button
            type="submit"
            disabled={loading || price <= 0}
            className="flex-1 bg-[#1C2B4A] text-[#F6F1EA] hover:bg-[#1C2B4A]/90"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang tạo...</> : 'Tạo vé bơi'}
          </Button>
        </div>
      </form>
    </div>
  )
}
