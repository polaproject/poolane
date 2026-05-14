'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

export function MarkAsTransferredButton({ orderId, memo }: { orderId: string; memo: string }) {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function ping() {
    setSubmitting(true)
    try {
      // Tạo notification cho admin để check sao kê
      await fetch('/api/notifications/ping-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '💸 HV yêu cầu xác nhận chuyển khoản',
          body: `Có 1 HV vừa báo đã chuyển khoản. Memo: ${memo}. Vào /admin/shop/orders để xác nhận.`,
          actionUrl: '/admin/shop/orders?status=approved',
        }),
      }).catch(() => {})
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-success bg-success/10 border border-success/30 rounded-lg px-3 py-2">
        <CheckCircle2 className="w-4 h-4" />
        Đã ghi nhận yêu cầu — lớp sẽ xác nhận trong 24h
      </div>
    )
  }

  return (
    <button
      onClick={ping}
      disabled={submitting}
      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border-2 border-ink text-foreground rounded-lg text-sm font-semibold hover:bg-foreground/5 disabled:opacity-50"
    >
      <CheckCircle2 className="w-4 h-4" /> {submitting ? 'Đang gửi...' : 'Tôi đã chuyển — yêu cầu xác nhận'}
    </button>
  )
}
