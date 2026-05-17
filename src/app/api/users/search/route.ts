import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

const querySchema = z.object({
  q: z.string().max(60).optional().default(''),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
})

// ─── GET /api/users/search ───────────────────────────────
// Search users by fullName/phone — open access (any logged-in user).
// Used by UserPicker khi tạo conversation mới.
//
// Limitation: Postgres `contains mode: 'insensitive'` chỉ case-insensitive,
// không accent-insensitive. Gõ "viet" KHÔNG match "Việt". Punt sang Phase 20.1.
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff', 'student'])

    const parsed = querySchema.safeParse({
      q: request.nextUrl.searchParams.get('q') ?? '',
      limit: request.nextUrl.searchParams.get('limit') ?? 20,
    })
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Tham số không hợp lệ' } },
        { status: 400 },
      )
    }

    const { q, limit } = parsed.data

    // Empty query → empty results (tránh load all 200 users)
    if (q.trim().length < 1) {
      return NextResponse.json({ data: { items: [] }, error: null })
    }

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: user.id }, // exclude self
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
        ],
      },
      select: { id: true, fullName: true, role: true, avatarUrl: true },
      take: limit,
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    })

    return NextResponse.json({ data: { items: users }, error: null })
  } catch (error) {
    await logError({ context: 'users.search', message: 'Failed to search users', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } },
      { status: 500 },
    )
  }
}
