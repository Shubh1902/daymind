"use client"

import { useEffect } from "react"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const array = Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
  return array.buffer as ArrayBuffer
}

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (registration) => {
        // Request push permission and subscribe
        const permission = await Notification.requestPermission()
        if (permission !== "granted") return

        const existing = await registration.pushManager.getSubscription()
        if (existing) return // Already subscribed

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        // Save to server
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        })
      })
      .catch(() => {
        // SW registration failed silently — app still works
      })
  }, [])

  return null
}
