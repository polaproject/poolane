import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { logError } from '@/lib/logger'
import { SCHEMA_REGISTRY } from '@/lib/dashboard/schema-registry'

/**
 * GET /api/admin/dashboards/schema
 *
 * Trả về toàn bộ schema registry + data dictionary cho field picker.
 * Client cache 5 phút (data tĩnh, chỉ đổi khi deploy).
 */
export async function GET() {
  try {
    await requireRole(['admin'])
    return NextResponse.json(
      { data: SCHEMA_REGISTRY, error: null },
      { headers: { 'Cache-Control': 'private, max-age=300' } },
    )
  } catch (error) {
    await logError({ context: 'dashboards.schema', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi' } },
      { status: 500 }
    )
  }
}
