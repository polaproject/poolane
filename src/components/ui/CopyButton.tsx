'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={className ?? 'inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-ink/8 text-foreground/60 hover:bg-foreground/15'}
    >
      {copied ? <><Check className="w-3 h-3 text-success" /> Đã copy</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  )
}
