import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { RequestChangeForm } from './RequestChangeForm'

export default async function RequestChangePage() {
  const user = await requireRole(['student'])

  const student = await prisma.student.findFirst({
    where: { userId: user.id },
    include: {
      user: {
        select: {
          fullName: true, dob: true, phone: true,
          ward: true, district: true, province: true, addressStreet: true,
          idCardNumber: true,
        }
      }
    }
  })

  if (!student) notFound()

  // Nếu đã có pending request → redirect về profile (banner sẽ hiển thị)
  const pending = await prisma.profileChangeRequest.findFirst({
    where: { studentId: student.id, status: 'pending' }
  })
  if (pending) redirect('/student/profile')

  const u = student.user

  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <h1 className="font-heading text-2xl text-[#F6F1EA]">Yêu cầu cập nhật thông tin</h1>
        <p className="text-[#F6F1EA]/50 text-xs mt-1">
          Các trường định danh cần staff/admin duyệt — chọn trường muốn đổi và nhập giá trị mới
        </p>
      </div>
      <div className="px-4 -mt-4 max-w-2xl mx-auto">
        <RequestChangeForm current={{
          fullName: u.fullName ?? '',
          dob: u.dob ? u.dob.toISOString().slice(0, 10) : '',
          phone: u.phone ?? '',
          ward: u.ward ?? '',
          district: u.district ?? '',
          province: u.province ?? '',
          addressStreet: u.addressStreet ?? '',
          idCardNumber: u.idCardNumber ?? '',
        }} />
      </div>
    </div>
  )
}
