import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { logError } from '@/lib/logger'
import { runWidget } from '@/lib/dashboard/query-builder'
import { checkWidgetSafety } from '@/lib/dashboard/safety'
import type { WidgetConfig, TimeRange } from '@/lib/dashboard/types'

/**
 * POST /api/admin/dashboards/query
 *
 * Body: { config: WidgetConfig, timeRange?: TimeRange }
 *
 * Execute widget query (real-time) và trả về pivot result.
 * Cũng dùng cho live-preview trong builder.
 */
const bodySchema = z.object({
  config: z.unknown(),
  timeRange: z.unknown().optional(),
})

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin'])
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_INPUT', message: 'Body không hợp lệ' } },
        { status: 400 }
      )
    }

    const config = parsed.data.config as WidgetConfig
    const timeRange = parsed.data.timeRange as TimeRange | undefined

    // Safety check
    const safety = checkWidgetSafety(config)
    if (!safety.ok) {
      return NextResponse.json(
        { data: null, error: { code: 'CONFIG_UNSAFE', message: safety.errors.join('; '), details: { warnings: safety.warnings } } },
        { status: 400 }
      )
    }

    const result = await runWidget(config, timeRange)

    return NextResponse.json({
      data: {
        rows: result.rows,
        columns: result.columns,
        cells: result.cells,
        rowCount: result.rowCount,
        executionTimeMs: result.executionTimeMs,
        truncated: result.truncated,
        warnings: safety.warnings,
      },
      error: null,
    })
  } catch (error) {
    await logError({ context: 'dashboards.query', message: 'Failed', error })
    const msg = error instanceof Error ? error.message : 'Có lỗi'
    // Phát hiện statement timeout
    const isTimeout = /statement_timeout|canceling statement/i.test(msg)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: isTimeout ? 'QUERY_TIMEOUT' : 'INTERNAL_ERROR',
          message: isTimeout ? 'Query quá 10 giây và bị huỷ. Hãy thu hẹp time range hoặc giảm join.' : 'Có lỗi khi chạy query',
        },
      },
      { status: isTimeout ? 408 : 500 }
    )
  }
}
