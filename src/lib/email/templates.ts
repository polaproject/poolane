// Email templates — Poolane brand colors
// HTML + plain text fallback. Inline styles vì email client hỗ trợ CSS kém.

const BRAND = {
  navy: '#1C2B4A',
  cream: '#F6F1EA',
  gold: '#C8A84B',
  teal: '#5B8E9F',
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://poolane.vn'
const SUPPORT_EMAIL = process.env.EMAIL_FROM ?? 'support@polaproject.com'

function layout(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Poolane</title></head>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:'Plus Jakarta Sans',Arial,sans-serif;color:${BRAND.navy};">
<span style="display:none;color:transparent;height:0;width:0;overflow:hidden;">${preheader}</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BRAND.cream};padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(28,43,74,0.06);">
      <tr><td style="background:${BRAND.navy};padding:24px;text-align:center;">
        <div style="color:${BRAND.cream};font-size:18px;font-weight:700;letter-spacing:3px;">POOLANE</div>
        <div style="color:rgba(246,241,234,0.5);font-size:10px;letter-spacing:2px;margin-top:4px;">a Pola Project</div>
      </td></tr>
      <tr><td style="padding:32px 28px;">${content}</td></tr>
      <tr><td style="background:${BRAND.cream};padding:16px 28px;border-top:1px solid rgba(28,43,74,0.08);font-size:12px;color:rgba(28,43,74,0.5);text-align:center;">
        Mọi thắc mắc liên hệ Zalo lớp hoặc <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND.teal};">${SUPPORT_EMAIL}</a><br>
        © Poolane — a Pola Project · poolane.vn
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

// ─── Templates ───────────────────────────────────────────

export function welcomeEmail(input: { fullName: string; studentCode: string }) {
  const content = `
    <h1 style="font-size:24px;margin:0 0 8px;color:${BRAND.navy};">Chào ${input.fullName} 🌊</h1>
    <p style="font-size:14px;line-height:1.6;color:rgba(28,43,74,0.7);">
      Cảm ơn bạn đã tạo tài khoản tại Poolane! Mã học viên của bạn là <strong style="color:${BRAND.navy};">${input.studentCode}</strong>.
    </p>
    <p style="font-size:14px;line-height:1.6;color:rgba(28,43,74,0.7);">
      Lớp sẽ liên hệ bạn trong 24h tới để tư vấn khoá học phù hợp. Trong khi chờ, bạn có thể đăng nhập để xem các khoá hiện có.
    </p>
    <p style="margin:24px 0;">
      <a href="${APP_URL}/login" style="display:inline-block;background:${BRAND.navy};color:${BRAND.cream};padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Đăng nhập ngay</a>
    </p>
    <p style="font-size:13px;color:rgba(28,43,74,0.5);">Buổi tối bình yên — Poolane 💙</p>`
  return {
    subject: `Chào mừng ${input.fullName} đến với Poolane!`,
    html: layout(content, `Mã học viên ${input.studentCode}`),
    text: `Chào ${input.fullName},\n\nCảm ơn bạn đã tạo tài khoản tại Poolane! Mã học viên: ${input.studentCode}.\n\nLớp sẽ liên hệ trong 24h.\n\nĐăng nhập: ${APP_URL}/login\n\nPoolane`,
  }
}

export function paymentReceiptEmail(input: {
  fullName: string
  amount: number
  type: string
  paymentMethod: string
  recordedAt: Date
  referenceNumber?: string | null
}) {
  const content = `
    <h1 style="font-size:22px;margin:0 0 8px;color:${BRAND.navy};">Biên lai thanh toán 💰</h1>
    <p style="font-size:14px;color:rgba(28,43,74,0.7);">Xin chào ${input.fullName},</p>
    <p style="font-size:14px;color:rgba(28,43,74,0.7);">Lớp đã ghi nhận khoản thanh toán của bạn:</p>
    <table style="width:100%;margin:16px 0;border:1px solid rgba(28,43,74,0.08);border-radius:8px;">
      <tr><td style="padding:10px 16px;font-size:13px;color:rgba(28,43,74,0.5);">Số tiền</td><td style="padding:10px 16px;text-align:right;font-size:20px;font-weight:700;color:${BRAND.navy};">${fmt(input.amount)}</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:rgba(28,43,74,0.5);border-top:1px solid rgba(28,43,74,0.05);">Loại</td><td style="padding:10px 16px;text-align:right;font-size:13px;color:${BRAND.navy};border-top:1px solid rgba(28,43,74,0.05);">${input.type}</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:rgba(28,43,74,0.5);border-top:1px solid rgba(28,43,74,0.05);">Phương thức</td><td style="padding:10px 16px;text-align:right;font-size:13px;color:${BRAND.navy};border-top:1px solid rgba(28,43,74,0.05);">${input.paymentMethod}</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:rgba(28,43,74,0.5);border-top:1px solid rgba(28,43,74,0.05);">Thời gian</td><td style="padding:10px 16px;text-align:right;font-size:13px;color:${BRAND.navy};border-top:1px solid rgba(28,43,74,0.05);">${input.recordedAt.toLocaleString('vi-VN')}</td></tr>
      ${input.referenceNumber ? `<tr><td style="padding:10px 16px;font-size:13px;color:rgba(28,43,74,0.5);border-top:1px solid rgba(28,43,74,0.05);">Mã GD</td><td style="padding:10px 16px;text-align:right;font-size:12px;color:${BRAND.navy};border-top:1px solid rgba(28,43,74,0.05);font-family:monospace;">${input.referenceNumber}</td></tr>` : ''}
    </table>
    <p style="font-size:13px;color:rgba(28,43,74,0.5);">Xem lịch sử thanh toán đầy đủ tại <a href="${APP_URL}/student/payments" style="color:${BRAND.teal};">poolane.vn/student/payments</a></p>`
  return {
    subject: `Biên lai thanh toán ${fmt(input.amount)} — Poolane`,
    html: layout(content, `Đã ghi nhận ${fmt(input.amount)}`),
    text: `Biên lai thanh toán Poolane\n\nSố tiền: ${fmt(input.amount)}\nLoại: ${input.type}\nPhương thức: ${input.paymentMethod}\nThời gian: ${input.recordedAt.toLocaleString('vi-VN')}${input.referenceNumber ? `\nMã GD: ${input.referenceNumber}` : ''}\n\nXem lịch sử: ${APP_URL}/student/payments`,
  }
}

export function absenceReminderEmail(input: { fullName: string; daysSince: number }) {
  const content = `
    <h1 style="font-size:22px;margin:0 0 8px;color:${BRAND.navy};">Lớp nhớ ${input.fullName} 🌊</h1>
    <p style="font-size:14px;line-height:1.6;color:rgba(28,43,74,0.7);">
      Đã ${input.daysSince} ngày bạn chưa xuống nước. Lớp luôn để dành chỗ cho bạn — hãy quay lại khi sẵn sàng nhé!
    </p>
    <p style="margin:20px 0;">
      <a href="${APP_URL}/student/schedule" style="display:inline-block;background:${BRAND.navy};color:${BRAND.cream};padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Đăng ký buổi học</a>
    </p>
    <p style="font-size:13px;color:rgba(28,43,74,0.5);">Có gì khó khăn cứ nhắn cho lớp qua Zalo nhé.</p>`
  return {
    subject: `${input.fullName} ơi, lớp nhớ bạn 💙`,
    html: layout(content, `Đã ${input.daysSince} ngày chưa gặp nhau`),
    text: `Chào ${input.fullName},\n\nĐã ${input.daysSince} ngày bạn chưa xuống nước. Lớp luôn để dành chỗ — quay lại khi sẵn sàng nhé!\n\nĐăng ký: ${APP_URL}/student/schedule`,
  }
}

export function birthdayEmail(input: { fullName: string }) {
  const content = `
    <h1 style="font-size:24px;margin:0 0 8px;color:${BRAND.gold};">Sinh nhật vui vẻ ${input.fullName} 🎂</h1>
    <p style="font-size:14px;line-height:1.6;color:rgba(28,43,74,0.7);">
      Chúc bạn một năm mới thật khoẻ, thật bình yên, và bơi giỏi hơn năm cũ thật nhiều!
    </p>
    <p style="font-size:14px;line-height:1.6;color:rgba(28,43,74,0.7);">
      Cảm ơn bạn đã là một phần của Poolane 🌊
    </p>
    <p style="font-size:13px;color:rgba(28,43,74,0.5);margin-top:24px;">— Lớp Poolane</p>`
  return {
    subject: `🎂 Chúc mừng sinh nhật ${input.fullName}!`,
    html: layout(content, `Poolane chúc mừng sinh nhật`),
    text: `Chúc mừng sinh nhật ${input.fullName}!\n\nChúc bạn một năm mới thật khoẻ, thật bình yên, bơi giỏi hơn năm cũ thật nhiều!\n\n— Lớp Poolane`,
  }
}

export function refundConfirmationEmail(input: {
  fullName: string
  amount: number
  transferReference: string
}) {
  const content = `
    <h1 style="font-size:22px;margin:0 0 8px;color:${BRAND.navy};">Đã chuyển khoản hoàn tiền 💸</h1>
    <p style="font-size:14px;color:rgba(28,43,74,0.7);">Chào ${input.fullName},</p>
    <p style="font-size:14px;color:rgba(28,43,74,0.7);">Lớp đã chuyển khoản số tiền <strong style="color:${BRAND.navy};">${fmt(input.amount)}</strong> về tài khoản của bạn.</p>
    <p style="font-size:13px;color:rgba(28,43,74,0.5);background:${BRAND.cream};padding:12px;border-radius:8px;">
      <strong>Mã giao dịch:</strong> <code>${input.transferReference}</code><br>
      Vui lòng kiểm tra tài khoản và liên hệ lớp nếu chưa nhận được trong 24h.
    </p>
    <p style="font-size:14px;line-height:1.6;color:rgba(28,43,74,0.7);margin-top:20px;">
      Cảm ơn bạn đã đồng hành cùng Poolane. Hẹn gặp lại bạn ở hồ bơi! 💙
    </p>`
  return {
    subject: `Đã chuyển ${fmt(input.amount)} — Poolane`,
    html: layout(content),
    text: `Đã chuyển khoản hoàn tiền\n\nChào ${input.fullName},\n\nLớp đã chuyển ${fmt(input.amount)} về tài khoản của bạn.\nMã giao dịch: ${input.transferReference}\n\nCảm ơn bạn đã đồng hành cùng Poolane.`,
  }
}
