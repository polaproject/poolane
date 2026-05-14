'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus } from 'lucide-react'

interface Student { id: string; studentCode: string; fullName: string; phone: string | null }

export function VideoForm({ students }: { students: Student[] }) {
  const router = useRouter()
  const [studentId, setStudentId] = useState('')
  const [search, setSearch] = useState('')
  const [driveUrl, setDriveUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const filtered = useMemo(() => {
    if (!search.trim()) return students.slice(0, 10)
    const q = search.toLowerCase()
    return students.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      s.studentCode.toLowerCase().includes(q) ||
      (s.phone ?? '').includes(q)
    ).slice(0, 10)
  }, [students, search])

  const selectedStudent = students.find(s => s.id === studentId)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/video-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, driveUrl, caption: caption.trim() || undefined })
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Lỗi')
        setSubmitting(false)
        return
      }
      setSuccess(true)
      setStudentId('')
      setDriveUrl('')
      setCaption('')
      setSearch('')
      setSubmitting(false)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    } catch {
      setError('Không thể kết nối')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass-card border border-foreground/8 p-5 space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
          Học viên <span className="text-danger">*</span>
        </label>
        {selectedStudent ? (
          <div className="flex items-center justify-between p-3 bg-paper/40 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-foreground">{selectedStudent.fullName}</p>
              <p className="text-xs text-foreground/50">{selectedStudent.studentCode}</p>
            </div>
            <button type="button" onClick={() => setStudentId('')} className="text-xs underline text-foreground/60">Đổi</button>
          </div>
        ) : (
          <>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm tên/SĐT/mã..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
            </div>
            <div className="border border-foreground/10 rounded-lg divide-y divide-foreground/5 max-h-40 overflow-y-auto">
              {filtered.map(s => (
                <button key={s.id} type="button" onClick={() => setStudentId(s.id)}
                  className="w-full text-left px-3 py-2 hover:bg-paper/40">
                  <p className="text-sm font-semibold text-foreground">{s.fullName}</p>
                  <p className="text-xs text-foreground/50">{s.studentCode} · {s.phone}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
          Link Google Drive <span className="text-danger">*</span>
        </label>
        <input type="url" required value={driveUrl} onChange={e => setDriveUrl(e.target.value)}
          placeholder="https://drive.google.com/file/d/..."
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
        <p className="text-xs text-foreground/40 mt-1">
          Đảm bảo set permission &ldquo;Anyone with the link&rdquo; trên Drive
        </p>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
          Mô tả (tuỳ chọn)
        </label>
        <textarea rows={2} maxLength={500} value={caption} onChange={e => setCaption(e.target.value)}
          placeholder="VD: Buổi 5 - chú ý phần kéo tay"
          className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
      </div>

      {error && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{error}</div>}
      {success && <div className="text-sm text-success bg-success/10 border border-success/30 rounded-lg px-3 py-2">✓ Đã gửi video cho học viên!</div>}

      <button type="submit" disabled={submitting || !studentId || !driveUrl}
        className="w-full inline-flex items-center justify-center gap-2 bg-ink-soft text-paper rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50">
        <Plus className="w-4 h-4" /> {submitting ? 'Đang gửi...' : 'Gửi video'}
      </button>
    </form>
  )
}
