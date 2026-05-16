import { prisma } from './prisma'

let cache: { value: { hoursAvg: number; sampleSize: number }; expiresAt: number } | null = null

/**
 * Tính trung bình thời gian từ lúc HV đăng ký đến khi staff quyết định.
 * Sample 100 reg đã decided gần nhất, cache trong RAM 1h.
 *
 * Trả `sampleSize: 0` khi DB chưa có data → UI ẩn badge (fallback handled at render).
 */
export async function getAverageApprovalHours(): Promise<{ hoursAvg: number; sampleSize: number }> {
  if (cache && cache.expiresAt > Date.now()) return cache.value

  const recent = await prisma.sessionRegistration.findMany({
    where: { decidedAt: { not: null }, status: { in: ['approved', 'rejected'] } },
    select: { registeredAt: true, decidedAt: true },
    orderBy: { decidedAt: 'desc' },
    take: 100,
  })

  if (recent.length === 0) {
    const value = { hoursAvg: 0, sampleSize: 0 }
    cache = { value, expiresAt: Date.now() + 3600_000 }
    return value
  }

  const hours = recent.map(r => (r.decidedAt!.getTime() - r.registeredAt.getTime()) / 3_600_000)
  const hoursAvg = hours.reduce((a, b) => a + b, 0) / hours.length
  const value = {
    hoursAvg: Math.round(hoursAvg * 10) / 10,
    sampleSize: recent.length,
  }
  cache = { value, expiresAt: Date.now() + 3600_000 }
  return value
}
