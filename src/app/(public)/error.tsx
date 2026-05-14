'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    fetch('/api/error-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: typeof window !== 'undefined' ? window.location.href : null,
      }),
    }).catch(() => {})
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-danger" />
        </div>
        <h1 className="heading-display text-3xl mb-3">Có chuyện không như mong đợi</h1>
        <p className="text-sm text-foreground/70 mb-1">
          Trang này không tải được. Lớp đã ghi nhận và sẽ kiểm tra ngay.
        </p>
        {error.digest && (
          <p className="text-xs text-foreground/50 font-mono mt-2 mb-2">Mã lỗi: {error.digest}</p>
        )}
        <div className="flex gap-2 justify-center mt-6">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-paper rounded-pill text-sm font-semibold hover:bg-foreground/90 transition shadow-soft"
          >
            <RefreshCw className="w-4 h-4" /> Thử lại
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-foreground/15 text-foreground/70 rounded-pill text-sm font-semibold hover:bg-foreground/5 transition"
          >
            <Home className="w-4 h-4" /> Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
