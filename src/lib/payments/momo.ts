import crypto from 'crypto'
import { log, logError } from '@/lib/logger'

// MoMo Payment Gateway integration
// Docs: https://developers.momo.vn/v3/docs/payment/api/wallet/onetime

const config = {
  partnerCode: process.env.MOMO_PARTNER_CODE ?? 'MOMO',
  accessKey: process.env.MOMO_ACCESS_KEY ?? 'F8BBA842ECF85',
  secretKey: process.env.MOMO_SECRET_KEY ?? 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  endpoint: process.env.MOMO_ENDPOINT ?? 'https://test-payment.momo.vn/v2/gateway/api/create',
  ipnUrl: process.env.MOMO_IPN_URL ?? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/webhooks/momo`,
  redirectUrl: process.env.MOMO_REDIRECT_URL ?? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/payments/return`,
}

interface CreatePaymentInput {
  requestId: string
  orderId: string
  amount: number
  orderInfo: string
  extraData?: string
}

interface MoMoCreateResponse {
  partnerCode: string
  orderId: string
  requestId: string
  amount: number
  responseTime: number
  message: string
  resultCode: number
  payUrl?: string
  deeplink?: string
  qrCodeUrl?: string
}

/**
 * Tạo HMAC SHA256 signature theo spec MoMo
 * rawSignature format: accessKey=...&amount=...&extraData=...&ipnUrl=...&orderId=...&orderInfo=...&partnerCode=...&redirectUrl=...&requestId=...&requestType=...
 */
function signCreatePayment(input: CreatePaymentInput, requestType = 'payWithMethod'): string {
  const raw = `accessKey=${config.accessKey}` +
    `&amount=${input.amount}` +
    `&extraData=${input.extraData ?? ''}` +
    `&ipnUrl=${config.ipnUrl}` +
    `&orderId=${input.orderId}` +
    `&orderInfo=${input.orderInfo}` +
    `&partnerCode=${config.partnerCode}` +
    `&redirectUrl=${config.redirectUrl}` +
    `&requestId=${input.requestId}` +
    `&requestType=${requestType}`

  return crypto.createHmac('sha256', config.secretKey).update(raw).digest('hex')
}

/**
 * Verify IPN signature
 * Spec: accessKey=...&amount=...&extraData=...&message=...&orderId=...&orderInfo=...&orderType=...&partnerCode=...&payType=...&requestId=...&responseTime=...&resultCode=...&transId=...
 */
export function verifyIpnSignature(body: Record<string, unknown>): boolean {
  const raw = `accessKey=${config.accessKey}` +
    `&amount=${body.amount ?? ''}` +
    `&extraData=${body.extraData ?? ''}` +
    `&message=${body.message ?? ''}` +
    `&orderId=${body.orderId ?? ''}` +
    `&orderInfo=${body.orderInfo ?? ''}` +
    `&orderType=${body.orderType ?? ''}` +
    `&partnerCode=${body.partnerCode ?? ''}` +
    `&payType=${body.payType ?? ''}` +
    `&requestId=${body.requestId ?? ''}` +
    `&responseTime=${body.responseTime ?? ''}` +
    `&resultCode=${body.resultCode ?? ''}` +
    `&transId=${body.transId ?? ''}`

  const expected = crypto.createHmac('sha256', config.secretKey).update(raw).digest('hex')
  return expected === body.signature
}

/**
 * Gọi MoMo /v2/gateway/api/create → trả về payUrl
 */
export async function createPaymentUrl(input: CreatePaymentInput): Promise<{
  ok: boolean
  payUrl?: string
  qrCodeUrl?: string
  raw?: MoMoCreateResponse
  error?: string
}> {
  try {
    const signature = signCreatePayment(input)

    const requestBody = {
      partnerCode: config.partnerCode,
      accessKey: config.accessKey,
      requestId: input.requestId,
      amount: input.amount,
      orderId: input.orderId,
      orderInfo: input.orderInfo,
      redirectUrl: config.redirectUrl,
      ipnUrl: config.ipnUrl,
      extraData: input.extraData ?? '',
      requestType: 'payWithMethod',
      signature,
      lang: 'vi',
    }

    log.info('momo.create', `Creating payment for order ${input.orderId}`, { amount: input.amount })

    const res = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    const data: MoMoCreateResponse = await res.json()

    if (data.resultCode !== 0 || !data.payUrl) {
      await logError({ context: 'momo.create', message: `Failed: ${data.message}`, inputData: { resultCode: data.resultCode } })
      return { ok: false, error: data.message ?? 'Unknown error', raw: data }
    }

    return { ok: true, payUrl: data.payUrl, qrCodeUrl: data.qrCodeUrl, raw: data }

  } catch (error) {
    await logError({ context: 'momo.create', message: 'Exception', error })
    return { ok: false, error: error instanceof Error ? error.message : 'UNKNOWN' }
  }
}

export function isMoMoConfigured(): boolean {
  return Boolean(config.partnerCode && config.accessKey && config.secretKey)
}
