// Service Worker cho Push Notifications — Poolane

self.addEventListener('push', function(event) {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Poolane', body: event.data.text() }
  }

  const options = {
    body: payload.body,
    icon: payload.icon ?? '/icon-192.png',
    badge: '/badge.png',
    data: { url: payload.url ?? '/' },
    tag: payload.tag ?? 'poolane',
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Poolane', options)
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

self.addEventListener('install', function() {
  self.skipWaiting()
})

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim())
})
