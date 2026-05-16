import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  isHome: z.boolean().optional(),
  layout: z.array(z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  })).optional(),
  slicers: z.array(z.unknown()).optional(),
  timeRange: z.unknown().optional(),
})

interface RouteCtx { params: Promise<{ id: string }> }

// ─── GET /api/admin/dashboards/[id] — full dashboard + widgets ───
export async function GET(_request: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireRole(['admin'])
    const { id } = await ctx.params
    const dashboard = await prisma.dashboard.findUnique({
      where: { id },
      include: { widgets: { orderBy: { createdAt: 'asc' } } },
    })
    if (!dashboard) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Dashboard không tồn tại' } }, { status: 404 })
    }
    if (dashboard.ownerId !== user.id) {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Không có quyền truy cập' } }, { status: 403 })
    }
    return NextResponse.json({ data: dashboard, error: null })
  } catch (error) {
    await logError({ context: 'dashboards.get', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi' } }, { status: 500 })
  }
}

// ─── PATCH /api/admin/dashboards/[id] — update dashboard meta ───
export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireRole(['admin'])
    const { id } = await ctx.params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'INVALID_INPUT', message: 'Tham số không hợp lệ' } }, { status: 400 })
    }

    const existing = await prisma.dashboard.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tồn tại' } }, { status: 404 })
    }
    if (existing.ownerId !== user.id) {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Không có quyền' } }, { status: 403 })
    }

    // Nếu set isHome=true, unset isHome cho dashboards khác cùng owner
    if (parsed.data.isHome === true) {
      await prisma.dashboard.updateMany({
        where: { ownerId: user.id, NOT: { id }, isHome: true },
        data: { isHome: false },
      })
    }

    const data: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) data.name = parsed.data.name
    if (parsed.data.description !== undefined) data.description = parsed.data.description
    if (parsed.data.isHome !== undefined) data.isHome = parsed.data.isHome
    if (parsed.data.layout !== undefined) data.layout = parsed.data.layout
    if (parsed.data.slicers !== undefined) data.slicers = parsed.data.slicers
    if (parsed.data.timeRange !== undefined) data.timeRange = parsed.data.timeRange

    const updated = await prisma.dashboard.update({ where: { id }, data })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'dashboard.update',
        entityType: 'dashboard',
        entityId: id,
        beforeData: { name: existing.name, isHome: existing.isHome },
        afterData: { keys: Object.keys(parsed.data) },
      },
    })

    return NextResponse.json({ data: updated, error: null })
  } catch (error) {
    await logError({ context: 'dashboards.update', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi' } }, { status: 500 })
  }
}

// ─── DELETE /api/admin/dashboards/[id] ───
export async function DELETE(_request: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireRole(['admin'])
    const { id } = await ctx.params
    const existing = await prisma.dashboard.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tồn tại' } }, { status: 404 })
    }
    if (existing.ownerId !== user.id) {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Không có quyền' } }, { status: 403 })
    }

    await prisma.dashboard.delete({ where: { id } })
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'dashboard.delete',
        entityType: 'dashboard',
        entityId: id,
        beforeData: { name: existing.name },
        afterData: {},
      },
    })
    return NextResponse.json({ data: { deleted: true }, error: null })
  } catch (error) {
    await logError({ context: 'dashboards.delete', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi' } }, { status: 500 })
  }
}
