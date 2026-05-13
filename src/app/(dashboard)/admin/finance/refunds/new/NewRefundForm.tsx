'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { COURSE_REFUND_TIERS, POOL_TICKET } from '@/config/constants'

interface StudentSummary {
  id: string
  studentCode: string
  fullName: string
  phone: string | null
}

interface PreselectedStudent extends StudentSummary {
  enrollments: Array<{
    id: string
    courseCode: string
    courseName: string
    totalPaid: number
    status: string
  }>
  activeTicket: {
    id: string
    sessionsUsed: number
    totalSessions: number
    pricePaid: number
  } | null
}

interface Props {
  students: StudentSummary[]
  preselected: PreselectedStudent | null
}

const REASON_OPTIONS = [
  { value: 'work',   label: 'Công việc' },
  { value: 'health', label: 'Sức khoẻ' },
  { value: 'other',  label: 'Khác' },
] as const

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

// Preview tier rate (the API will recompute from real attendance count)
function previewCourseRate(sessionsAttended: number): number {
  const tier = COURSE_REFUND_TIERS.find(t => sessionsAttended >= t.minSessions && sessionsAttended <= t.maxSessions)
    ?? COURSE_REFUND_TIERS[COURSE_REFUND_TIERS.length - 1]
  return tier.rate
}

export function NewRefundForm({ students, preselected }: Props) {
  const router = useRouter()

  const [studentId, setStudentId] = useState<string>(preselected?.id ?? '')
  const [studentSearch, setStudentSearch] = useState('')
  const [details, setDetails] = useState<PreselectedStudent | null>(preselected)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const [includeCourse, setIncludeCourse] = useState(false)
  const [enrollmentId, setEnrollmentId] = useState('')
  const [includeTicket, setIncludeTicket] = useState(false)
  const [reason, setReason] = useState<'work' | 'health' | 'other'>('other')
  const [reasonText, setReasonText] = useState('')
  const [estimatedSessionsAttended, setEstimatedSessionsAttended] = useState('0')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students.slice(0, 20)
    const q = studentSearch.trim().toLowerCase()
    return students.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      s.studentCode.toLowerCase().includes(q) ||
      (s.phone ?? '').includes(q)
    ).slice(0, 20)
  }, [students, studentSearch])

  // Load student details when student selected (if not preselected)
  async function selectStudent(s: StudentSummary) {
    setStudentId(s.id)
    setStudentSearch('')
    if (details?.id === s.id) return
    setLoadingDetails(true)
    setDetails(null)
    setIncludeCourse(false)
    setEnrollmentId('')
    setIncludeTicket(false)

    try {
      const res = await fetch(`/api/students/${s.id}`)
      const json = await res.json()
      if (json.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d: any = json.data
        setDetails({
          id: d.id,
          studentCode: d.studentCode,
          fullName: d.user.fullName,
          phone: d.user.phone,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          enrollments: (d.enrollments ?? []).filter((e: any) => ['active', 'extension', 'completed'].includes(e.status)).map((e: any) => ({
            id: e.id,
            courseCode: e.course.code,
            courseName: e.course.name,
            totalPaid: e.totalPaid,
            status: e.status,
          })),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          activeTicket: (d.poolTickets ?? []).find((t: any) => t.isActive) ? {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            id: (d.poolTickets ?? []).find((t: any) => t.isActive).id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sessionsUsed: (d.poolTickets ?? []).find((t: any) => t.isActive).sessionsUsed,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            totalSessions: (d.poolTickets ?? []).find((t: any) => t.isActive).totalSessions,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pricePaid: (d.poolTickets ?? []).find((t: any) => t.isActive).pricePaid,
          } : null,
        })
      }
    } catch {
      setError('Không thể tải thông tin học viên')
    } finally {
      setLoadingDetails(false)
    }
  }

  // Preview calculations
  const selectedEnrollment = details?.enrollments.find(e => e.id === enrollmentId)
  const previewSessions = Number(estimatedSessionsAttended) || 0
  const previewCourseRefund = includeCourse && selectedEnrollment
    ? Math.floor(selectedEnrollment.totalPaid * previewCourseRate(previewSessions))
    : 0
  const previewTicketRefund = includeTicket && details?.activeTicket
    ? Math.floor(
        Math.max(0, Math.min(details.activeTicket.totalSessions, 10) - details.activeTicket.sessionsUsed) *
        POOL_TICKET.PER_SESSION_VALUE * POOL_TICKET.REFUND_RATE
      )
    : 0
  const previewTotal = previewCourseRefund + previewTicketRefund

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!studentId) { setError('Vui lòng chọn học viên'); return }
    if (!includeCourse && !includeTicket) { setError('Phải chọn ít nhất 1 khoản muốn hoàn'); return }
    if (includeCourse && !enrollmentId) { setError('Vui lòng chọn khoá học cần hoàn'); return }
    if (reason === 'other' && !reasonText.trim()) { setError('Vui lòng nhập chi tiết lý do'); return }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        studentId,
        includeCourseRefund: includeCourse,
        includeTicketRefund: includeTicket,
        reason,
      }
      if (includeCourse) body.enrollmentId = enrollmentId
      if (includeTicket && details?.activeTicket) body.poolTicketId = details.activeTicket.id
      if (reasonText.trim()) body.reasonText = reasonText.trim()

      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }

      router.push(`/admin/finance/refunds/${json.data.id}`)
      router.refresh()
    } catch {
      setError('Không thể kết nối tới máy chủ')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Student selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-5">
        <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-2">
          Học viên <span className="text-red-500">*</span>
        </label>

        {details ? (
          <div className="flex items-center justify-between p-3 bg-[#F6F1EA]/40 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-[#1C2B4A]">{details.fullName}</p>
              <p className="text-xs text-[#1C2B4A]/50">{details.studentCode} · {details.phone}</p>
            </div>
            <button
              type="button"
              onClick={() => { setDetails(null); setStudentId(''); setIncludeCourse(false); setIncludeTicket(false); setEnrollmentId('') }}
              className="text-xs text-[#1C2B4A]/60 hover:text-[#1C2B4A] underline"
            >
              Đổi học viên
            </button>
          </div>
        ) : (
          <>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C2B4A]/40" />
              <input
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="Tìm tên, SĐT hoặc mã học viên..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 bg-white"
              />
            </div>
            <div className="max-h-64 overflow-y-auto border border-[#1C2B4A]/10 rounded-lg divide-y divide-[#1C2B4A]/5">
              {filteredStudents.length === 0 ? (
                <p className="p-4 text-sm text-[#1C2B4A]/40 text-center">Không tìm thấy</p>
              ) : (
                filteredStudents.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectStudent(s)}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#F6F1EA]/40 transition-colors"
                  >
                    <p className="text-sm font-semibold text-[#1C2B4A]">{s.fullName}</p>
                    <p className="text-xs text-[#1C2B4A]/50">{s.studentCode} · {s.phone}</p>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {loadingDetails && <p className="text-xs text-[#1C2B4A]/50 mt-2">Đang tải thông tin...</p>}
      </div>

      {/* Refund options */}
      {details && (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-5">
            <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-3">
              Chọn khoản muốn hoàn
            </p>

            {/* Course refund */}
            <div className="border border-[#1C2B4A]/10 rounded-xl p-4 mb-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCourse}
                  onChange={e => {
                    setIncludeCourse(e.target.checked)
                    if (!e.target.checked) setEnrollmentId('')
                  }}
                  disabled={details.enrollments.length === 0}
                  className="mt-1 w-4 h-4 rounded border-[#1C2B4A]/30"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1C2B4A]">📚 Hoàn học phí</p>
                  {details.enrollments.length === 0 ? (
                    <p className="text-xs text-[#1C2B4A]/40 mt-1">Học viên không có khoá nào đang hoạt động</p>
                  ) : (
                    <p className="text-xs text-[#1C2B4A]/50 mt-0.5">
                      Hoàn theo tỉ lệ trong CLAUDE.md §7.5 — số buổi đã học từ bảng attendance
                    </p>
                  )}
                </div>
              </label>

              {includeCourse && (
                <div className="pl-7 mt-3 space-y-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
                      Khoá học
                    </label>
                    <select
                      value={enrollmentId}
                      onChange={e => setEnrollmentId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 bg-white"
                    >
                      <option value="">— Chọn khoá —</option>
                      {details.enrollments.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.courseCode} · {e.courseName} · Đã đóng {fmt(e.totalPaid)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
                      Số buổi đã học (ước tính để preview)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={estimatedSessionsAttended}
                      onChange={e => setEstimatedSessionsAttended(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 bg-white"
                    />
                    <p className="text-xs text-[#1C2B4A]/40 mt-1">
                      Hệ thống sẽ đếm từ bảng attendance khi tạo yêu cầu. Số này chỉ dùng để preview tỉ lệ.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Ticket refund */}
            <div className="border border-[#1C2B4A]/10 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTicket}
                  onChange={e => setIncludeTicket(e.target.checked)}
                  disabled={!details.activeTicket}
                  className="mt-1 w-4 h-4 rounded border-[#1C2B4A]/30"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1C2B4A]">🎟️ Hoàn vé bơi</p>
                  {!details.activeTicket ? (
                    <p className="text-xs text-[#1C2B4A]/40 mt-1">Học viên không có vé bơi hoạt động</p>
                  ) : (
                    <p className="text-xs text-[#1C2B4A]/50 mt-0.5">
                      Đã dùng {details.activeTicket.sessionsUsed}/{details.activeTicket.totalSessions} buổi.
                      Hoàn 80% giá trị buổi chưa dùng (chỉ tính 10 buổi gốc).
                    </p>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Preview breakdown */}
          {(includeCourse || includeTicket) && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wider text-blue-700 font-semibold mb-3">
                Preview số tiền hoàn (tạm tính)
              </p>
              <div className="space-y-2 text-sm">
                {includeCourse && selectedEnrollment && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#1C2B4A]/70">
                      📚 {selectedEnrollment.courseCode} · tỉ lệ {Math.round(previewCourseRate(previewSessions) * 100)}%
                    </span>
                    <span className="font-semibold text-[#1C2B4A]">{fmt(previewCourseRefund)}</span>
                  </div>
                )}
                {includeTicket && details.activeTicket && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#1C2B4A]/70">🎟️ Vé bơi</span>
                    <span className="font-semibold text-[#1C2B4A]">{fmt(previewTicketRefund)}</span>
                  </div>
                )}
                <div className="border-t border-blue-300 pt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-900">Tổng (tạm tính)</span>
                  <span className="font-heading text-xl text-blue-900">{fmt(previewTotal)}</span>
                </div>
              </div>
              <p className="text-xs text-blue-700/70 mt-3">
                Số chính xác sẽ tính lại khi tạo yêu cầu, dựa trên attendance thật.
              </p>
            </div>
          )}

          {/* Reason */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-5 space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
                Lý do <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {REASON_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setReason(opt.value)}
                    className={`px-3 py-2 text-sm rounded-lg border ${
                      reason === opt.value
                        ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]'
                        : 'bg-white text-[#1C2B4A]/70 border-[#1C2B4A]/15 hover:border-[#1C2B4A]/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
                Chi tiết {reason === 'other' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                rows={2}
                maxLength={300}
                value={reasonText}
                onChange={e => setReasonText(e.target.value)}
                placeholder="Ghi chú thêm..."
                className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 bg-white"
              />
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !studentId}
          className="flex-1 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#1C2B4A]/90 disabled:opacity-50"
        >
          {submitting ? 'Đang tạo...' : 'Tạo yêu cầu hoàn tiền'}
        </button>
        <Link
          href="/admin/finance/refunds"
          className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-[#1C2B4A]/15 text-[#1C2B4A]/70 hover:bg-[#1C2B4A]/5"
        >
          Huỷ
        </Link>
      </div>
    </form>
  )
}
