import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Health check endpoint — Vercel monitor ping
// Trả 200 nếu all checks pass, 503 nếu degraded
export async function GET() {
  const checks: Record<string, 'ok' | 'error' | 'skipped'> = {
    database: 'error',
    auth: 'error',
    storage: 'skipped',
    email: 'skipped',
  }

  try {
    const supabase = await createClient()

    // 1. Auth
    const { error: authError } = await supabase.auth.getSession()
    checks.auth = authError ? 'error' : 'ok'

    // 2. Database
    const { error: dbError } = await supabase.from('users').select('id').limit(1)
    checks.database = dbError ? 'error' : 'ok'

    // 3. Storage (chỉ check khi env có flag — list root để verify bucket access)
    try {
      const { error: storageError } = await supabase.storage
        .from('poolane-public')
        .list('', { limit: 1 })
      checks.storage = storageError ? 'error' : 'ok'
    } catch {
      checks.storage = 'error'
    }

    // 4. Email (chỉ verify API key valid bằng request domains list — không gửi email thật)
    if (process.env.RESEND_API_KEY) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000)
        const response = await fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          signal: controller.signal,
        })
        clearTimeout(timeout)
        checks.email = response.ok ? 'ok' : 'error'
      } catch {
        checks.email = 'error'
      }
    }
  } catch {
    // checks remain 'error'
  }

  // Chỉ check 'ok'/'error' — bỏ qua 'skipped'
  const critical = ['database', 'auth']
  const allCriticalOk = critical.every(k => checks[k] === 'ok')

  return NextResponse.json(
    {
      status: allCriticalOk ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
    },
    { status: allCriticalOk ? 200 : 503 }
  )
}
