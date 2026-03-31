import { prisma } from "@/lib/prisma"

const USER_ID = "user_me"

export async function GET() {
  // Fetch all calendar entries with their outfit items for the past 90 days
  const since = new Date()
  since.setDate(since.getDate() - 90)

  const entries = await prisma.outfitCalendarEntry.findMany({
    where: { userId: USER_ID, date: { gte: since } },
    include: {
      outfit: {
        include: {
          items: {
            include: { clothingItem: true },
          },
        },
      },
    },
    orderBy: { date: "desc" },
  })

  // Calculate insights
  const itemWearMap = new Map<string, { count: number; lastWorn: Date; name: string; category: string }>()
  const outfitCombos = new Map<string, { count: number; lastWorn: Date; name: string; itemIds: string[] }>()

  for (const entry of entries) {
    if (!entry.outfit) continue
    const itemIds = entry.outfit.items.map((oi) => oi.clothingItemId).sort()
    const comboKey = itemIds.join("|")

    // Track outfit combos
    const existing = outfitCombos.get(comboKey)
    if (existing) {
      existing.count++
      if (entry.date > existing.lastWorn) existing.lastWorn = entry.date
    } else {
      outfitCombos.set(comboKey, {
        count: 1,
        lastWorn: entry.date,
        name: entry.outfit.name ?? "Outfit",
        itemIds,
      })
    }

    // Track individual item wears
    for (const oi of entry.outfit.items) {
      const ci = oi.clothingItem
      const ex = itemWearMap.get(ci.id)
      if (ex) {
        ex.count++
        if (entry.date > ex.lastWorn) ex.lastWorn = entry.date
      } else {
        itemWearMap.set(ci.id, {
          count: 1,
          lastWorn: entry.date,
          name: ci.name ?? ci.category,
          category: ci.category,
        })
      }
    }
  }

  // Most worn items
  const mostWornItems = [...itemWearMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([id, data]) => ({ id, ...data }))

  // Most repeated outfit combos
  const repeatedOutfits = [...outfitCombos.entries()]
    .filter(([, v]) => v.count > 1)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([, data]) => data)

  // Items not worn in 30+ days
  const allItems = await prisma.clothingItem.findMany({
    where: { userId: USER_ID },
    select: { id: true, name: true, category: true, lastWornAt: true, wearCount: true, imageData: true },
  })

  const neglected = allItems
    .filter((item) => {
      if (!item.lastWornAt) return item.wearCount === 0
      const daysSince = Math.floor((Date.now() - item.lastWornAt.getTime()) / 86400000)
      return daysSince >= 30
    })
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      name: item.name ?? item.category,
      category: item.category,
      daysSinceWorn: item.lastWornAt
        ? Math.floor((Date.now() - item.lastWornAt.getTime()) / 86400000)
        : null,
      neverWorn: item.wearCount === 0,
      imageData: item.imageData,
    }))

  // Total unique outfits worn
  const totalOutfits = outfitCombos.size
  const totalWears = entries.length

  return Response.json({
    mostWornItems,
    repeatedOutfits,
    neglected,
    totalOutfits,
    totalWears,
    recentEntries: entries.slice(0, 20).map((e) => ({
      date: e.date,
      outfitName: e.outfit?.name ?? "Outfit",
      itemCount: e.outfit?.items.length ?? 0,
    })),
  })
}
