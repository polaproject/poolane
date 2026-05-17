import { requireAuth } from '@/lib/auth'
import { DashboardShell } from '@/components/layouts/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  const initial = user.fullName
    ? user.fullName.split(' ').pop()?.charAt(0)?.toUpperCase() ?? 'U'
    : 'U'

  return (
    <DashboardShell
      userId={user.id}
      userRole={user.role}
      userFullName={user.fullName}
      userInitial={initial}
      userAvatarUrl={user.avatarUrl}
    >
      {children}
    </DashboardShell>
  )
}
