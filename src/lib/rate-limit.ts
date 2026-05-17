import { prisma } from '@/lib/prisma'

const CHAT_WINDOW_SEC = 10
const CHAT_MAX_PER_WINDOW = 5
const EXEMPT_ROLES = new Set(['admin', 'staff'])

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number }

/**
 * Chat rate limit — 5 msg/10s per student. Admin/staff exempt (giáo viên cần
 * communicate tự do với HV).
 *
 * Sliding window: query latest ChatMessage rows từ user trong 10s qua. Nếu
 * >= 5 → tính retryAfter = earliest.createdAt + 10s - now.
 *
 * No Redis needed. Index `ChatMessage @@index([senderId])` đủ nhanh ở scale
 * 200 HV (~5-15ms per send).
 */
export async function checkChatRateLimit(
  userId: string,
  userRole: string,
): Promise<RateLimitResult> {
  if (EXEMPT_ROLES.has(userRole)) return { allowed: true }

  const windowStart = new Date(Date.now() - CHAT_WINDOW_SEC * 1000)
  const recent = await prisma.chatMessage.findMany({
    where: { senderId: userId, createdAt: { gte: windowStart } },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
    take: CHAT_MAX_PER_WINDOW + 1,
  })

  if (recent.length < CHAT_MAX_PER_WINDOW) return { allowed: true }

  const earliest = recent[0].createdAt
  const expiresAt = earliest.getTime() + CHAT_WINDOW_SEC * 1000
  const retryAfterSec = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000))
  return { allowed: false, retryAfterSec }
}
