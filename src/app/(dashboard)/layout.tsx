import { requireAuth } from '@/lib/auth'

// Layout cho toàn bộ dashboard — protected route
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Bảo vệ tất cả route trong (dashboard)
  await requireAuth()

  return (
    <div className="min-h-screen bg-[#F6F1EA]">
      {children}
    </div>
  )
}
