/**
 * Backfill actionUrl cho các notification cũ chưa có (trước khi code fix).
 *
 * Chạy 1 lần:
 *   npx dotenv -e .env.local -- npx tsx prisma/backfill-notification-action-urls.ts
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

interface Rule {
  match: (title: string, body: string) => boolean
  actionUrl: string
  label: string
}

const RULES: Rule[] = [
  {
    label: 'Đơn hàng mới (admin)',
    match: t => t.startsWith('Đơn hàng mới'),
    actionUrl: '/admin/shop/orders?status=pending',
  },
  {
    label: 'Yêu cầu reset mật khẩu (admin)',
    match: t => t.includes('reset mật khẩu') && !t.includes('Mật khẩu đã'),
    actionUrl: '/admin/password-resets',
  },
  {
    label: 'Học viên mới đăng ký (admin)',
    match: t => t.includes('Học viên mới đăng ký'),
    actionUrl: '/admin/students',
  },
  {
    label: 'Yêu cầu cập nhật thông tin (admin)',
    match: t => t.includes('Yêu cầu cập nhật'),
    actionUrl: '/admin/profile-requests',
  },
  {
    label: 'Đối chiếu (admin)',
    match: t => t.includes('Đối chiếu'),
    actionUrl: '/admin/reports',
  },
  {
    label: 'Pulse Check (admin)',
    match: t => t.includes('Pulse Check'),
    actionUrl: '/admin/pulse',
  },
  {
    label: 'Sepay chưa khớp (admin)',
    match: t => t.includes('Sepay chưa khớp') || t.includes('Giao dịch Sepay'),
    actionUrl: '/admin/finance/unmatched',
  },
  // Student-bound rules
  {
    label: 'Đăng ký duyệt/từ chối',
    match: t => t.includes('Đăng ký được duyệt') || t.includes('Đăng ký không được duyệt'),
    actionUrl: '/student/my-schedule',
  },
  {
    label: 'Ca học bị huỷ',
    match: t => t.includes('Ca học hôm nay bị huỷ') || t.includes('buổi học đã được mở lại'),
    actionUrl: '/student/my-schedule',
  },
  {
    label: 'Thanh toán ghi nhận',
    match: t => t.includes('Đã ghi nhận thanh toán') || t.includes('Thanh toán MoMo'),
    actionUrl: '/student/payments',
  },
  {
    label: 'Hoàn tiền',
    match: t => t.includes('hoàn tiền') || t.includes('chuyển tiền hoàn'),
    actionUrl: '/student/payments',
  },
  {
    label: 'Đánh giá mới',
    match: t => t.includes('Kết quả đánh giá') || t.includes('Tốt nghiệp'),
    actionUrl: '/student/progress',
  },
  {
    label: 'Vé bơi sắp hết',
    match: t => t.includes('Vé bơi sắp hết'),
    actionUrl: '/student/payments',
  },
  {
    label: 'Vắng học / Lớp nhớ bạn',
    match: t => t.includes('vắng học') || t.includes('Lớp nhớ bạn'),
    actionUrl: '/student/schedule',
  },
  {
    label: 'Video bơi',
    match: t => t.includes('Video bơi'),
    actionUrl: '/student/videos',
  },
  {
    label: 'Bài tập gán',
    match: t => t.includes('Bài tập') && (t.includes('giao') || t.includes('mới')),
    actionUrl: '/student/exercises/my',
  },
  // Shop order action — pay/fulfill/reject/cancel → list (approve handled riêng vì cần orderId)
  {
    label: 'Đơn hàng đã thanh toán/hoàn thành/huỷ/từ chối',
    match: t =>
      t.includes('Đã ghi nhận thanh toán') ||
      t.includes('Đơn hàng hoàn thành') ||
      t.includes('Đơn hàng không được duyệt') ||
      t.includes('Đơn hàng đã huỷ'),
    actionUrl: '/student/shop/orders',
  },
]

async function main() {
  const orphans = await prisma.notification.findMany({
    where: { actionUrl: null },
    select: { id: true, title: true, body: true, metadata: true },
  })
  console.log(`Found ${orphans.length} notifications without actionUrl.`)

  const buckets: Record<string, string[]> = {}
  // Special: "Đơn hàng được duyệt" cần actionUrl per-noti (kèm orderId từ metadata)
  const approvedOrderUpdates: Array<{ id: string; url: string }> = []
  for (const n of orphans) {
    // Special handling: approved order → deep-link to pay page
    if (n.title.includes('Đơn hàng được duyệt')) {
      const meta = n.metadata as { orderId?: string } | null
      if (meta?.orderId) {
        approvedOrderUpdates.push({ id: n.id, url: `/student/shop/orders/${meta.orderId}/pay` })
      } else {
        // Fallback if no orderId
        approvedOrderUpdates.push({ id: n.id, url: '/student/shop/orders' })
      }
      continue
    }
    const rule = RULES.find(r => r.match(n.title, n.body))
    if (!rule) continue
    if (!buckets[rule.label]) buckets[rule.label] = []
    buckets[rule.label].push(n.id)
  }

  let total = 0
  for (const rule of RULES) {
    const ids = buckets[rule.label]
    if (!ids?.length) continue
    const res = await prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: { actionUrl: rule.actionUrl },
    })
    console.log(`  ${rule.label}: ${res.count} updated → ${rule.actionUrl}`)
    total += res.count
  }

  // Apply per-notification updates for approved orders (each has unique URL)
  if (approvedOrderUpdates.length > 0) {
    for (const upd of approvedOrderUpdates) {
      await prisma.notification.update({ where: { id: upd.id }, data: { actionUrl: upd.url } })
    }
    console.log(`  Đơn hàng được duyệt (per-orderId deep-link): ${approvedOrderUpdates.length} updated`)
    total += approvedOrderUpdates.length
  }

  console.log(`\nDone. Updated ${total} notifications.`)
  console.log(`Remaining ${orphans.length - total} without match (broadcast, birthday, system msg) — intentional.`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
