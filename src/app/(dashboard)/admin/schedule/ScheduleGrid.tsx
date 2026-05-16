'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Sunrise, Sunset } from 'lucide-react'
import { toast } from 'sonner'
import { CAPACITY } from '@/config/constants'
import { InteractiveSessionCard, type SessionData } from './InteractiveSessionCard'
import { SelectionActionBar, type BulkAction } from './SelectionActionBar'

interface DayData {
  /** ISO yyyy-MM-dd */
  date: string
  morning: SessionData | null
  evening: SessionData | null
}

interface Props {
  /** 7 ngày trong tuần, mỗi ngày có session sáng/chiều (hoặc null) */
  week: DayData[]
  /** Cho EmptySlotLink — chỉ là metadata cho UI khi tạo buổi mới */
  emptySlotBuilder: { hrefBase: string }
  /** "thứ 2 dd/MM" cho header — server-prepared để format VN locale đồng nhất */
  dayLabels: Array<{ short: string; num: string; isToday: boolean }>
}

/**
 * Client wrapper cho 14 session cards. Quản lý selection state cross-card
 * (Set<regId>). Sticky SelectionActionBar trigger bulk action gọi PATCH
 * cho từng reg đã chọn, skip những reg sai status cho action đó.
 */
export function ScheduleGrid({ week, emptySlotBuilder, dayLabels }: Props) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<BulkAction | null>(null)

  /** Flat lookup map regId → {sessionId, status} để biết apply action nào */
  const regLookup = useMemo(() => {
    const m = new Map<string, { sessionId: string; status: string; fullName: string }>()
    for (const day of week) {
      for (const sess of [day.morning, day.evening]) {
        if (!sess) continue
        for (const r of sess.registrations) {
          m.set(r.id, { sessionId: sess.id, status: r.status, fullName: r.student.fullName })
        }
      }
    }
    return m
  }, [week])

  /** Đếm theo status trong selection — drive enable/disable action buttons */
  const counts = useMemo(() => {
    let pending = 0, approved = 0, withdrawn = 0
    for (const id of selectedIds) {
      const r = regLookup.get(id)
      if (!r) continue
      if (r.status === 'pending') pending++
      else if (r.status === 'approved') approved++
      else if (r.status === 'withdrawn') withdrawn++
    }
    return { pending, approved, withdrawn }
  }, [selectedIds, regLookup])

  function toggle(regId: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(regId)) next.delete(regId)
      else next.add(regId)
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  /** Map action → status hợp lệ để filter selection trước khi gọi API */
  const ACTION_VALID_STATUS: Record<BulkAction, string[]> = {
    approve: ['pending', 'waitlist'],
    reject: ['pending', 'waitlist'],
    withdraw: ['approved'],
    restore: ['withdrawn'],
  }

  async function handleAction(action: BulkAction) {
    const validStatuses = ACTION_VALID_STATUS[action]
    const targets: Array<{ regId: string; sessionId: string; fullName: string }> = []
    for (const regId of selectedIds) {
      const r = regLookup.get(regId)
      if (r && validStatuses.includes(r.status)) {
        targets.push({ regId, sessionId: r.sessionId, fullName: r.fullName })
      }
    }
    if (targets.length === 0) {
      toast.error('Không có HV nào ở trạng thái phù hợp')
      return
    }

    setBusy(action)
    const payload =
      action === 'reject' ? { action, rejectedReason: 'teacher_decision' } : { action }

    let ok = 0
    let fail = 0
    await Promise.all(targets.map(async t => {
      try {
        const res = await fetch(`/api/sessions/${t.sessionId}/registrations/${t.regId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) ok++
        else fail++
      } catch {
        fail++
      }
    }))

    const labelMap: Record<BulkAction, string> = {
      approve: 'duyệt',
      reject: 'không duyệt',
      withdraw: 'cho nghỉ',
      restore: 'cho đi học lại',
    }
    if (ok > 0) toast.success(`Đã ${labelMap[action]} ${ok} HV${fail > 0 ? ` · ${fail} thất bại` : ''}`)
    else if (fail > 0) toast.error(`Không thể ${labelMap[action]} ${fail} HV`)

    setBusy(null)
    clearSelection()
    router.refresh()
  }

  return (
    <>
      <SelectionActionBar
        selectedCount={selectedIds.size}
        counts={counts}
        busy={busy}
        onAction={handleAction}
        onClear={clearSelection}
      />

      <div className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/10 p-4 sm:p-5">
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[820px]">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {dayLabels.map((d, i) => (
                <div
                  key={i}
                  className={`text-center pb-2 border-b ${
                    d.isToday ? 'border-accent' : 'border-foreground/10'
                  }`}
                >
                  <p className={`text-[10px] tracking-widest uppercase font-medium ${
                    d.isToday ? 'text-accent' : 'text-foreground/45'
                  }`}>
                    {d.short}
                  </p>
                  <p className={`lqg-headline text-2xl mt-0.5 ${
                    d.isToday ? 'text-foreground' : 'text-foreground/65'
                  }`}>
                    {d.num}
                  </p>
                </div>
              ))}
            </div>

            {/* Morning row */}
            <div className="eyebrow text-foreground/55 mb-2 inline-flex items-center gap-1.5">
              <Sunrise className="h-3 w-3 text-accent" strokeWidth={2.25} /> Ca sáng · 5:30 – 7:30
            </div>
            <div className="grid grid-cols-7 gap-2 mb-5">
              {week.map((day, i) => (
                <div key={`morning-${i}`}>
                  {day.morning
                    ? <InteractiveSessionCard
                        session={day.morning}
                        cap={CAPACITY.MORNING_MAX}
                        slotLabel="5:30"
                        selectedIds={selectedIds}
                        onToggle={toggle}
                      />
                    : <EmptySlot href={`${emptySlotBuilder.hrefBase}?date=${day.date}&slot=morning`} />}
                </div>
              ))}
            </div>

            {/* Evening row */}
            <div className="eyebrow text-foreground/55 mb-2 inline-flex items-center gap-1.5">
              <Sunset className="h-3 w-3 text-accent" strokeWidth={2.25} /> Ca chiều · 18:00 – 20:00
            </div>
            <div className="grid grid-cols-7 gap-2">
              {week.map((day, i) => (
                <div key={`evening-${i}`}>
                  {day.evening
                    ? <InteractiveSessionCard
                        session={day.evening}
                        cap={CAPACITY.EVENING_MAX}
                        slotLabel="18:00"
                        selectedIds={selectedIds}
                        onToggle={toggle}
                      />
                    : <EmptySlot href={`${emptySlotBuilder.hrefBase}?date=${day.date}&slot=evening`} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function EmptySlot({ href }: { href: string }) {
  return (
    <Link href={href}>
      <div className="rounded-card ring-1 ring-dashed ring-foreground/15 p-3 min-h-[180px] flex flex-col items-center justify-center hover:ring-accent/40 hover:bg-paper-tint/30 transition-all cursor-pointer text-foreground/30">
        <Plus className="h-5 w-5 mb-1" strokeWidth={1.75} />
        <p className="text-xs">Tạo buổi</p>
      </div>
    </Link>
  )
}
