'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowLeft, Check, X, UserPlus, Loader2 } from 'lucide-react'
import Link from 'next/link'

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
      // Lấy danh sách đã được duyệt cho session này
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
    } catch {
      toast.error('Không thể tải danh sách học viên')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => { loadData() }, [loadData])

  function setStatus(studentId: string, status: 'present' | 'absent') {
    setAttendees(prev => prev.map(a =>
      a.studentId === studentId ? { ...a, status } : a
    ))
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
      toast.error(`Còn ${unmarked.length} học viên chưa được điểm danh`)
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
            .map(a => ({ studentId: a.studentId, status: a.status!, notes: a.notes }))
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error(data.error?.message ?? 'Có lỗi xảy ra')
        return
      }

      toast.success('Điểm danh hoàn tất! Vé bơi đã được cập nhật tự động.')
      router.push('/admin/schedule')

    } catch {
      toast.error('Không thể kết nối')
    } finally {
      setSaving(false)
    }
  }

  const presentCount = attendees.filter(a => a.status === 'present' || a.status === 'walk_in').length
  const absentCount = attendees.filter(a => a.status === 'absent').length

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/schedule"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="font-heading text-2xl text-[#1C2B4A]">Điểm danh</h1>
          <p className="text-xs text-[#1C2B4A]/50">
            {presentCount} có mặt · {absentCount} vắng · {attendees.filter(a => a.status === null).length} chưa đánh dấu
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#1C2B4A]/40" />
        </div>
      ) : (
        <>
          {/* Attendance list */}
          <div className="space-y-2 mb-4">
            {attendees.map(a => (
              <div key={a.studentId} className={`bg-white rounded-xl border p-3.5 flex items-center gap-3 transition-colors ${
                a.status === 'present' || a.status === 'walk_in'
                  ? 'border-green-200 bg-green-50/50'
                  : a.status === 'absent'
                    ? 'border-red-200 bg-red-50/50'
                    : 'border-[#1C2B4A]/10'
              }`}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1C2B4A] text-sm truncate">{a.fullName}</p>
                  <p className="text-xs text-[#1C2B4A]/50">{a.phone}</p>
                  {a.status === 'walk_in' && (
                    <Badge variant="outline" className="text-xs mt-0.5">Phát sinh</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatus(a.studentId, 'absent')}
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                      a.status === 'absent'
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'border-[#1C2B4A]/15 text-[#1C2B4A]/40 hover:border-red-300'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setStatus(a.studentId, 'present')}
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                      a.status === 'present' || a.status === 'walk_in'
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-[#1C2B4A]/15 text-[#1C2B4A]/40 hover:border-green-300'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Walk-in button */}
          <button
            onClick={addWalkIn}
            className="w-full border border-dashed border-[#1C2B4A]/20 rounded-xl p-3 flex items-center justify-center gap-2 text-sm text-[#1C2B4A]/50 hover:border-[#1C2B4A]/40 hover:text-[#1C2B4A]/70 transition-all mb-6"
          >
            <UserPlus className="w-4 h-4" />
            Thêm học viên phát sinh
          </button>

          {/* Submit */}
          <Button
            className="w-full bg-[#1C2B4A] text-[#F6F1EA] hover:bg-[#1C2B4A]/90 h-12"
            disabled={saving || attendees.length === 0}
            onClick={handleSubmit}
          >
            {saving
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</>
              : `Lưu điểm danh · ${presentCount} có mặt`
            }
          </Button>
        </>
      )}
    </div>
  )
}
