import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart } from 'lucide-react'
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
    },
  })

  if (!u) notFound()

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
            <Heart className="h-3 w-3 text-accent" strokeWidth={1.75} /> Trường mềm · Tự sửa
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl italic leading-tight">Cập nhật thông tin cá nhân</h1>
          <p className="text-sm text-paper/65 mt-2">Các trường mềm — có thể tự sửa không cần duyệt.</p>
        </div>
      </div>
      <div className="px-5 sm:px-8 -mt-6 max-w-2xl mx-auto relative z-10">
        <div className="glass-card glass-card-hover p-5 sm:p-6">
          <EditSoftForm initial={{
            occupation: u.occupation ?? '',
            healthNotes: u.healthNotes ?? '',
            emergencyContactName: u.emergencyContactName ?? '',
            emergencyContactPhone: u.emergencyContactPhone ?? '',
          }} />
        </div>
      </div>
    </div>
  )
}
