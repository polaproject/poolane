import { redirect } from 'next/navigation'
import { getCurrentUser, getDashboardPath } from '@/lib/auth'

// Trang gốc: redirect về dashboard hoặc login
export default async function RootPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect(getDashboardPath(user.role))
  }

  redirect('/login')
}
