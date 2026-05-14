'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface Props {
  orderId?: string
  enrollmentId?: string
  amount?: number
  label?: string
  className?: string
}

export function MoMoPayButton({ orderId, enrollmentId, amount, label = '💳 Thanh toán qua MoMo', className }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onPay() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, enrollmentId, amount }),
      })
      const json = await res.json()
      if (!res.ok || !json.data?.payUrl) {
        setError(json.error?.message ?? 'Không thể tạo thanh toán')
        setSubmitting(false)
        return
      }
      window.location.href = json.data.payUrl
    } catch {
      setError('Không thể kết nối tới máy chủ')
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={onPay}
        disabled={submitting}
        className={className ?? 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#A50064] text-white rounded-lg text-sm font-semibold hover:bg-[#A50064]/90 disabled:opacity-50'}
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {submitting ? 'Đang chuyển sang MoMo...' : label}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </>
  )
}
