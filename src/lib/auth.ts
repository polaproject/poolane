import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { log } from '@/lib/logger'

export type UserRole = 'admin' | 'staff' | 'student'

export interface AuthUser {
  id: string
  email: string
  phone: string | null
  role: UserRole
  fullName: string
}

// Lấy user hiện tại — trả về null nếu chưa đăng nhập
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) return null

    // Lấy role và thông tin từ public.users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, full_name, phone')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      log.warn('auth.getCurrentUser', 'Profile not found', { userId: user.id })
      return null
    }

    return {
      id: user.id,
      email: user.email ?? '',
      phone: profile.phone,
      role: profile.role as UserRole,
      fullName: profile.full_name,
    }
  } catch (error) {
    log.error('auth.getCurrentUser', 'Failed to get current user', error)
    return null
  }
}

// Yêu cầu đăng nhập — redirect nếu chưa có session
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

// Yêu cầu role cụ thể — trả về 403 nếu không đủ quyền
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<AuthUser> {
  const user = await requireAuth()

  if (!allowedRoles.includes(user.role)) {
    log.warn('auth.requireRole', 'Unauthorized access attempt', {
      userId: user.id,
      userRole: user.role,
      requiredRoles: allowedRoles,
    })
    redirect('/unauthorized')
  }

  return user
}

// Redirect sau khi đăng nhập theo role
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'staff':
      return '/staff/dashboard'
    case 'student':
      return '/student/dashboard'
    default:
      return '/login'
  }
}

// Format tên hiển thị
export function getDisplayName(user: AuthUser): string {
  return user.fullName || user.email || user.phone || 'Unknown'
}
