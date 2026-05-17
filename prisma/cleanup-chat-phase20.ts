/**
 * Phase 20 — wipe legacy 1-staff-1-student conversations + chat_messages
 * trước khi đổi schema sang participants-based.
 *
 * Usage: npx dotenv -e .env.local -- npx tsx prisma/cleanup-chat-phase20.ts
 *
 * DO NOT REUSE AFTER PHASE 20. One-shot script.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter, log: ['error', 'warn'] })

async function main() {
  console.log('[cleanup-chat-phase20] Start')

  // Xóa notifications liên quan chat (metadata.chatMessage=true)
  // Tránh frontend link tới dead conv ids sau khi xóa
  const notif = await prisma.notification.deleteMany({
    where: { metadata: { path: ['chatMessage'], equals: true } },
  })
  console.log(`[cleanup] Deleted ${notif.count} chat-related notifications`)

  // FK order: chat_messages → conversations
  const msg = await prisma.chatMessage.deleteMany({})
  console.log(`[cleanup] Deleted ${msg.count} chat_messages`)

  const conv = await prisma.conversation.deleteMany({})
  console.log(`[cleanup] Deleted ${conv.count} conversations`)

  console.log('[cleanup-chat-phase20] Done — ready for schema migration')
}

main()
  .catch(e => {
    console.error('[cleanup-chat-phase20] FAILED', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
