import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes không cần đăng nhập
const PUBLIC_ROUTES = ['/', '/login', '/register', '/courses', '/blog', '/faq', '/privacy', '/unauthorized']
const AUTH_ROUTES = ['/login', '/register']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
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

  // Nếu đã đăng nhập mà vào trang login → redirect về dashboard
  if (user && AUTH_ROUTES.some(r => path.startsWith(r))) {
    // Lấy role từ DB để redirect đúng
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'student'
    const dashboardPath = role === 'admin'
      ? '/admin/dashboard'
      : role === 'staff'
        ? '/staff/dashboard'
        : '/student/dashboard'

    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  // Nếu chưa đăng nhập mà vào route protected → redirect login
  const isPublic = PUBLIC_ROUTES.some(r => path === r || path.startsWith('/blog') || path.startsWith('/courses'))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
