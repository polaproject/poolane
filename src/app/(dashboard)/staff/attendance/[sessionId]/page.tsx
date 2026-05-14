'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Check, X, UserPlus, Loader2, ClipboardCheck, Save } from 'lucide-react'
import Link from 'next/link'
import { Chip } from '@/components/ui/Chip'

type AttendeeRec = {
  studentId: string
  fullName: string
  phone: string
  status: 'present' | 'absent' | 'walk_in' | null
  notes: string
}

export default function AttendancePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()

  const [attendees, setAttendees] = useState<AttendeeRec[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/registrations`)
      const data = await res.json()
      if (data.data) {
        const approved = data.data.filter((r: { status: string }) => r.status === 'approved')
        setAttendees(approved.map((r: { context: { fullName: string; phone: string }; studentId: string }) => ({
          studentId: r.studentId,
          fullName: r.context.fullName,
          phone: r.context.phone,
          status: null,
          notes: '',
        })))
      }
    } catch { toast.error('Không thể tải danh sách') }
    finally { setLoading(false) }
  }, [sessionId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData() }, [loadData])

  function setStatus(studentId: string, status: 'present' | 'absent') {
    setAttendees(prev => prev.map(a => a.studentId === studentId ? { ...a, status } : a))
  }

  function addWalkIn() {
    const name = prompt('Tên học viên phát sinh:')
    const phone = prompt('Số điện thoại:')
    if (name) {
      setAttendees(prev => [...prev, {
        studentId: `walkin-${Date.now()}`,
        fullName: name,
        phone: phone || '',
        status: 'walk_in',
        notes: 'Phát sinh tại bể',
      }])
    }
  }

  async function handleSubmit() {
    const unmarked = attendees.filter(a => a.status === null)
    if (unmarked.length > 0) {
      toast.error(`Còn ${unmarked.length} học viên chưa điểm danh`)
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: attendees
            .filter(a => !a.studentId.startsWith('walkin-'))
            .map(a => ({ studentId: a.studentId, status: a.status!, notes: a.notes })),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { toast.error(data.error?.message ?? 'Có lỗi'); return }
      toast.success('Điểm danh hoàn tất! Vé bơi đã cập nhật.')
      router.push('/admin/schedule')
    } catch { toast.error('Không thể kết nối') }
    finally { setSaving(false) }
  }

  const presentCount = attendees.filter(a => a.status === 'present' || a.status === 'walk_in').length
  const absentCount = attendees.filter(a => a.status === 'absent').length
  const unmarkedCount = attendees.filter(a => a.status === null).length

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="bg-ink text-paper px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-2xl mx-auto">
          <Link
            href="/admin/schedule"
            className="inline-flex items-center gap-1.5 text-sm text-paper/65 hover:text-paper transition mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
            Lịch tuần
          </Link>
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
            <ClipboardCheck className="h-3 w-3 text-accent" strokeWidth={1.75} /> Điểm danh buổi
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl italic leading-tight">Đánh dấu có mặt</h1>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Chip variant="success" active>{presentCount} có mặt</Chip>
            <Chip variant="danger" active>{absentCount} vắng</Chip>
            {unmarkedCount > 0 && <Chip variant="warn" active>{unmarkedCount} chưa đánh dấu</Chip>}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-2xl mx-auto relative z-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={1.75} />
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {attendees.map(a => (
                <div
                  key={a.studentId}
                  className={`rounded-card-lg bg-white shadow-soft ring-1 p-4 flex items-center gap-3 transition ${
                    a.status === 'present' || a.status === 'walk_in' ? 'ring-success/30 bg-success/5' :
                    a.status === 'absent' ? 'ring-danger/30 bg-danger/5' : 'ring-ink/8'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{a.fullName}</p>
                    <p className="text-xs text-ink/55">{a.phone}</p>
                    {a.status === 'walk_in' && <Chip variant="mist" className="mt-1">Phát sinh</Chip>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setStatus(a.studentId, 'absent')}
                      className={`grid place-items-center h-10 w-10 rounded-pill ring-1 transition ${
                        a.status === 'absent'
                          ? 'bg-danger ring-danger text-paper'
                          : 'ring-ink/15 text-ink/40 hover:ring-danger/40 hover:text-danger'
                      }`}
                      aria-label="Vắng"
                    >
                      <X className="h-4 w-4" strokeWidth={2.25} />
                    </button>
                    <button
                      onClick={() => setStatus(a.studentId, 'present')}
                      className={`grid place-items-center h-10 w-10 rounded-pill ring-1 transition ${
                        a.status === 'present' || a.status === 'walk_in'
                          ? 'bg-success ring-success text-paper'
                          : 'ring-ink/15 text-ink/40 hover:ring-success/40 hover:text-success'
                      }`}
                      aria-label="Có mặt"
                    >
                      <Check className="h-4 w-4" strokeWidth={2.25} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addWalkIn}
              className="w-full rounded-card-lg ring-1 ring-dashed ring-ink/20 p-4 flex items-center justify-center gap-2 text-sm text-ink/60 hover:ring-accent/40 hover:text-ink hover:bg-paper-tint/30 transition mb-6"
            >
              <UserPlus className="h-4 w-4" strokeWidth={1.75} />
              Thêm HV phát sinh
            </button>

            <button
              disabled={saving || attendees.length === 0}
              onClick={handleSubmit}
              className="w-full h-12 rounded-pill bg-ink text-paper font-semibold hover:bg-ink/90 transition disabled:opacity-60 inline-flex items-center justify-center gap-2 shadow-soft"
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</>
                : <><Save className="h-4 w-4 text-accent" strokeWidth={2} /> Lưu điểm danh · {presentCount} có mặt</>
              }
            </button>
          </>
        )}
      </div>
    </div>
  )
}
