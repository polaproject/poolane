import { requireRole } from '@/lib/auth'

export default async function StudentDashboard() {
  const user = await requireRole(['admin', 'staff', 'student'])

  return (
    <div className="min-h-screen bg-[#F6F1EA]">
      {/* Header */}
      <div className="bg-[#1C2B4A] px-5 pt-5 pb-8">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <svg width="18" height="24" viewBox="0 0 52 68" fill="none">
              <path
                d="M26 2 C26 2 28.5 22 29.5 25.5 C33 26.5 50 26 50 26 C50 26 33 26 29.5 27.5 C28.5 31 26 50 26 50 C26 50 23.5 31 22.5 27.5 C19 26 2 26 2 26 C2 26 19 26 22.5 25.5 C23.5 22 26 2 26 2 Z"
                fill="#F6F1EA"
              />
            </svg>
            <span className="font-body font-bold text-[#F6F1EA] tracking-[0.18em] text-sm">POOLANE</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#5B8E9F] flex items-center justify-center text-white font-bold text-sm">
            {user.fullName?.charAt(0) ?? 'U'}
          </div>
        </div>
        <p className="text-[#F6F1EA]/50 text-xs mb-1">Buổi tối bình yên,</p>
        <h1 className="font-heading text-2xl text-[#F6F1EA]">{user.fullName} 🌊</h1>
      </div>

      {/* Content */}
      <div className="p-4 -mt-2">
        {/* Pool ticket placeholder */}
        <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-[#1C2B4A]/8">
          <p className="text-xs text-[#1C2B4A]/40 uppercase tracking-wider mb-2">Vé bơi hiện tại</p>
          <p className="font-heading text-4xl text-[#1C2B4A] mb-1">— <span className="text-base font-body text-[#1C2B4A]/40">buổi còn lại</span></p>
          <div className="h-1 bg-[#1C2B4A]/10 rounded-full mt-3">
            <div className="h-full bg-[#5B8E9F] rounded-full w-0" />
          </div>
        </div>

        {/* Next session placeholder */}
        <div className="bg-[#1C2B4A] rounded-2xl p-4 mb-3">
          <p className="text-xs text-[#F6F1EA]/40 uppercase tracking-wider mb-2">Buổi tiếp theo</p>
          <p className="font-heading text-xl text-[#F6F1EA]">Chưa có buổi học</p>
          <p className="text-xs text-[#F6F1EA]/50 mt-1">Đăng ký ngay khi tính năng sẵn sàng</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#1C2B4A]/8">
          <p className="text-[#1C2B4A]/50 text-sm">
            🎉 Tài khoản đã được tạo thành công!
            Các tính năng sẽ xuất hiện dần theo từng phase.
          </p>
        </div>
      </div>
    </div>
  )
}
