import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const USER_ID = "user_me"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { occasion, excludeRecentDays = 3 } = body

  const [items, recentEntries] = await Promise.all([
    prisma.clothingItem.findMany({ where: { userId: USER_ID } }),
    prisma.outfitCalendarEntry.findMany({
      where: {
        userId: USER_ID,
        date: { gte: new Date(Date.now() - excludeRecentDays * 86400000) },
      },
      include: { outfit: { include: { items: true } } },
    }),
  ])

  if (items.length < 2) {
    return Response.json({ error: "Add at least 2 items to get OOTD" }, { status: 400 })
  }

  // Collect recently worn item IDs
  const recentItemIds = new Set<string>()
  for (const entry of recentEntries) {
    if (entry.outfit?.items) {
      for (const oi of entry.outfit.items) {
        recentItemIds.add(oi.clothingItemId)
      }
    }
  }

  const inventoryText = items
    .map(
      (item) =>
        `ID:${item.id} | ${item.name ?? "Unnamed"} (${item.category}/${item.subcategory ?? "unknown"}): Color=${item.color ?? "unknown"}, Pattern=${item.pattern ?? "unknown"}, Vibes=[${(item.vibes ?? []).join(", ")}]${recentItemIds.has(item.id) ? " [WORN RECENTLY - avoid]" : ""}`
    )
    .join("\n")

  const occasionText = occasion ? `for: ${occasion}` : "for a versatile everyday look"

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: `You are a women's fashion stylist. Pick ONE complete outfit from the wardrobe ${occasionText}. Avoid items marked [WORN RECENTLY]. The outfit must include items from at least 2 different categories.

Return ONLY valid JSON:
{
  "name": "Creative outfit name",
  "itemIds": ["id1", "id2", ...],
  "occasion": "the occasion",
  "stylingTip": "One practical styling sentence",
  "confidence": "how confident you are this looks great (1-10)"
}`,
      messages: [
        {
          role: "user",
          content: `My wardrobe:\n${inventoryText}\n\nPick one outfit ${occasionText}. Return only valid JSON.`,
        },
      ],
    })

    const rawText =
      response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? ""

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: "AI did not return valid OOTD" }, { status: 500 })
    }

    const ootd = JSON.parse(jsonMatch[0])
    const itemMap = new Map(items.map((i) => [i.id, i]))
    ootd.items = (ootd.itemIds ?? []).map((id: string) => itemMap.get(id)).filter(Boolean)

    return Response.json(ootd)
  } catch (error) {
    console.error("OOTD error:", error)
    return Response.json({ error: "Failed to generate OOTD" }, { status: 500 })
  }
}
