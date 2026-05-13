'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check } from 'lucide-react'

export function ResetActionButton({ id }: { id: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ tempPassword: string; userFullName: string } | null>(null)
  const [copied, setCopied] = useState(false)

  async function doReset() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }
      setResult(json.data)
    } catch {
      setError('Không thể kết nối tới máy chủ')
      setSubmitting(false)
    }
  }

  async function doReject() {
    if (!confirm('Từ chối yêu cầu này?')) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id }),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error?.message ?? 'Có lỗi')
        setSubmitting(false)
        return
      }
      router.refresh()
    } catch {
      setError('Không thể kết nối')
      setSubmitting(false)
    }
  }

  function copyPassword() {
    if (!result) return
    navigator.clipboard.writeText(result.tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function close() {
    setResult(null)
    router.refresh()
  }

  if (result) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
          <h3 className="font-heading text-xl text-[#1C2B4A] mb-2">Mật khẩu mới của {result.userFullName}</h3>
          <p className="text-sm text-[#1C2B4A]/60 mb-4">
            Copy mật khẩu này và gửi cho học viên qua Zalo. <strong className="text-red-600">Hệ thống không lưu lại</strong> — chỉ hiển thị 1 lần.
          </p>
          <div className="flex gap-2 mb-4">
            <code className="flex-1 px-4 py-3 bg-[#F6F1EA] rounded-lg font-mono text-lg text-[#1C2B4A] select-all">
              {result.tempPassword}
            </code>
            <button
              onClick={copyPassword}
              className="px-3 rounded-lg bg-[#1C2B4A] text-[#F6F1EA] hover:bg-[#1C2B4A]/90"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={close}
            className="w-full bg-[#1C2B4A] text-[#F6F1EA] rounded-lg py-2.5 text-sm font-semibold"
          >
            Đã gửi cho học viên
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 justify-end">
      <button
        onClick={doReject}
        disabled={submitting}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        Từ chối
      </button>
      <button
        onClick={doReset}
        disabled={submitting}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1C2B4A] text-[#F6F1EA] hover:bg-[#1C2B4A]/90 disabled:opacity-50"
      >
        {submitting ? 'Đang reset...' : '🔑 Reset mật khẩu'}
      </button>
      {error && <p className="text-xs text-red-600 ml-2">{error}</p>}
    </div>
  )
}
