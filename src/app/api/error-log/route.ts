import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Best-effort error logging endpoint từ client error boundary
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const user = await getCurrentUser()

    await prisma.errorLog.create({
      data: {
        context: 'client.error_boundary',
        userId: user?.id ?? null,
        errorMessage: String(body.message ?? 'Unknown'),
        stackTrace: body.stack ?? null,
        inputData: { url: body.url, digest: body.digest } as never,
        severity: 'error',
      }
    })

    return NextResponse.json({ data: { logged: true }, error: null })
  } catch {
    // Don't fail — error logging shouldn't error
    return NextResponse.json({ data: { logged: false }, error: null })
  }
}
