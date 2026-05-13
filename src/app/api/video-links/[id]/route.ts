import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireRole(['admin', 'staff'])
    const { id } = await params
    await prisma.videoLink.delete({ where: { id } })
    return NextResponse.json({ data: { id }, error: null })
  } catch (error) {
    await logError({ context: 'videos.delete', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
