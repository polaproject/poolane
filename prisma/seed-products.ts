/**
 * Idempotent seed cho Shop products.
 * Chạy: npx tsx prisma/seed-products.ts
 *
 * Có thể chạy nhiều lần — upsert theo SKU.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter, log: ['error'] })

async function main() {
  console.log('🛒 Seeding shop products...\n')

  // Lấy course IDs để link
  const courses = await prisma.course.findMany({ select: { id: true, code: true } })
  const courseByCode = Object.fromEntries(courses.map(c => [c.code, c.id]))

  if (!courseByCode.ECH || !courseByCode.SAI || !courseByCode.BUOM) {
    console.error('❌ Courses ECH/SAI/BUOM chưa có trong DB. Chạy npm run seed trước.')
    process.exit(1)
  }

  const products = [
    // Nhóm 1: Khoá học
    { sku: 'COURSE-ECH', name: 'Khoá Bơi Ếch (10 buổi)', type: 'course' as const, price: 1_600_000, linkedCourseId: courseByCode.ECH, description: 'Khoá học bơi Ếch chuẩn 10 buổi cho người mới' },
    { sku: 'COURSE-SAI', name: 'Khoá Bơi Sải (10 buổi)', type: 'course' as const, price: 2_100_000, linkedCourseId: courseByCode.SAI, description: 'Khoá học bơi Sải chuẩn 10 buổi' },
    { sku: 'COURSE-BUOM', name: 'Khoá Bơi Bướm (10 buổi)', type: 'course' as const, price: 3_500_000, linkedCourseId: courseByCode.BUOM, description: 'Khoá học bơi Bướm chuẩn 10 buổi (nâng cao)' },

    // Nhóm 2: Pack cải thiện
    { sku: 'IMPROVE-5', name: 'Pack 5 buổi cải thiện kỹ năng', type: 'improvement_pack' as const, price: 750_000, sessionsCount: 5, description: '5 buổi bơi lẻ tập trung cải thiện kỹ năng yếu' },
    { sku: 'IMPROVE-10', name: 'Pack 10 buổi cải thiện kỹ năng', type: 'improvement_pack' as const, price: 1_400_000, sessionsCount: 10, description: '10 buổi bơi lẻ tập trung cải thiện kỹ năng yếu' },

    // Nhóm 3: Dịch vụ
    { sku: 'SVC-VIDEO', name: 'Phân tích kỹ thuật qua video', type: 'service' as const, price: 200_000, description: 'Quay + phân tích kỹ thuật bơi của bạn (1 buổi)' },

    // Nhóm 4: Đồ vật lý
    { sku: 'KINH-BOI-01', name: 'Kính bơi Aqua Pro', type: 'physical' as const, price: 150_000, cost: 80_000, stockQuantity: 20, lowStockThreshold: 5, description: 'Kính bơi chống sương mù, đệm silicone êm ái' },
    { sku: 'MU-BOI-POLA', name: 'Mũ bơi Poolane (silicone)', type: 'physical' as const, price: 120_000, cost: 50_000, stockQuantity: 30, lowStockThreshold: 5, description: 'Mũ bơi silicone in logo Poolane' },
    { sku: 'KIT-NOOBIE', name: 'Bộ phụ kiện cho người mới', type: 'physical' as const, price: 350_000, cost: 180_000, stockQuantity: 10, lowStockThreshold: 3, description: 'Kính + mũ + dây cản nước cho người mới học' },
  ]

  let created = 0
  let updated = 0

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } })
    if (existing) {
      await prisma.product.update({
        where: { sku: p.sku },
        data: {
          name: p.name,
          type: p.type,
          price: p.price,
          cost: 'cost' in p ? p.cost : null,
          description: p.description,
          linkedCourseId: 'linkedCourseId' in p ? p.linkedCourseId : null,
          sessionsCount: 'sessionsCount' in p ? p.sessionsCount : null,
          stockQuantity: p.type === 'physical' && 'stockQuantity' in p ? p.stockQuantity : null,
          lowStockThreshold: 'lowStockThreshold' in p ? p.lowStockThreshold : 3,
          isActive: true,
        }
      })
      updated++
      process.stdout.write(`↻`)
    } else {
      await prisma.product.create({
        data: {
          name: p.name,
          sku: p.sku,
          type: p.type,
          price: p.price,
          cost: 'cost' in p ? p.cost : null,
          description: p.description,
          photos: [],
          linkedCourseId: 'linkedCourseId' in p ? p.linkedCourseId : null,
          sessionsCount: 'sessionsCount' in p ? p.sessionsCount : null,
          stockQuantity: p.type === 'physical' && 'stockQuantity' in p ? p.stockQuantity : null,
          lowStockThreshold: 'lowStockThreshold' in p ? p.lowStockThreshold : 3,
          isActive: true,
        }
      })
      created++
      process.stdout.write(`+`)
    }
  }

  console.log(`\n\n✅ Done. Created: ${created} · Updated: ${updated} · Total: ${products.length}`)
}

main()
  .catch(e => {
    console.error('❌ Seed products failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
