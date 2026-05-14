'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import { useState, type ReactNode } from 'react'
import { Button } from './button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  trigger: ReactNode
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger render={trigger as React.ReactElement} />
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-200" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[min(420px,calc(100vw-2rem))] glass-panel p-6 rounded-card-lg data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95 transition-all duration-200">
          <div className="flex items-start gap-4">
            {variant === 'danger' && (
              <div className="shrink-0 grid place-items-center h-10 w-10 rounded-full bg-danger/10">
                <AlertTriangle className="h-5 w-5 text-danger" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <AlertDialog.Title className="font-semibold text-foreground text-base mb-1">{title}</AlertDialog.Title>
              {description && (
                <AlertDialog.Description className="text-sm text-foreground/70 leading-relaxed">
                  {description}
                </AlertDialog.Description>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <AlertDialog.Close render={<Button variant="outline" size="lg" disabled={loading}>{cancelLabel}</Button>} />
            <Button
              size="lg"
              variant={variant === 'danger' ? 'destructive' : 'default'}
              loading={loading}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
