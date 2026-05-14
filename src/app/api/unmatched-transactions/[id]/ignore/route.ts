import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const { id } = await params

    const tx = await prisma.unmatchedTransaction.findUnique({ where: { id } })
    if (!tx) return NextResponse.json({ data: null, error: { code: 'NOT_FOUND' } }, { status: 404 })
    if (tx.status !== 'pending') {
      return NextResponse.json({ data: null, error: { code: 'ALREADY_PROCESSED' } }, { status: 409 })
    }

    await prisma.unmatchedTransaction.update({
      where: { id },
      data: { status: 'ignored', matchedAt: new Date(), matchedBy: user.id }
    })

    return NextResponse.json({ data: { id }, error: null })
  } catch (error) {
    await logError({ context: 'unmatched.ignore', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR' } }, { status: 500 })
  }
}
