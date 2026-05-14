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
        route: 'Tiến độ kỹ năng',
      }),
    }).catch(() => {})
  }, [error])

  return (
    <div className="p-6 max-w-md mx-auto text-center mt-12">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h1 className="font-heading text-xl text-[#1C2B4A] mb-2">Có lỗi xảy ra ở trang này</h1>
      <p className="text-sm text-[#1C2B4A]/60 mb-4">
        Trang &ldquo;Tiến độ kỹ năng&rdquo; gặp sự cố. Lớp đã ghi nhận và sẽ kiểm tra.
      </p>
      {error.digest && <p className="text-xs text-[#1C2B4A]/40 font-mono mb-4">Mã: {error.digest}</p>}
      <div className="flex gap-2 justify-center">
        <button onClick={reset} className="px-4 py-2 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg text-sm font-semibold">
          Thử lại
        </button>
        <Link href="/" className="px-4 py-2 border border-[#1C2B4A]/15 text-[#1C2B4A]/70 rounded-lg text-sm font-semibold">
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
