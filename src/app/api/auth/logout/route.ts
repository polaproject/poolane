import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const response = NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
    { status: 302 }
  )

  // Xoá tất cả Supabase auth cookies
  const cookieNames = ['sb-access-token', 'sb-refresh-token']
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')?.[0]?.split('//')?.pop() ?? ''

  cookieNames.forEach(name => {
    response.cookies.delete(name)
    response.cookies.delete(`sb-${projectRef}-auth-token`)
    response.cookies.delete(`sb-${projectRef}-auth-token.0`)
    response.cookies.delete(`sb-${projectRef}-auth-token.1`)
  })

  return response
}

export async function POST() {
  return GET()
}
