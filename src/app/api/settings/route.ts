import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { logError } from '@/lib/logger'
import { getAllSettings } from '@/lib/settings'

// ─── GET /api/settings — public read (cho client component consume) ───
// Tất cả role login được đọc. Không expose admin-only fields nếu có.
export async function GET() {
  try {
    await requireAuth()
    const settings = await getAllSettings()
    // Chỉ trả các key cần thiết cho client UI (FAB, NotificationFab)
    return NextResponse.json({
      data: {
        quick_add: {
          admin: settings['quick_add.admin'],
          staff: settings['quick_add.staff'],
          student: settings['quick_add.student'],
        },
        notif_filter: {
          types: settings['notif_filter.types'],
        },
      },
      error: null,
    })
  } catch (error) {
    await logError({ context: 'settings.public', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi' } },
      { status: 500 }
    )
  }
}
