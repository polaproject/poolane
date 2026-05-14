import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'staff'])
    const status = request.nextUrl.searchParams.get('status') ?? 'pending'

    const items = await prisma.unmatchedTransaction.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ data: items, error: null })
  } catch (error) {
    await logError({ context: 'unmatched.list', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
