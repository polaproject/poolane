import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { EditSoftForm } from './EditSoftForm'

export default async function EditSoftProfilePage() {
  const user = await requireRole(['student'])

  const u = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      occupation: true,
      healthNotes: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
    }
  })

  if (!u) notFound()

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <h1 className="font-heading text-2xl text-[#F6F1EA]">Cập nhật thông tin cá nhân</h1>
        <p className="text-[#F6F1EA]/50 text-xs mt-1">Các trường mềm — có thể tự sửa không cần duyệt</p>
      </div>
      <div className="px-4 -mt-4 max-w-xl mx-auto">
        <EditSoftForm initial={{
          occupation: u.occupation ?? '',
          healthNotes: u.healthNotes ?? '',
          emergencyContactName: u.emergencyContactName ?? '',
          emergencyContactPhone: u.emergencyContactPhone ?? '',
        }} />
      </div>
    </div>
  )
}
