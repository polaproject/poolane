import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ABSENCE_ALERT_THRESHOLDS } from '@/config/constants'
import { format, startOfMonth, subMonths } from 'date-fns'
import { vi } from 'date-fns/locale'

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function StaffStatsPage() {
  const user = await requireRole(['admin', 'staff'])

  const now = new Date()
  const monthStart = startOfMonth(now)
  const last3Months = subMonths(now, 3)

  const [
    totalSessions,
    totalAttendance,
    totalStudents,
    activeStudents,
    completedStudents,
    monthPayments,
    retentionData,
    weakSkillsData,
  ] = await Promise.all([
    // Tổng buổi đã dạy
    prisma.classSession.count({ where: { status: 'completed' } }),

    // Tổng lượt điểm danh có mặt
    prisma.attendance.count({ where: { status: { in: ['present', 'walk_in'] } } }),

    // Tổng học viên
    prisma.student.count(),

    // Học viên đang học
    prisma.student.count({ where: { status: { in: ['active', 'extension'] } } }),

    // Học viên đã tốt nghiệp
    prisma.enrollment.count({ where: { status: 'completed' } }),

    // Doanh thu tháng này
    prisma.payment.aggregate({
      where: { recordedAt: { gte: monthStart }, isReversal: false, amount: { gt: 0 } },
      _sum: { amount: true }
    }),

    // Tỷ lệ giữ chân — học viên active / tổng đã enroll
    prisma.student.count({ where: { status: { not: 'prospect' } } }),

    // Kỹ năng yếu nhất của lớp (top 5)
    prisma.assessmentScore.groupBy({
      by: ['skillKey'],
      _avg: { score: true },
      orderBy: { _avg: { score: 'asc' } },
      take: 5,
    }),
  ])

  const retentionRate = totalStudents > 0
    ? Math.round((activeStudents / retentionData) * 100)
    : 0

  const avgAttendance = totalSessions > 0
    ? Math.round((totalAttendance / totalSessions) * 10) / 10
    : 0

  // Kỹ năng yếu nhất
  const SKILL_NAMES: Record<string, string> = {
    body_position: 'Tư thế thân người', leg_kick: 'Đạp chân ếch', arm_pull: 'Kéo tay',
    breathing: 'Thở', glide: 'Lướt nước', coordination: 'Phối hợp',
    turn: 'Quay đầu hồ', endurance: 'Sức bền', flutter_kick: 'Đập chân',
    entry: 'Vào tay', high_elbow_catch: 'High Elbow Catch', arm_recovery: 'Phục hồi tay',
    side_breathing: 'Thở nghiêng', bilateral_breathing: 'Thở 2 bên',
    endurance_speed: 'Sức bền & tốc độ', undulation: 'Sóng người',
    dolphin_kick: 'Đạp chân cá heo', pull: 'Kéo nước', rhythm: 'Nhịp điệu',
    body_rotation: 'Xoay hông', rotation: 'Xoay người',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-[#1C2B4A]">Thống kê giảng dạy</h1>
        <p className="text-sm text-[#1C2B4A]/50 mt-1">Tổng quan hoạt động của lớp</p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tổng buổi đã dạy', value: totalSessions, color: 'text-[#1C2B4A]' },
          { label: 'TB học viên/buổi', value: avgAttendance, color: 'text-[#5B8E9F]' },
          { label: 'Tỷ lệ giữ chân', value: `${retentionRate}%`, color: retentionRate >= 70 ? 'text-green-600' : 'text-amber-600' },
          { label: 'Đã tốt nghiệp', value: completedStudents, color: 'text-[#C8A84B]' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#1C2B4A]/8 shadow-sm">
            <p className="text-xs text-[#1C2B4A]/40 uppercase tracking-wider mb-2">{s.label}</p>
            <p className={`font-heading text-3xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Student breakdown */}
        <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 shadow-sm p-5">
          <h2 className="font-semibold text-[#1C2B4A] text-sm mb-4">Phân bố học viên</h2>
          <div className="space-y-3">
            {[
              { label: 'Đang học', value: activeStudents, total: totalStudents, color: 'bg-[#5B8E9F]' },
              { label: 'Đã tốt nghiệp', value: completedStudents, total: totalStudents, color: 'bg-[#C8A84B]' },
              { label: 'Tổng enrolled', value: retentionData, total: totalStudents, color: 'bg-[#1C2B4A]/30' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#1C2B4A]/70">{item.label}</span>
                  <span className="font-medium text-[#1C2B4A]">{item.value}</span>
                </div>
                <div className="h-1.5 bg-[#1C2B4A]/8 rounded-full">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weakest skills */}
        <div className="bg-white rounded-2xl border border-[#1C2B4A]/8 shadow-sm p-5">
          <h2 className="font-semibold text-[#1C2B4A] text-sm mb-4">
            Kỹ năng yếu nhất toàn lớp
          </h2>
          {weakSkillsData.length === 0 ? (
            <p className="text-sm text-[#1C2B4A]/40">Chưa có dữ liệu đánh giá</p>
          ) : (
            <div className="space-y-3">
              {weakSkillsData.map((sk, i) => {
                const avg = sk._avg.score ?? 0
                return (
                  <div key={sk.skillKey}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#1C2B4A]/70">
                        {SKILL_NAMES[sk.skillKey] ?? sk.skillKey}
                      </span>
                      <span className={`font-medium ${avg <= 2.5 ? 'text-red-500' : 'text-amber-600'}`}>
                        {avg.toFixed(1)}/5
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#1C2B4A]/8 rounded-full">
                      <div
                        className={`h-full rounded-full ${avg <= 2.5 ? 'bg-red-400' : 'bg-amber-400'}`}
                        style={{ width: `${(avg / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Revenue this month */}
      <div className="bg-[#1C2B4A] rounded-2xl p-5">
        <p className="text-[#F6F1EA]/50 text-xs uppercase tracking-wider mb-1">Thu tháng {format(now, 'MM/yyyy')}</p>
        <p className="font-heading text-3xl text-[#C8A84B]">
          {fmt(monthPayments._sum.amount ?? 0)}
        </p>
        <div className="mt-3 flex gap-6 text-sm text-[#F6F1EA]/60">
          <div>
            <span className="text-[#F6F1EA]">{totalStudents}</span> tổng HV
          </div>
          <div>
            <span className="text-[#F6F1EA]">{activeStudents}</span> đang học
          </div>
          <div>
            <span className="text-[#F6F1EA]">{totalSessions}</span> buổi đã dạy
          </div>
        </div>
      </div>
    </div>
  )
}
