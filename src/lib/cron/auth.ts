import { NextRequest } from 'next/server'

/**
 * Verify cron request — chỉ Vercel cron với CRON_SECRET hoặc internal call
 */
export function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // Trong dev không có secret → cho phép để test thủ công
    return process.env.NODE_ENV !== 'production'
  }
  const header = request.headers.get('authorization') ?? ''
  return header === `Bearer ${secret}`
}
