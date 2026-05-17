'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'

interface StudentItem {
  id: string
  user: { fullName: string; avatarUrl: string | null }
}

interface StudentPickerProps {
  onSelect: (studentId: string) => void
  onClose: () => void
  /** Optional className để override width/position khi nhúng vào layout khác */
  className?: string
}

/**
 * Picker chọn học viên để admin/staff bắt đầu cuộc hội thoại mới.
 * Debounce 300ms, query qua /api/students với pageSize=20.
 */
export function StudentPicker({ onSelect, onClose, className = '' }: StudentPickerProps) {
  const [q, setQ] = useState('')
  const [students, setStudents] = useState<StudentItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await fetch(
          `/api/students?search=${encodeURIComponent(q)}&status=active,enrolled,extension&page=1&pageSize=20`
        )
        const j = await r.json()
        setStudents(j.data?.items ?? [])
      } catch {
        setStudents([])
      }
      setLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className={`glass-card rounded-card p-4 w-72 shadow-glass ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="lqg-headline text-sm">Chọn học viên</span>
        <button
          onClick={onClose}
          className="text-foreground/50 hover:text-foreground transition-colors"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <input
        autoFocus
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Tìm tên học viên..."
        className="lqg-input w-full text-sm mb-2"
      />
      {loading && <p className="text-center text-foreground/40 text-xs py-2">Đang tìm...</p>}
      <div className="max-h-48 overflow-y-auto space-y-1">
        {students.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/10 transition-colors text-left"
          >
            <Avatar avatarUrl={s.user.avatarUrl} fullName={s.user.fullName} size="xs" />
            <span className="text-sm truncate">{s.user.fullName}</span>
          </button>
        ))}
        {!loading && students.length === 0 && q && (
          <p className="text-center text-foreground/40 text-xs py-2">Không tìm thấy</p>
        )}
      </div>
    </div>
  )
}
