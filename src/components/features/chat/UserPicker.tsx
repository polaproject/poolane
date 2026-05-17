'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Check, Loader2, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Chip } from '@/components/ui/Chip'

interface UserItem {
  id: string
  fullName: string
  role: 'admin' | 'staff' | 'student'
  avatarUrl: string | null
}

interface UserPickerProps {
  onCreate: (payload: { participantIds: string[]; name?: string }) => void
  onClose: () => void
  className?: string
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Quản trị',
  staff: 'Trợ giảng',
  student: 'Học viên',
}
const ROLE_VARIANT: Record<string, 'accent' | 'mist'> = {
  admin: 'accent',
  staff: 'accent',
  student: 'mist',
}

const MAX_OTHER_PARTICIPANTS = 19 // + self = 20 total

/**
 * UserPicker — multi-select picker để tạo DM hoặc group.
 * 1 selected + no name → DM
 * 2+ selected → group (name bắt buộc)
 */
export function UserPicker({ onCreate, onClose, className = '' }: UserPickerProps) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<UserItem[]>([])
  const [selected, setSelected] = useState<UserItem[]>([])
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus với preventScroll để không scroll background (fix Phase 19)
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  // Search debounce 300ms
  useEffect(() => {
    if (q.trim().length < 1) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&limit=20`)
        const j = await r.json()
        setResults(j.data?.items ?? [])
      } catch {
        setResults([])
      }
      setLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  const isFull = selected.length >= MAX_OTHER_PARTICIPANTS
  const isGroup = selected.length >= 2
  const ctaDisabled =
    selected.length === 0 || (isGroup && groupName.trim().length === 0)

  function toggleSelect(u: UserItem) {
    const exists = selected.find(s => s.id === u.id)
    if (exists) {
      setSelected(prev => prev.filter(s => s.id !== u.id))
    } else if (!isFull) {
      setSelected(prev => [...prev, u])
    }
  }

  function removeSelected(id: string) {
    setSelected(prev => prev.filter(s => s.id !== id))
  }

  function handleSubmit() {
    if (ctaDisabled) return
    onCreate({
      participantIds: selected.map(s => s.id),
      name: isGroup ? groupName.trim() : undefined,
    })
  }

  const ctaText =
    selected.length === 0
      ? 'Chọn người tham gia'
      : !isGroup
        ? 'Tạo cuộc trò chuyện riêng'
        : groupName.trim().length === 0
          ? 'Nhập tên nhóm'
          : `Tạo nhóm (${selected.length + 1} người)`

  return (
    <div className={`glass-panel rounded-card p-3 w-72 shadow-glass ring-1 ring-foreground/10 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="lqg-headline text-sm">Nhắn tin mới</span>
        <button
          onClick={onClose}
          className="text-foreground/50 hover:text-foreground transition-colors"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selected.map(u => (
            <div
              key={u.id}
              className="inline-flex items-center gap-1 bg-accent/15 rounded-pill pl-1 pr-1.5 py-0.5"
            >
              <Avatar avatarUrl={u.avatarUrl} fullName={u.fullName} size="xs" />
              <span className="text-[11px] font-medium truncate max-w-[80px]">{u.fullName}</span>
              <button
                onClick={() => removeSelected(u.id)}
                className="text-foreground/60 hover:text-danger transition-colors"
                aria-label={`Bỏ ${u.fullName}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <input
        ref={inputRef}
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Tìm theo tên hoặc số điện thoại..."
        className="lqg-input w-full text-sm mb-2"
      />

      {/* Group name input (chỉ hiện khi 2+ selected) */}
      {isGroup && (
        <input
          value={groupName}
          onChange={e => setGroupName(e.target.value.slice(0, 80))}
          placeholder="Tên nhóm (bắt buộc)"
          className="lqg-input w-full text-sm mb-2"
          maxLength={80}
        />
      )}

      {/* Capacity hint */}
      {selected.length >= 15 && (
        <p className="text-[10px] text-foreground/55 mb-1 inline-flex items-center gap-1">
          <Users className="h-2.5 w-2.5" /> Nhóm tối đa 20 người (bạn + 19 khác)
        </p>
      )}

      {/* Results list */}
      <div className="max-h-44 overflow-y-auto space-y-0.5">
        {loading && (
          <p className="text-center text-foreground/40 text-xs py-2">
            <Loader2 className="inline h-3 w-3 animate-spin" /> Đang tìm...
          </p>
        )}
        {!loading && q.trim().length === 0 && (
          <p className="text-center text-foreground/40 text-xs py-2">
            Gõ tên hoặc số điện thoại để tìm
          </p>
        )}
        {!loading && results.length === 0 && q.trim().length >= 1 && (
          <p className="text-center text-foreground/40 text-xs py-2">Không tìm thấy</p>
        )}
        {results.map(u => {
          const isSelected = selected.some(s => s.id === u.id)
          const disabled = !isSelected && isFull
          return (
            <button
              key={u.id}
              onClick={() => toggleSelect(u)}
              disabled={disabled}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-left
                ${isSelected ? 'bg-accent/15 ring-1 ring-accent/30' : 'hover:bg-foreground/5'}
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Avatar avatarUrl={u.avatarUrl} fullName={u.fullName} size="xs" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate font-medium">{u.fullName}</p>
              </div>
              <Chip variant={ROLE_VARIANT[u.role]} className="text-[9px] px-1.5 py-0 shrink-0">
                {ROLE_LABEL[u.role]}
              </Chip>
              {isSelected && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* CTA */}
      <button
        onClick={handleSubmit}
        disabled={ctaDisabled}
        className="mt-2 w-full py-2 rounded-lg text-sm font-medium bg-accent text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105 transition-all"
      >
        {ctaText}
      </button>
    </div>
  )
}
