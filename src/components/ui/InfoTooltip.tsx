'use client'

import { useState, type ReactNode } from 'react'
import { Popover } from '@base-ui/react/popover'
import { Info } from 'lucide-react'

interface Props {
  children: ReactNode
  label?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
}

/**
 * InfoTooltip — (i) icon button → Popover hiển thị help text.
 * Click/tap toggle, modal=false (không chặn UI). Dùng cho explain các option
 * tuỳ chọn hoặc khái niệm phức tạp.
 */
export function InfoTooltip({ children, label = 'Thông tin', side = 'top' }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
      <Popover.Trigger
        type="button"
        aria-label={label}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-foreground/50 hover:text-accent transition-colors cursor-pointer align-middle"
      >
        <Info className="w-4 h-4" strokeWidth={2} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side={side} align="center" sideOffset={6} className="z-[60]">
          <Popover.Popup className="z-50 glass-panel rounded-card p-3 max-w-[300px] text-xs text-foreground/85 leading-relaxed shadow-glass">
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
