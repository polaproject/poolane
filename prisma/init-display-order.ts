/**
 * One-off: gán displayOrder ASC theo createdAt cho mọi product (legacy data).
 * Sau commit này, displayOrder = 0 default. Chạy 1 lần để có thứ tự khởi tạo.
 *
 *   npx dotenv -e .env.local -- npx tsx prisma/init-display-order.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter, log: ['error'] })

async function main() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  console.log(`Found ${products.length} products. Initializing displayOrder...`)
  for (let i = 0; i < products.length; i++) {
    await prisma.product.update({
      where: { id: products[i].id },
      data: { displayOrder: (i + 1) * 10 },  // bước 10 để chèn dễ
    })
  }
  console.log(`Done. ${products.length} products updated với displayOrder 10, 20, 30, ...`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
