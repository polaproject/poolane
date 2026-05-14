// VietQR — Chuẩn QR Code NAPAS cho chuyển khoản ngân hàng Việt Nam
// Docs: https://www.vietqr.io/danh-sach-api

const config = {
  bin: process.env.BANK_BIN ?? '970436',                    // Default Vietcombank BIN
  accountNo: process.env.BANK_ACCOUNT_NO ?? '0000000000',   // Default demo
  accountName: process.env.BANK_ACCOUNT_NAME ?? 'POOLANE DEMO',
  bankDisplayName: process.env.BANK_DISPLAY_NAME ?? 'Vietcombank',
}

// Các BIN code phổ biến
export const BANK_BIN_NAMES: Record<string, string> = {
  '970436': 'Vietcombank',
  '970407': 'Techcombank',
  '970432': 'VPBank',
  '970422': 'MB Bank',
  '970416': 'ACB',
  '970423': 'TPBank',
  '970418': 'BIDV',
  '970415': 'VietinBank',
  '970426': 'Maritime Bank',
  '970448': 'OCB',
  '970428': 'NamABank',
  '970403': 'Sacombank',
  '970454': 'VietCapitalBank',
}

export function isVietQRConfigured(): boolean {
  return Boolean(
    process.env.BANK_BIN &&
    process.env.BANK_ACCOUNT_NO &&
    process.env.BANK_ACCOUNT_NAME &&
    process.env.BANK_ACCOUNT_NO !== '0000000000'
  )
}

/** Generate memo từ order ID — format `POLA<8chars uppercase>` (shop order) */
export function buildMemo(orderId: string): string {
  return `POLA${orderId.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

/** Memo cho enrollment (học phí) — format `POLAE<8chars uppercase>` */
export function buildEnrollmentMemo(enrollmentId: string): string {
  return `POLAE${enrollmentId.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

/** Match memo từ sao kê về order ID (truy ngược) */
export function matchMemoToOrder(memo: string, orderIds: string[]): string | null {
  const upper = memo.toUpperCase()
  for (const id of orderIds) {
    if (upper.includes(buildMemo(id))) return id
  }
  return null
}

interface QRInfo {
  qrUrl: string
  bin: string
  accountNo: string
  accountName: string
  bankDisplayName: string
  amount: number
  memo: string
  configured: boolean
}

/** Build full QR info cho 1 order */
export function buildQRInfo(amount: number, memo: string): QRInfo {
  const bankName = BANK_BIN_NAMES[config.bin] ?? config.bankDisplayName
  // img.vietqr.io API — free, no auth
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: memo,
    accountName: config.accountName,
  })
  const qrUrl = `https://img.vietqr.io/image/${config.bin}-${config.accountNo}-compact2.png?${params.toString()}`

  return {
    qrUrl,
    bin: config.bin,
    accountNo: config.accountNo,
    accountName: config.accountName,
    bankDisplayName: bankName,
    amount,
    memo,
    configured: isVietQRConfigured(),
  }
}
