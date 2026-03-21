import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const USER_ID = "user_me"

export async function POST(request: NextRequest) {
  const sub = await request.json() as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    create: {
      userId: USER_ID,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  })

  return NextResponse.json({ ok: true })
}
