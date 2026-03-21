import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateDayPlan } from "@/app/actions/ai"
import { sendPushNotification } from "@/app/actions/push"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  // Verify cron secret so only Vercel can call this
  const secret = request.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Find all users with push subscriptions
  const subscribers = await prisma.pushSubscription.findMany({
    select: { userId: true },
    distinct: ["userId"],
  })

  const results = await Promise.allSettled(
    subscribers.map(async ({ userId }) => {
      // Pre-generate today's plan (caches in DB; dashboard loads instantly)
      const session = await generateDayPlan(userId)

      const taskCount = session.plan.length
      const body =
        taskCount === 0
          ? "No tasks today. Add some and I'll build your plan."
          : `${taskCount} task${taskCount !== 1 ? "s" : ""} on your plan today. Tap to see your schedule.`

      await sendPushNotification(userId, "Good morning.", body)
    })
  )

  const succeeded = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length

  return NextResponse.json({ ok: true, succeeded, failed })
}
