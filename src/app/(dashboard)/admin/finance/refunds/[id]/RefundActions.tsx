'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'pending' | 'approved'

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export function RefundActions({ id, mode, amount }: { id: string; mode: Mode; amount?: number }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'rejecting' | 'transferring'>('idle')
  const [transferRef, setTransferRef] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(action: 'approve' | 'reject' | 'transfer') {
    setError(null)

    if (action === 'reject' && notes.trim().length === 0) {
      setError('Vui lòng nhập lý do từ chối')
      return
    }
    if (action === 'transfer' && transferRef.trim().length === 0) {
      setError('Vui lòng nhập mã chuyển khoản')
      return
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = { action }
      if (action === 'reject') body.processedNotes = notes.trim()
      if (action === 'transfer') {
        body.transferReference = transferRef.trim()
        if (notes.trim()) body.processedNotes = notes.trim()
      }

      const res = await fetch(`/api/refunds/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }
      router.push('/admin/finance/refunds')
      router.refresh()
    } catch {
      setError('Không thể kết nối tới máy chủ')
      setSubmitting(false)
    }
  }

  // Pending → approve / reject
  if (mode === 'pending') {
    if (state === 'rejecting') {
      return (
        <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 shadow-sm p-5">
          <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
            Lý do từ chối <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            maxLength={300}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Giải thích lý do để học viên hiểu..."
            className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-white"
          />
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <div className="flex gap-3 mt-3">
            <button
              disabled={submitting}
              onClick={() => submit('reject')}
              className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </button>
            <button
              onClick={() => { setState('idle'); setError(null) }}
              disabled={submitting}
              className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-[#1C2B4A]/15 text-[#1C2B4A]/70 hover:bg-[#1C2B4A]/5"
            >
              Huỷ
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 shadow-sm p-5">
        <div className="flex gap-3">
          <button
            disabled={submitting}
            onClick={() => submit('approve')}
            className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Đang duyệt...' : '✓ Duyệt yêu cầu hoàn tiền'}
          </button>
          <button
            onClick={() => setState('rejecting')}
            disabled={submitting}
            className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
          >
            Từ chối
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <p className="text-xs text-[#1C2B4A]/40 mt-3">
          Duyệt sẽ chuyển trạng thái sang &ldquo;Chờ chuyển&rdquo;. Bạn cần chuyển tiền thật rồi quay lại đây đánh dấu &ldquo;Đã chuyển&rdquo;.
        </p>
      </div>
    )
  }

  // Approved → transfer
  if (state === 'transferring') {
    return (
      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 shadow-sm p-5">
        <p className="text-sm text-[#1C2B4A]/70 mb-3">
          Xác nhận đã chuyển <span className="font-semibold text-[#1C2B4A]">{fmt(amount ?? 0)}</span> về tài khoản học viên?
        </p>

        <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
          Mã giao dịch / Tham chiếu <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          maxLength={100}
          value={transferRef}
          onChange={e => setTransferRef(e.target.value)}
          placeholder="VD: FT250514XYZ..."
          className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 bg-white mb-3"
        />

        <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
          Ghi chú (tuỳ chọn)
        </label>
        <textarea
          rows={2}
          maxLength={300}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 bg-white"
        />

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

        <div className="flex gap-3 mt-3">
          <button
            disabled={submitting}
            onClick={() => submit('transfer')}
            className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Đang xác nhận...' : 'Xác nhận đã chuyển tiền'}
          </button>
          <button
            onClick={() => { setState('idle'); setError(null) }}
            disabled={submitting}
            className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-[#1C2B4A]/15 text-[#1C2B4A]/70 hover:bg-[#1C2B4A]/5"
          >
            Huỷ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 shadow-sm p-5">
      <button
        onClick={() => setState('transferring')}
        className="w-full bg-[#1C2B4A] text-[#F6F1EA] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#1C2B4A]/90"
      >
        💸 Đánh dấu đã chuyển tiền
      </button>
      <p className="text-xs text-[#1C2B4A]/40 mt-3 text-center">
        Sau khi chuyển khoản thật cho học viên, bấm để ghi nhận vào hệ thống
      </p>
    </div>
  )
}
