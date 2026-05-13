import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { FIELD_LABELS, type ApprovalRequiredField } from '@/config/profile-fields'
import { ProcessRequestActions } from './ProcessRequestActions'

type Params = { params: Promise<{ id: string }> }

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
}

export default async function ProfileRequestDetailPage({ params }: Params) {
  await requireRole(['admin', 'staff'])
  const { id } = await params

  const req = await prisma.profileChangeRequest.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: {
            select: { fullName: true, phone: true, email: true, dob: true,
              ward: true, district: true, province: true, addressStreet: true,
              idCardNumber: true,
            }
          }
        }
      }
    }
  })

  if (!req) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = req.fieldChanges as any
  const changes = (raw?.changes ?? {}) as Record<string, { old: string | null; new: string }>
  const reason = raw?.reason as string | null
  const fields = Object.keys(changes) as ApprovalRequiredField[]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/profile-requests"
          className="inline-flex items-center gap-1 text-sm text-[#1C2B4A]/70 hover:text-[#1C2B4A]"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 shadow-sm mb-4">
        <div className="px-5 py-4 border-b border-[#1C2B4A]/8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl text-[#1C2B4A]">
              {req.student.user.fullName}
            </h1>
            <p className="text-xs text-[#1C2B4A]/50 mt-0.5">
              {req.student.studentCode} · {req.student.user.phone} · Yêu cầu lúc{' '}
              {format(req.requestedAt, 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
          <span className={`px-3 py-1 text-xs rounded-full border ${STATUS_COLORS[req.status]}`}>
            {STATUS_LABELS[req.status]}
          </span>
        </div>

        <div className="p-5">
          <h2 className="text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-3">
            Thay đổi đề xuất ({fields.length} trường)
          </h2>

          <div className="space-y-3">
            {fields.map(field => {
              const entry = changes[field]
              return (
                <div key={field} className="border border-[#1C2B4A]/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 bg-[#F6F1EA]/40 border-b border-[#1C2B4A]/8">
                    <p className="text-sm font-semibold text-[#1C2B4A]">
                      {FIELD_LABELS[field] ?? field}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-[#1C2B4A]/8">
                    <div className="p-4">
                      <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/40 mb-1">Hiện tại</p>
                      <p className="text-sm text-[#1C2B4A]">
                        {entry.old || <span className="text-[#1C2B4A]/30">— chưa có —</span>}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50/40">
                      <p className="text-xs uppercase tracking-wider text-green-700 mb-1">Đề xuất mới</p>
                      <p className="text-sm font-semibold text-green-900">{entry.new}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {reason && (
            <div className="mt-4 px-4 py-3 bg-[#F6F1EA]/40 rounded-xl border border-[#1C2B4A]/8">
              <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/40 mb-1">Lý do từ học viên</p>
              <p className="text-sm text-[#1C2B4A]/80">{reason}</p>
            </div>
          )}

          {req.status === 'pending' ? (
            <ProcessRequestActions id={req.id} />
          ) : (
            <div className="mt-5 px-4 py-3 bg-[#F6F1EA]/40 rounded-xl border border-[#1C2B4A]/8">
              <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/40 mb-1">
                Đã xử lý lúc {req.processedAt ? format(req.processedAt, 'dd/MM/yyyy HH:mm') : '—'}
              </p>
              {req.processedNotes && (
                <p className="text-sm text-[#1C2B4A]/80 mt-1">{req.processedNotes}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
