'use client'

import { createContext, useContext, useState, useMemo, useCallback, useRef, type ReactNode } from 'react'

export type RegStatus = 'pending' | 'approved' | 'waitlist' | 'withdrawn'
export type BulkAction = 'approve' | 'reject' | 'withdraw' | 'restore'

interface RegMeta {
  sessionId: string
  status: string
  fullName: string
}

interface SelectionState {
  selectedIds: Set<string>
  counts: { pending: number; approved: number; withdrawn: number }
  toggle: (regId: string) => void
  toggleRange: (regId: string, orderedRegIds: string[]) => void
  clear: () => void
  /** Card mount gọi để đăng ký reg metadata vào lookup cho action handler */
  registerLookup: (entries: Array<{ id: string } & RegMeta>) => void
  busy: BulkAction | null
  setBusy: (b: BulkAction | null) => void
  lookup: Map<string, RegMeta>
}

const Ctx = createContext<SelectionState | null>(null)

/**
 * ScheduleSelectionProvider — share selection state giữa header (HeaderControls)
 * và grid (InteractiveSessionCard rows). Wrap toàn bộ /admin/schedule page.
 *
 * lookup là mutable Map (ref-stable) — InteractiveSessionCard useEffect đăng ký
 * regs khi mount. Counts memo theo selectedIds + lookup size.
 */
export function ScheduleSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lastSelected, setLastSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState<BulkAction | null>(null)
  // Lookup ref-stable, mutate trực tiếp — counts re-compute qua lookupVersion bump
  const lookupRef = useRef(new Map<string, RegMeta>())
  const [lookupVersion, setLookupVersion] = useState(0)

  const counts = useMemo(() => {
    let pending = 0, approved = 0, withdrawn = 0
    for (const id of selectedIds) {
      const r = lookupRef.current.get(id)
      if (!r) continue
      if (r.status === 'pending' || r.status === 'waitlist') pending++
      else if (r.status === 'approved') approved++
      else if (r.status === 'withdrawn') withdrawn++
    }
    return { pending, approved, withdrawn }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, lookupVersion])

  const toggle = useCallback((regId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(regId)) next.delete(regId)
      else next.add(regId)
      return next
    })
    setLastSelected(regId)
  }, [])

  const toggleRange = useCallback((regId: string, ordered: string[]) => {
    if (!lastSelected) {
      toggle(regId)
      return
    }
    const a = ordered.indexOf(lastSelected)
    const b = ordered.indexOf(regId)
    if (a < 0 || b < 0) {
      toggle(regId)
      return
    }
    const [from, to] = a < b ? [a, b] : [b, a]
    setSelectedIds(prev => {
      const next = new Set(prev)
      for (let i = from; i <= to; i++) next.add(ordered[i])
      return next
    })
    setLastSelected(regId)
  }, [lastSelected, toggle])

  const clear = useCallback(() => {
    setSelectedIds(new Set())
    setLastSelected(null)
  }, [])

  const registerLookup = useCallback((entries: Array<{ id: string } & RegMeta>) => {
    let changed = false
    for (const e of entries) {
      const existing = lookupRef.current.get(e.id)
      if (!existing || existing.status !== e.status || existing.sessionId !== e.sessionId) {
        lookupRef.current.set(e.id, { sessionId: e.sessionId, status: e.status, fullName: e.fullName })
        changed = true
      }
    }
    if (changed) setLookupVersion(v => v + 1)
  }, [])

  const value: SelectionState = {
    selectedIds,
    counts,
    toggle,
    toggleRange,
    clear,
    registerLookup,
    busy,
    setBusy,
    lookup: lookupRef.current,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useScheduleSelection(): SelectionState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useScheduleSelection must be inside ScheduleSelectionProvider')
  return ctx
}
