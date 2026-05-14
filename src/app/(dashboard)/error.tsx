'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to server (best-effort)
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
        <h1 className="font-heading text-2xl text-foreground mb-2">Có lỗi xảy ra</h1>
        <p className="text-sm text-foreground/60 mb-1">
          Trang này không tải được. Lớp đã ghi nhận lỗi và sẽ kiểm tra.
        </p>
        {error.digest && (
          <p className="text-xs text-foreground/40 font-mono mb-4">Mã lỗi: {error.digest}</p>
        )}
        <div className="flex gap-2 justify-center mt-6">
          <button onClick={reset}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink-soft text-paper rounded-lg text-sm font-semibold hover:bg-foreground/90">
            <RefreshCw className="w-4 h-4" /> Thử lại
          </button>
          <Link href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-foreground/15 text-foreground/70 rounded-lg text-sm font-semibold hover:bg-foreground/5">
            <Home className="w-4 h-4" /> Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
