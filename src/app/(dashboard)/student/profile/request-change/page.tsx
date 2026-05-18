import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
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
        },
      },
    },
  })

  if (!student) notFound()

  const pending = await prisma.profileChangeRequest.findFirst({
    where: { studentId: student.id, status: 'pending' },
  })
  if (pending) redirect('/student/profile')

  const u = student.user

  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
<div className="relative max-w-2xl mx-auto">
          <Link
            href="/student/profile"
            className="inline-flex items-center gap-1.5 text-sm text-paper/65 hover:text-paper transition mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.25} />
            Hồ sơ
          </Link>
          <p className="eyebrow text-paper/55 mb-2 inline-flex items-center gap-1.5">
            <Send className="h-3 w-3 text-accent" strokeWidth={1.75} /> Cần duyệt
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Yêu cầu cập nhật</h1>
          <p className="text-sm text-paper/65 mt-2 max-w-lg leading-relaxed">
            Các trường định danh cần staff/admin duyệt — chọn trường muốn đổi và nhập giá trị mới.
          </p>
        </div>
      </div>
      <div className="px-5 sm:px-8 -mt-6 max-w-2xl mx-auto relative z-10">
        <div className="glass-card glass-card-hover p-5 sm:p-6">
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
    </div>
  )
}
