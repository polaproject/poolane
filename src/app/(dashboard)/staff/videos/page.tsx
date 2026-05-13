import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { VideoForm } from './VideoForm'
import { format } from 'date-fns'

export default async function StaffVideosPage() {
  await requireRole(['admin', 'staff'])

  const students = await prisma.student.findMany({
    where: { status: { in: ['active', 'extension'] } },
    select: {
      id: true, studentCode: true,
      user: { select: { fullName: true, phone: true } }
    },
    orderBy: { user: { fullName: 'asc' } },
    take: 200,
  })

  const recent = await prisma.videoLink.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      student: { select: { studentCode: true, user: { select: { fullName: true } } } }
    }
  })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Video bơi</h1>
        <p className="text-sm text-[#1C2B4A]/50 mt-1">Gắn link Google Drive cho học viên xem</p>
      </div>

      <VideoForm students={students.map(s => ({
        id: s.id, studentCode: s.studentCode, fullName: s.user.fullName, phone: s.user.phone,
      }))} />

      <div className="mt-8">
        <h2 className="font-semibold text-[#1C2B4A] mb-3">Video đã gửi gần đây</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-[#1C2B4A]/40">Chưa có video nào</p>
        ) : (
          <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F6F1EA]/40">
                <tr className="text-left text-xs uppercase tracking-wider text-[#1C2B4A]/50">
                  <th className="px-5 py-3">Học viên</th>
                  <th className="px-5 py-3">Caption</th>
                  <th className="px-5 py-3">Ngày gửi</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2B4A]/5">
                {recent.map(v => (
                  <tr key={v.id}>
                    <td className="px-5 py-3 text-sm">
                      <p className="font-semibold text-[#1C2B4A]">{v.student.user.fullName}</p>
                      <p className="text-xs text-[#1C2B4A]/40">{v.student.studentCode}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-[#1C2B4A]/70 max-w-md truncate">
                      {v.caption ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#1C2B4A]/50">
                      {format(v.createdAt, 'HH:mm dd/MM/yyyy')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <a href={v.driveUrl} target="_blank" rel="noopener"
                        className="text-xs font-semibold text-[#5B8E9F] hover:underline">
                        Mở Drive →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
