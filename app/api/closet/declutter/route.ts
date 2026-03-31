import { prisma } from "@/lib/prisma"

const USER_ID = "user_me"

export async function GET() {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)

  // Items that haven't been worn in 60+ days OR never worn and added 30+ days ago
  const items = await prisma.clothingItem.findMany({
    where: {
      userId: USER_ID,
      OR: [
        { lastWornAt: { lt: sixtyDaysAgo } },
        { lastWornAt: null, wearCount: 0, createdAt: { lt: thirtyDaysAgo } },
      ],
    },
    orderBy: [{ wearCount: "asc" }, { createdAt: "asc" }],
  })

  const suggestions = items.map((item) => {
    let reason: string
    if (item.wearCount === 0) {
      const daysSinceAdded = Math.floor(
        (Date.now() - new Date(item.createdAt).getTime()) / 86400000
      )
      reason = `Never worn since added ${daysSinceAdded} days ago`
    } else if (item.lastWornAt) {
      const daysSinceWorn = Math.floor(
        (Date.now() - new Date(item.lastWornAt).getTime()) / 86400000
      )
      reason = `Last worn ${daysSinceWorn} days ago (total: ${item.wearCount}x)`
    } else {
      reason = `Worn ${item.wearCount}x but no recent activity`
    }

    return { ...item, reason }
  })

  return Response.json(suggestions)
}
