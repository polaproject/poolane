import { Resend } from 'resend'
import { log, logError } from '@/lib/logger'

const apiKey = process.env.RESEND_API_KEY
const fromAddress = process.env.EMAIL_FROM ?? 'support@poolane.vn'

// Singleton client — lazily instantiate
let _resend: Resend | null = null
function getClient(): Resend | null {
  if (_resend) return _resend
  if (!apiKey) {
    log.warn('email.client', 'RESEND_API_KEY chưa setup — email sẽ không gửi')
    return null
  }
  _resend = new Resend(apiKey)
  return _resend
}

export interface SendEmailInput {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

/**
 * Gửi email qua Resend. Trong dev/test khi không có API key — log & no-op.
 * Trả về { ok, error } để caller xử lý nhưng không block flow nghiệp vụ.
 */
export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const client = getClient()
  if (!client) {
    // No-op in dev — chỉ log
    log.info('email.send.skipped', 'Email skipped (no API key)', {
      to: input.to, subject: input.subject
    })
    return { ok: false, error: 'NO_API_KEY' }
  }

  try {
    const { error } = await client.emails.send({
      from: `Poolane <${fromAddress}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    })

    if (error) {
      await logError({ context: 'email.send', message: error.message, error })
      return { ok: false, error: error.message }
    }

    log.info('email.send', 'Email sent', { to: input.to, subject: input.subject })
    return { ok: true }

  } catch (error) {
    await logError({ context: 'email.send', message: 'Resend exception', error })
    return { ok: false, error: error instanceof Error ? error.message : 'UNKNOWN' }
  }
}
