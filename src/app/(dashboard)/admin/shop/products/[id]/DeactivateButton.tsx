'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export function DeactivateButton({ id }: { id: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function deactivate() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/shop/products/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }
      router.push('/admin/shop/products')
      router.refresh()
    } catch {
      setError('Không thể kết nối tới máy chủ')
      setSubmitting(false)
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border border-danger/30 text-danger hover:bg-danger/10"
      >
        <Trash2 className="w-3.5 h-3.5" /> Ngừng bán
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="text-xs text-danger">Xác nhận ngừng bán?</p>
      <div className="flex gap-2">
        <button
          onClick={deactivate}
          disabled={submitting}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? 'Đang xử lý...' : 'Ngừng bán'}
        </button>
        <button
          onClick={() => { setConfirming(false); setError(null) }}
          disabled={submitting}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-foreground/15 text-foreground/70 hover:bg-foreground/5"
        >
          Huỷ
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
