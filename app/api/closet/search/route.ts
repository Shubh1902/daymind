import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

const USER_ID = "user_me"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get("q") ?? "").trim().toLowerCase()

  if (!q) {
    return Response.json([])
  }

  // Fetch all user items and filter in-memory for flexible multi-field search
  const items = await prisma.clothingItem.findMany({
    where: { userId: USER_ID },
    orderBy: [{ favorite: "desc" }, { createdAt: "desc" }],
  })

  const terms = q.split(/\s+/)

  const matched = items.filter((item) => {
    const searchable = [
      item.name,
      item.category,
      item.subcategory,
      item.color,
      item.pattern,
      item.season,
      ...(item.vibes ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return terms.every((term) => searchable.includes(term))
  })

  return Response.json(matched)
}
