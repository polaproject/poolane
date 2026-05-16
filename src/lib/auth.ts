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
  avatarUrl: string | null
}

// Lấy user hiện tại từ JWT + DB (fallback to JWT nếu DB fail)
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) return null

    // Lấy role từ JWT user_metadata (reliable, không cần DB query)
    const jwtRole = (user.user_metadata?.role as UserRole) ?? 'student'
    const jwtFullName = (user.user_metadata?.full_name as string) ?? user.email ?? ''

    // Try DB for richer data (phone, etc.) — fallback OK if fails
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('role, full_name, phone, avatar_url')
        .eq('id', user.id)
        .single()

      if (profile) {
        return {
          id: user.id,
          email: user.email ?? '',
          phone: profile.phone,
          role: (profile.role ?? jwtRole) as UserRole,
          fullName: profile.full_name ?? jwtFullName,
          avatarUrl: profile.avatar_url ?? null,
        }
      }
    } catch {
      // DB query failed — dùng JWT metadata
      log.warn('auth.getCurrentUser', 'DB query failed, using JWT metadata', { userId: user.id })
    }

    // Fallback: dùng JWT metadata
    return {
      id: user.id,
      email: user.email ?? '',
      phone: null,
      role: jwtRole,
      fullName: jwtFullName,
      avatarUrl: null,
    }

  } catch (error) {
    log.error('auth.getCurrentUser', 'Failed to get current user', error)
    return null
  }
}

// Yêu cầu đăng nhập
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

// Yêu cầu role cụ thể
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthUser> {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    log.warn('auth.requireRole', 'Unauthorized', {
      userId: user.id,
      userRole: user.role,
      requiredRoles: allowedRoles,
    })
    redirect('/unauthorized')
  }
  return user
}

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':   return '/admin/dashboard'
    case 'staff':   return '/staff/dashboard'
    case 'student': return '/student/dashboard'
    default:        return '/login'
  }
}

export function getDisplayName(user: AuthUser): string {
  return user.fullName || user.email || user.phone || 'Unknown'
}
