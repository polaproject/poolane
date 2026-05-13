import webPush from 'web-push'
import { log, logError } from '@/lib/logger'

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivate = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:support@poolane.vn'

let _configured = false
function configure(): boolean {
  if (_configured) return true
  if (!vapidPublic || !vapidPrivate) {
    log.warn('push.client', 'VAPID keys chưa setup — push notification sẽ không gửi')
    return false
  }
  webPush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)
  _configured = true
  return true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

export async function sendPush(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}, payload: PushPayload): Promise<{ ok: boolean; error?: string; statusCode?: number }> {
  if (!configure()) {
    return { ok: false, error: 'VAPID_NOT_CONFIGURED' }
  }

  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload))
    return { ok: true }
  } catch (error) {
    const err = error as { statusCode?: number; message?: string }
    // Gone — subscription expired, caller nên xoá
    if (err.statusCode === 410 || err.statusCode === 404) {
      return { ok: false, error: 'EXPIRED', statusCode: err.statusCode }
    }
    await logError({ context: 'push.send', message: err.message ?? 'Unknown', error })
    return { ok: false, error: err.message ?? 'UNKNOWN', statusCode: err.statusCode }
  }
}
