'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface PaymentFormProps {
  studentId: string
  enrollmentId?: string
  defaultAmount?: number
  defaultType?: string
  onSuccess?: () => void
}

const PAYMENT_TYPES = [
  { value: 'course_fee', label: 'Học phí' },
  { value: 'pool_ticket', label: 'Vé bơi' },
  { value: 'shop', label: 'Shop' },
  { value: 'adjustment', label: 'Điều chỉnh' },
]

const PAYMENT_METHODS = [
  { value: 'cash', label: '💵 Tiền mặt' },
  { value: 'bank_transfer', label: '🏦 Chuyển khoản' },
  { value: 'card', label: '💳 Thẻ' },
  { value: 'other', label: 'Khác' },
]

export function PaymentForm({ studentId, enrollmentId, defaultAmount, defaultType = 'course_fee', onSuccess }: PaymentFormProps) {
  const [amount, setAmount] = useState(defaultAmount?.toString() ?? '')
  const [type, setType] = useState(defaultType)
  const [method, setMethod] = useState('cash')
  const [refNum, setRefNum] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numAmount = parseInt(amount.replace(/\D/g, ''), 10)
    if (!numAmount || numAmount <= 0) { toast.error('Nhập số tiền hợp lệ'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          amount: numAmount,
          type,
          referenceType: enrollmentId ? 'enrollment' : undefined,
          referenceId: enrollmentId,
          paymentMethod: method,
          referenceNumber: refNum || undefined,
          notes: notes || undefined,
        })
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error(data.error?.message ?? 'Có lỗi xảy ra')
        return
      }

      toast.success(`Đã ghi nhận ${numAmount.toLocaleString('vi-VN')}đ!`)
      setAmount('')
      setRefNum('')
      setNotes('')
      onSuccess?.()

    } catch { toast.error('Không thể kết nối') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Loại thu</Label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full h-9 px-3 text-sm rounded-lg border border-foreground/15 bg-background focus:outline-none"
          >
            {PAYMENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Hình thức</Label>
          <select
            value={method}
            onChange={e => setMethod(e.target.value)}
            className="w-full h-9 px-3 text-sm rounded-lg border border-foreground/15 bg-background focus:outline-none"
          >
            {PAYMENT_METHODS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label className="text-xs mb-1 block">Số tiền (VND) *</Label>
        <input
          type="text"
          placeholder="Ví dụ: 2100000"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
          className="w-full h-9 px-3 text-sm rounded-lg border border-foreground/15 bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      {method === 'bank_transfer' && (
        <div>
          <Label className="text-xs mb-1 block">Mã giao dịch</Label>
          <input
            type="text"
            placeholder="Số tham chiếu chuyển khoản"
            value={refNum}
            onChange={e => setRefNum(e.target.value)}
            className="w-full h-9 px-3 text-sm rounded-lg border border-foreground/15 bg-background focus:outline-none"
          />
        </div>
      )}

      <div>
        <Label className="text-xs mb-1 block">Ghi chú</Label>
        <input
          type="text"
          placeholder="Tuỳ chọn"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full h-9 px-3 text-sm rounded-lg border border-foreground/15 bg-background focus:outline-none"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-ink-soft text-paper hover:bg-foreground/90"
      >
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</> : 'Ghi nhận thanh toán'}
      </Button>
    </form>
  )
}
