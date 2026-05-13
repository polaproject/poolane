import { requireRole } from '@/lib/auth'

export default async function AdminDashboard() {
  const user = await requireRole(['admin'])

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-sm text-[#1C2B4A]/50 mb-1">Xin chào,</p>
          <h1 className="font-heading text-4xl text-[#1C2B4A]">{user.fullName} ✦</h1>
          <p className="text-sm text-[#5B8E9F] mt-1 font-semibold tracking-wide uppercase">Admin · Poolane</p>
        </div>

        {/* Stats placeholder */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Học viên đang học', value: '—' },
            { label: 'Buổi hôm nay', value: '—' },
            { label: 'Doanh thu tháng', value: '—' },
            { label: 'Cần follow-up', value: '—' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-[#1C2B4A]/8">
              <p className="text-xs text-[#1C2B4A]/40 uppercase tracking-wider mb-2">{stat.label}</p>
              <p className="font-heading text-3xl text-[#1C2B4A]">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#1C2B4A]/8">
          <p className="text-[#1C2B4A]/60 text-sm">
            🎉 Phase 1 hoàn thành — hệ thống đang hoạt động!
            Các tính năng sẽ được build dần theo roadmap.
          </p>
        </div>
      </div>
    </div>
  )
}
