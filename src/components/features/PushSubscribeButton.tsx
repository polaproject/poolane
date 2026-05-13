'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function PushSubscribeButton() {
  const [status, setStatus] = useState<'idle' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading'>('loading')
  const [error, setError] = useState<string | null>(null)

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (!publicKey) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    navigator.serviceWorker.getRegistration('/sw.js').then(reg => {
      if (!reg) {
        setStatus('unsubscribed')
        return
      }
      reg.pushManager.getSubscription().then(sub => {
        setStatus(sub ? 'subscribed' : 'unsubscribed')
      })
    })
  }, [publicKey])

  async function subscribe() {
    setError(null)
    if (!publicKey) return
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }
      const keyArray = urlBase64ToUint8Array(publicKey)
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyArray.buffer.slice(keyArray.byteOffset, keyArray.byteOffset + keyArray.byteLength) as ArrayBuffer,
      })
      const subJson = sub.toJSON()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: { p256dh: subJson.keys?.p256dh ?? '', auth: subJson.keys?.auth ?? '' },
          userAgent: navigator.userAgent,
        }),
      })
      if (!res.ok) {
        setError('Không thể lưu subscription')
        setStatus('unsubscribed')
        return
      }
      setStatus('subscribed')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi')
      setStatus('unsubscribed')
    }
  }

  async function unsubscribe() {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus('unsubscribed')
    } catch {
      setStatus('subscribed')
    }
  }

  if (status === 'unsupported') {
    return (
      <div className="flex items-center gap-2 text-xs text-[#1C2B4A]/40">
        <BellOff className="w-3.5 h-3.5" /> Trình duyệt không hỗ trợ push, hoặc VAPID chưa setup
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-700">
        <BellOff className="w-3.5 h-3.5" /> Bạn đã chặn thông báo. Mở cài đặt trình duyệt để cho phép lại.
      </div>
    )
  }

  if (status === 'subscribed') {
    return (
      <div className="space-y-1">
        <button onClick={unsubscribe}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#1C2B4A]/15 text-[#1C2B4A]/70 hover:bg-[#1C2B4A]/5">
          <BellRing className="w-3.5 h-3.5" /> Đã bật · Tắt thông báo
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <button onClick={subscribe} disabled={status === 'loading'}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1C2B4A] text-[#F6F1EA] hover:bg-[#1C2B4A]/90 disabled:opacity-50">
        <Bell className="w-3.5 h-3.5" /> Bật thông báo
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
