'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    fetch('/api/error-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: typeof window !== 'undefined' ? window.location.href : null,
        route: 'Tài chính',
      }),
    }).catch(() => {})
  }, [error])

  return (
    <div className="p-5 sm:p-6 max-w-md mx-auto text-center mt-12">
      <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-danger" />
      </div>
      <h1 className="font-heading text-xl text-foreground mb-2">Có lỗi xảy ra ở trang này</h1>
      <p className="text-sm text-foreground/60 mb-4">
        Trang &ldquo;Tài chính&rdquo; gặp sự cố. Lớp đã ghi nhận và sẽ kiểm tra.
      </p>
      {error.digest && <p className="text-xs text-foreground/40 font-mono mb-4">Mã: {error.digest}</p>}
      <div className="flex gap-2 justify-center">
        <button onClick={reset} className="px-4 py-2 bg-ink-soft text-paper rounded-lg text-sm font-semibold">
          Thử lại
        </button>
        <Link href="/" className="px-4 py-2 border border-foreground/15 text-foreground/70 rounded-lg text-sm font-semibold">
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
