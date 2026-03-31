import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

const USER_ID = "user_me"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const favorite = searchParams.get("favorite")

  const where: Record<string, unknown> = { userId: USER_ID }
  if (category && category !== "all") where.category = category
  if (favorite === "true") where.favorite = true

  const items = await prisma.clothingItem.findMany({
    where,
    orderBy: [{ favorite: "desc" }, { createdAt: "desc" }],
  })
  return Response.json(items)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { imageData, category, subcategory, color, colorHex, pattern, season, name, vibes } = body

  if (!imageData || !category) {
    return Response.json({ error: "imageData and category are required" }, { status: 400 })
  }

  const item = await prisma.clothingItem.create({
    data: {
      userId: USER_ID,
      imageData,
      category,
      subcategory: subcategory ?? null,
      color: color ?? null,
      colorHex: colorHex ?? null,
      pattern: pattern ?? null,
      season: season ?? null,
      name: name ?? null,
      vibes: Array.isArray(vibes) ? vibes : [],
    },
  })

  return Response.json(item, { status: 201 })
}
