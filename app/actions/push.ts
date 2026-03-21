"use server"

import webpush from "web-push"
import { prisma } from "@/lib/prisma"

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string
) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  if (subscriptions.length === 0) return

  const payload = JSON.stringify({ title, body })

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch(async (err) => {
        // If subscription expired or invalid, remove it
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } })
        }
      })
    )
  )
}
