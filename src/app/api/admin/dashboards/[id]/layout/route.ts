import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError, log } from '@/lib/logger'

type Params = { params: Promise<{ id: string }> }

const layoutItemSchema = z.object({
  id: z.string().uuid(),
  x: z.number().int().min(0).max(12),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(12),
  h: z.number().int().min(1).max(20),
})
const bodySchema = z.object({
  items: z.array(layoutItemSchema).max(50),
})

/**
 * PATCH /api/admin/dashboards/[id]/layout
 * Batch update widget positions sau khi user drag/resize trên canvas.
 * Body: { items: [{ id, x, y, w, h }] } — chỉ widget thay đổi vị trí
 * Atomic qua transaction. Audit log 1 entry tổng hợp.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin'])
    const { id: dashboardId } = await params

    // Verify dashboard ownership
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
      select: { id: true, ownerId: true },
    })
    if (!dashboard) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy dashboard' } },
        { status: 404 }
      )
    }
    if (dashboard.ownerId !== user.id) {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Không có quyền' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_INPUT', message: 'Layout không hợp lệ' } },
        { status: 400 }
      )
    }

    // Verify all widgets belong to this dashboard (tránh inject id widget khác)
    const widgetIds = parsed.data.items.map(i => i.id)
    const validCount = await prisma.widget.count({
      where: { id: { in: widgetIds }, dashboardId },
    })
    if (validCount !== widgetIds.length) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_WIDGET', message: 'Có widget không thuộc dashboard này' } },
        { status: 400 }
      )
    }

    await prisma.$transaction(
      parsed.data.items.map(item =>
        prisma.widget.update({
          where: { id: item.id },
          data: { position: { x: item.x, y: item.y, w: item.w, h: item.h } },
        })
      )
    )

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'dashboard.layout.update',
        entityType: 'dashboard',
        entityId: dashboardId,
        beforeData: {},
        afterData: { itemCount: parsed.data.items.length },
      },
    })
    log.info('dashboards.layout', `Updated ${parsed.data.items.length} positions`, {
      dashboardId, userId: user.id,
    })

    return NextResponse.json({ data: { updated: parsed.data.items.length }, error: null })
  } catch (error) {
    await logError({ context: 'dashboards.layout', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi' } },
      { status: 500 }
    )
  }
}
