'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface RegisterButtonProps {
  sessionId: string
  studentId: string
  disabled?: boolean
  disabledReason?: string
  enrollmentId?: string
}

export function RegisterButton({ sessionId, studentId, disabled, disabledReason, enrollmentId }: RegisterButtonProps) {
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  async function handleRegister() {
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, courseId: enrollmentId }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        toast.error(data.error?.message ?? 'Không thể đăng ký')
        return
      }

      setRegistered(true)
      toast.success('Đã đăng ký! Chờ giáo viên duyệt nhé 😊')

    } catch {
      toast.error('Không thể kết nối')
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="text-center py-2 rounded-xl text-sm font-medium bg-warn/10 text-warn">
        Đang chờ duyệt...
      </div>
    )
  }

  return (
    <Button
      className="w-full bg-ink-soft text-paper hover:bg-foreground/90 h-9"
      disabled={disabled || loading}
      onClick={handleRegister}
      title={disabledReason}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : disabled ? (
        disabledReason || 'Không thể đăng ký'
      ) : (
        'Đăng ký buổi này'
      )}
    </Button>
  )
}
