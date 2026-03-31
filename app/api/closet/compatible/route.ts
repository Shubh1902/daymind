import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const USER_ID = "user_me"

export async function POST(request: NextRequest) {
  const { itemId } = await request.json()

  if (!itemId) {
    return Response.json({ error: "itemId is required" }, { status: 400 })
  }

  const [targetItem, allItems] = await Promise.all([
    prisma.clothingItem.findFirst({ where: { id: itemId, userId: USER_ID } }),
    prisma.clothingItem.findMany({ where: { userId: USER_ID, id: { not: itemId } } }),
  ])

  if (!targetItem) {
    return Response.json({ error: "Item not found" }, { status: 404 })
  }

  if (allItems.length === 0) {
    return Response.json({ error: "No other items in closet" }, { status: 400 })
  }

  const targetDesc = `${targetItem.name ?? "Unnamed"} (${targetItem.category}/${targetItem.subcategory ?? "unknown"}): Color=${targetItem.color ?? "unknown"} (${targetItem.colorHex ?? "?"}), Pattern=${targetItem.pattern ?? "unknown"}, Vibes=[${(targetItem.vibes ?? []).join(", ")}]`

  const othersDesc = allItems
    .map(
      (item) =>
        `ID:${item.id} | ${item.name ?? "Unnamed"} (${item.category}/${item.subcategory ?? "unknown"}): Color=${item.color ?? "unknown"} (${item.colorHex ?? "?"}), Pattern=${item.pattern ?? "unknown"}, Vibes=[${(item.vibes ?? []).join(", ")}]`
    )
    .join("\n")

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `You are a women's fashion stylist. Given a target clothing item and a list of other items, rank the OTHER items by how well they'd pair with the target. Return ONLY a valid JSON array of the top 10 (or fewer if not enough items):
[
  { "id": "item_id", "score": 1-10, "reason": "one short sentence why this pairs well" }
]
Consider: color harmony, complementary categories (tops go with bottoms, not other tops), pattern mixing rules, vibe compatibility, and season matching.
Return ONLY the JSON array.`,
      messages: [
        {
          role: "user",
          content: `TARGET ITEM:\n${targetDesc}\n\nOTHER ITEMS:\n${othersDesc}\n\nRank by compatibility. Return only valid JSON array.`,
        },
      ],
    })

    const rawText =
      response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? ""

    const jsonMatch = rawText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return Response.json({ error: "AI did not return valid results" }, { status: 500 })
    }

    const rankings = JSON.parse(jsonMatch[0]) as Array<{ id: string; score: number; reason: string }>

    // Enrich with item data
    const itemMap = new Map(allItems.map((i) => [i.id, i]))
    const enriched = rankings
      .filter((r) => itemMap.has(r.id))
      .map((r) => ({
        ...r,
        item: itemMap.get(r.id),
      }))

    return Response.json({ target: targetItem, compatible: enriched })
  } catch (error) {
    console.error("Compatible error:", error)
    return Response.json({ error: "Failed to find compatible items" }, { status: 500 })
  }
}
