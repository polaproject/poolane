import { defineConfig } from 'prisma/config'

// prisma.config.ts chỉ dùng cho Prisma CLI (db push, migrate...)
// KHÔNG ảnh hưởng đến PrismaClient runtime (dùng DATABASE_URL pooler)
// Dùng DIRECT_URL để bypass pgbouncer khi chạy migrations
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DIRECT_URL!, // Direct connection cho migrations
  },
})
