import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/', '/login', '/register', '/courses', '/blog', '/faq',
  '/privacy', '/unauthorized', '/api/health', '/api/auth',
  '/student/achievement',
  '/sandbox', // Phase 29 — design review accessible to owner without login
]
const AUTH_ROUTES = ['/login', '/register']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Đã đăng nhập mà vào login → redirect về dashboard đúng role
  if (user && AUTH_ROUTES.some(r => path.startsWith(r))) {
    // Dùng user_metadata.role (từ JWT) để tránh DB query ở Edge Runtime
    // user_metadata được set khi tạo user qua admin API (seed.ts)
    const role = (user.user_metadata?.role as string) ?? 'student'
    const dashboardPath = role === 'admin'
      ? '/admin/dashboard'
      : role === 'staff'
        ? '/staff/dashboard'
        : '/student/dashboard'

    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  const isPublic = PUBLIC_ROUTES.some(r =>
    path === r ||
    path.startsWith('/blog') ||
    path.startsWith('/courses') ||
    path.startsWith('/api/health') ||
    path.startsWith('/api/auth') ||
    path.startsWith('/student/achievement') ||
    path.startsWith('/sandbox')
  )

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)',
  ],
}
