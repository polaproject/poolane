'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, X } from 'lucide-react'

interface Props {
  txId: string
  amount: number
  content: string
}

interface SearchResult {
  id: string
  label: string  // VD: "POLA-2025-0006 · Hoàng Văn Dũng"
  detail: string
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export function UnmatchedActions({ txId, amount }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'matching' | 'ignoring'>('idle')
  const [matchType, setMatchType] = useState<'order' | 'enrollment'>('order')
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [customAmount, setCustomAmount] = useState(String(amount))
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function doSearch(query: string) {
    setSearch(query)
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      if (matchType === 'order') {
        // Search orders by status approved + by student name
        const res = await fetch(`/api/shop/orders?status=approved`)
        const json = await res.json()
        if (json.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const filtered = (json.data as any[])
            .filter(o => o.student.user.fullName.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 10)
            .map(o => ({
              id: o.id,
              label: `${o.student.user.fullName}`,
              detail: `${fmt(o.finalAmount)} · ${o.orderItems.length} sản phẩm · ${o.id.slice(0, 8)}`,
            }))
          setResults(filtered)
        }
      } else {
        // For enrollment, no search API yet — give simpler input: paste enrollment ID
        const res = await fetch(`/api/students?search=${encodeURIComponent(query)}&pageSize=5`)
        const json = await res.json()
        if (json.data?.items) {
          // For each student fetch their enrollments
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const studentIds = (json.data.items as any[]).map(s => s.id)
          if (studentIds.length === 0) {
            setResults([])
            return
          }
          // Fetch enrollments via individual lookups (simple approach)
          const enrollPromises = studentIds.slice(0, 5).map(sid =>
            fetch(`/api/students/${sid}`).then(r => r.json()).catch(() => null)
          )
          const studentDetails = await Promise.all(enrollPromises)
          const enrollments: SearchResult[] = []
          for (const sd of studentDetails) {
            if (!sd?.data?.enrollments) continue
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const e of sd.data.enrollments as any[]) {
              if (e.status === 'active' || e.status === 'extension') {
                const debt = e.course.price - e.totalPaid
                if (debt > 0) {
                  enrollments.push({
                    id: e.id,
                    label: `${sd.data.user.fullName} · ${e.course.code}`,
                    detail: `Còn nợ ${fmt(debt)} · ${e.course.name}`,
                  })
                }
              }
            }
          }
          setResults(enrollments.slice(0, 10))
        }
      }
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  async function submitMatch() {
    if (!selectedId) { setError('Chưa chọn đối tượng'); return }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/unmatched-transactions/${txId}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: matchType,
          targetId: selectedId,
          amount: matchType === 'enrollment' ? Number(customAmount) : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }
      router.refresh()
    } catch {
      setError('Không thể kết nối')
      setSubmitting(false)
    }
  }

  async function submitIgnore() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/unmatched-transactions/${txId}/ignore`, { method: 'PATCH' })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error?.message ?? 'Có lỗi')
        setSubmitting(false)
        return
      }
      router.refresh()
    } catch {
      setError('Không thể kết nối')
      setSubmitting(false)
    }
  }

  if (mode === 'idle') {
    return (
      <div className="flex gap-2">
        <button onClick={() => setMode('matching')}
          className="inline-flex items-center gap-1 px-3 py-2 bg-ink-soft text-paper rounded-lg text-xs font-semibold">
          <Check className="w-3.5 h-3.5" /> Gán vào đơn/khoá
        </button>
        <button onClick={submitIgnore} disabled={submitting}
          className="inline-flex items-center gap-1 px-3 py-2 border border-foreground/15 text-foreground/70 rounded-lg text-xs font-semibold hover:bg-foreground/5">
          <X className="w-3.5 h-3.5" /> Bỏ qua
        </button>
      </div>
    )
  }

  return (
    <div className="w-full bg-paper/40 rounded-xl p-4 mt-2">
      {/* Type toggle */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => { setMatchType('order'); setResults([]); setSelectedId(''); setSearch('') }}
          className={`px-3 py-1.5 text-xs rounded-lg ${matchType === 'order' ? 'bg-ink-soft text-paper' : 'bg-[var(--surface)] text-foreground/60 border border-foreground/15'}`}>
          🛒 Đơn shop
        </button>
        <button
          onClick={() => { setMatchType('enrollment'); setResults([]); setSelectedId(''); setSearch('') }}
          className={`px-3 py-1.5 text-xs rounded-lg ${matchType === 'enrollment' ? 'bg-ink-soft text-paper' : 'bg-[var(--surface)] text-foreground/60 border border-foreground/15'}`}>
          📚 Học phí
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={e => doSearch(e.target.value)}
        placeholder={matchType === 'order' ? 'Tìm theo tên HV (đơn đã duyệt)...' : 'Tìm theo tên HV...'}
        className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)] mb-2"
      />

      {searching && <p className="text-xs text-foreground/40">Đang tìm...</p>}

      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto border border-foreground/10 rounded-lg bg-[var(--surface)] divide-y divide-foreground/5 mb-2">
          {results.map(r => (
            <button key={r.id} type="button" onClick={() => setSelectedId(r.id)}
              className={`w-full text-left px-3 py-2 hover:bg-paper/60 ${selectedId === r.id ? 'bg-[#5B8E9F]/10' : ''}`}>
              <p className="text-sm font-semibold text-foreground">{r.label}</p>
              <p className="text-xs text-foreground/50">{r.detail}</p>
            </button>
          ))}
        </div>
      )}

      {matchType === 'enrollment' && selectedId && (
        <div className="mb-2">
          <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1">
            Số tiền ghi vào khoá (default = số tiền giao dịch)
          </label>
          <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
        </div>
      )}

      {error && <p className="text-xs text-danger mb-2">{error}</p>}

      <div className="flex gap-2">
        <button onClick={submitMatch} disabled={submitting || !selectedId}
          className="flex-1 bg-success text-white rounded-lg py-2 text-xs font-semibold hover:bg-success disabled:opacity-50">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Xác nhận gán'}
        </button>
        <button onClick={() => { setMode('idle'); setError(null); setSelectedId(''); setResults([]); setSearch('') }}
          disabled={submitting}
          className="px-3 py-2 text-xs font-semibold rounded-lg border border-foreground/15 text-foreground/70">
          Huỷ
        </button>
      </div>
    </div>
  )
}
