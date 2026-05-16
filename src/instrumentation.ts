/**
 * Next.js instrumentation hook — chạy 1 lần khi server start.
 *
 * Set process.env.TZ = 'Asia/Ho_Chi_Minh' để mọi Date format trên server
 * trả về giờ VN (+07:00) thay vì UTC mặc định của Vercel.
 *
 * Trước fix này: server-rendered pages (admin/shop/orders, student/shop/orders,
 * v.v.) hiển thị `format(date, 'HH:mm')` theo UTC → user thấy chậm 7 tiếng so
 * với giờ thực tế khi đặt đơn.
 *
 * Note: chỉ chạy với Node.js runtime, không phải Edge. Tất cả pages
 * trong /(dashboard) đều Node.js runtime nên OK.
 *
 * Backup: cũng nên set TZ trong Vercel Project Settings → Environment Variables
 * để chắc chắn ngay cả khi instrumentation lỗi.
 */
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    process.env.TZ = 'Asia/Ho_Chi_Minh'
  }
}
