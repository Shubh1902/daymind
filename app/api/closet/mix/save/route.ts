import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

const USER_ID = "user_me"

export async function POST(request: NextRequest) {
  const { itemIds, name, occasion, feedback } = await request.json()

  if (!Array.isArray(itemIds) || itemIds.length < 2) {
    return Response.json({ error: "Select at least 2 items" }, { status: 400 })
  }

  const outfit = await prisma.outfit.create({
    data: {
      userId: USER_ID,
      name: name ?? "My Outfit",
      occasion: occasion ?? null,
      feedback: feedback ?? null,
      aiGenerated: false,
      saved: true,
      items: {
        create: itemIds.map((clothingItemId: string) => ({
          clothingItemId,
        })),
      },
    },
    include: { items: { include: { clothingItem: true } } },
  })

  return Response.json(outfit, { status: 201 })
}
