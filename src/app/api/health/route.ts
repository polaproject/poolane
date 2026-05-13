import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Health check endpoint — Vercel monitor ping
export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {
    database: 'error',
    auth: 'error',
  }

  try {
    const supabase = await createClient()

    // Check auth
    const { error: authError } = await supabase.auth.getSession()
    checks.auth = authError ? 'error' : 'ok'

    // Check database
    const { error: dbError } = await supabase.from('users').select('id').limit(1)
    checks.database = dbError ? 'error' : 'ok'
  } catch {
    // checks remain 'error'
  }

  const allOk = Object.values(checks).every(v => v === 'ok')

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
    },
    { status: allOk ? 200 : 503 }
  )
}
