import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

const updateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  type: z.enum(['pivot', 'chart', 'heatmap', 'kpi']).optional(),
  config: z.unknown().optional(),
  position: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    w: z.number().int().min(1).max(12),
    h: z.number().int().min(1).max(20),
  }).optional(),
})

interface RouteCtx { params: Promise<{ id: string; wid: string }> }

async function loadAndAuth(dashboardId: string, widgetId: string, userId: string) {
  const widget = await prisma.dashboardWidget.findUnique({
    where: { id: widgetId },
    include: { dashboard: true },
  })
  if (!widget) return { error: 'NOT_FOUND' as const }
  if (widget.dashboardId !== dashboardId) return { error: 'NOT_FOUND' as const }
  if (widget.dashboard.ownerId !== userId) return { error: 'FORBIDDEN' as const }
  return { widget }
}

// ─── PATCH widget ───
export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireRole(['admin'])
    const { id, wid } = await ctx.params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'INVALID_INPUT', message: 'Tham số không hợp lệ' } }, { status: 400 })
    }

    const auth = await loadAndAuth(id, wid, user.id)
    if (auth.error === 'NOT_FOUND') return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tồn tại' } }, { status: 404 })
    if (auth.error === 'FORBIDDEN') return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Không có quyền' } }, { status: 403 })

    const data: Record<string, unknown> = {}
    if (parsed.data.title !== undefined) data.title = parsed.data.title
    if (parsed.data.type !== undefined) data.type = parsed.data.type
    if (parsed.data.config !== undefined) data.config = parsed.data.config as object
    if (parsed.data.position !== undefined) data.position = parsed.data.position

    const updated = await prisma.dashboardWidget.update({ where: { id: wid }, data })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'dashboard_widget.update',
        entityType: 'dashboard_widget',
        entityId: wid,
        beforeData: {},
        afterData: { keys: Object.keys(parsed.data) },
      },
    })

    return NextResponse.json({ data: updated, error: null })
  } catch (error) {
    await logError({ context: 'widgets.update', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi' } }, { status: 500 })
  }
}

// ─── DELETE widget ───
export async function DELETE(_request: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireRole(['admin'])
    const { id, wid } = await ctx.params
    const auth = await loadAndAuth(id, wid, user.id)
    if (auth.error === 'NOT_FOUND') return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tồn tại' } }, { status: 404 })
    if (auth.error === 'FORBIDDEN') return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Không có quyền' } }, { status: 403 })

    await prisma.dashboardWidget.delete({ where: { id: wid } })
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'dashboard_widget.delete',
        entityType: 'dashboard_widget',
        entityId: wid,
        beforeData: { title: auth.widget?.title ?? '' },
        afterData: {},
      },
    })
    return NextResponse.json({ data: { deleted: true }, error: null })
  } catch (error) {
    await logError({ context: 'widgets.delete', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi' } }, { status: 500 })
  }
}
