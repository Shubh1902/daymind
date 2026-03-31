import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

const USER_ID = "user_me"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month") // format: "2026-03"

  let startDate: Date
  let endDate: Date

  if (month) {
    const [year, m] = month.split("-").map(Number)
    startDate = new Date(year, m - 1, 1)
    endDate = new Date(year, m, 1)
  } else {
    // Default to current month
    const now = new Date()
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }

  const entries = await prisma.outfitCalendarEntry.findMany({
    where: {
      userId: USER_ID,
      date: { gte: startDate, lt: endDate },
    },
    include: {
      outfit: {
        include: {
          items: {
            include: { clothingItem: true },
          },
        },
      },
    },
    orderBy: { date: "asc" },
  })

  return Response.json(entries)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { date, outfitId, itemIds, notes } = body

  if (!date) {
    return Response.json({ error: "date is required" }, { status: 400 })
  }

  const dateObj = new Date(date)
  dateObj.setHours(0, 0, 0, 0)

  let finalOutfitId = outfitId

  // If itemIds provided but no outfitId, create a new outfit
  if (!finalOutfitId && Array.isArray(itemIds) && itemIds.length > 0) {
    const outfit = await prisma.outfit.create({
      data: {
        userId: USER_ID,
        name: `Outfit ${dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        aiGenerated: false,
        saved: false,
        items: {
          create: itemIds.map((clothingItemId: string) => ({ clothingItemId })),
        },
      },
    })
    finalOutfitId = outfit.id

    // Update wear counts for the items
    await prisma.clothingItem.updateMany({
      where: { id: { in: itemIds } },
      data: { lastWornAt: dateObj, wearCount: { increment: 1 } },
    })
  }

  const entry = await prisma.outfitCalendarEntry.upsert({
    where: { userId_date: { userId: USER_ID, date: dateObj } },
    update: {
      outfitId: finalOutfitId ?? null,
      notes: notes ?? null,
    },
    create: {
      userId: USER_ID,
      date: dateObj,
      outfitId: finalOutfitId ?? null,
      notes: notes ?? null,
    },
    include: {
      outfit: {
        include: { items: { include: { clothingItem: true } } },
      },
    },
  })

  return Response.json(entry, { status: 201 })
}
