const CACHE = "daymind-v2"
const APP_SHELL = ["/dashboard", "/"]

// Install: cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network-only — never serve stale cache when server is down
self.addEventListener("fetch", (event) => {
  // Only handle GET requests; let everything else pass through
  if (event.request.method !== "GET") return

  // Always go straight to network — no cache fallback
  // This ensures you never see stale content when the dev server is off
  event.respondWith(fetch(event.request))
})

// Push: show notification
self.addEventListener("push", (event) => {
  let data = { title: "DayMind", body: "Your day plan is ready." }
  try {
    data = event.data.json()
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: "/dashboard" },
    })
  )
})

// Notification click: open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes("/dashboard") && "focus" in client) {
            return client.focus()
          }
        }
        return clients.openWindow("/dashboard")
      })
  )
})
