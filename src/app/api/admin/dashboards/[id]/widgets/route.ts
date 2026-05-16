import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

const createWidgetSchema = z.object({
  title: z.string().min(1).max(100),
  type: z.enum(['pivot', 'chart', 'heatmap', 'kpi']),
  config: z.unknown(),
  position: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    w: z.number().int().min(1).max(12),
    h: z.number().int().min(1).max(20),
  }).optional(),
})

interface RouteCtx { params: Promise<{ id: string }> }

// ─── POST /api/admin/dashboards/[id]/widgets — add widget ───
export async function POST(request: NextRequest, ctx: RouteCtx) {
  try {
    const user = await requireRole(['admin'])
    const { id } = await ctx.params
    const body = await request.json()
    const parsed = createWidgetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'INVALID_INPUT', message: 'Tham số không hợp lệ' } }, { status: 400 })
    }

    const dashboard = await prisma.dashboard.findUnique({ where: { id } })
    if (!dashboard) {
      return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Dashboard không tồn tại' } }, { status: 404 })
    }
    if (dashboard.ownerId !== user.id) {
      return NextResponse.json({ data: null, error: { code: 'FORBIDDEN', message: 'Không có quyền' } }, { status: 403 })
    }

    const widget = await prisma.dashboardWidget.create({
      data: {
        dashboardId: id,
        title: parsed.data.title,
        type: parsed.data.type,
        config: parsed.data.config as object,
        position: parsed.data.position ?? { x: 0, y: 0, w: 6, h: 4 },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'dashboard_widget.create',
        entityType: 'dashboard_widget',
        entityId: widget.id,
        beforeData: {},
        afterData: { title: widget.title, type: widget.type },
      },
    })

    return NextResponse.json({ data: widget, error: null })
  } catch (error) {
    await logError({ context: 'widgets.create', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi' } }, { status: 500 })
  }
}
