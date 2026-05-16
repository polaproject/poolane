import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

const MAX_DASHBOARDS_PER_USER = 10

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
})

// ─── GET /api/admin/dashboards — list owner's dashboards ───
export async function GET() {
  try {
    const user = await requireRole(['admin'])
    const dashboards = await prisma.dashboard.findMany({
      where: { ownerId: user.id },
      orderBy: [{ isHome: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true, name: true, description: true, isHome: true,
        createdAt: true, updatedAt: true,
        _count: { select: { widgets: true } },
      },
    })
    return NextResponse.json({ data: dashboards, error: null })
  } catch (error) {
    await logError({ context: 'dashboards.list', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi' } },
      { status: 500 }
    )
  }
}

// ─── POST /api/admin/dashboards — create new ───
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin'])
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_INPUT', message: 'Tham số không hợp lệ' } },
        { status: 400 }
      )
    }

    // Quota check
    const count = await prisma.dashboard.count({ where: { ownerId: user.id } })
    if (count >= MAX_DASHBOARDS_PER_USER) {
      return NextResponse.json(
        { data: null, error: { code: 'QUOTA_EXCEEDED', message: `Đã đạt giới hạn ${MAX_DASHBOARDS_PER_USER} dashboard. Xoá bớt để tạo mới.` } },
        { status: 400 }
      )
    }

    const dashboard = await prisma.dashboard.create({
      data: {
        ownerId: user.id,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        layout: [],
        slicers: [],
        timeRange: { preset: '30d' },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'dashboard.create',
        entityType: 'dashboard',
        entityId: dashboard.id,
        beforeData: {},
        afterData: { name: dashboard.name },
      },
    })

    return NextResponse.json({ data: dashboard, error: null })
  } catch (error) {
    await logError({ context: 'dashboards.create', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi' } },
      { status: 500 }
    )
  }
}
