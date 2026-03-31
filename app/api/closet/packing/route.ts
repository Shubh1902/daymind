import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const USER_ID = "user_me"

export async function POST(request: NextRequest) {
  const { days, occasions, climate } = await request.json()

  if (!days || !Array.isArray(occasions) || !climate) {
    return Response.json(
      { error: "days, occasions (array), and climate are required" },
      { status: 400 }
    )
  }

  const items = await prisma.clothingItem.findMany({
    where: { userId: USER_ID },
  })

  if (items.length < 3) {
    return Response.json({ error: "Need at least 3 items for packing suggestions" }, { status: 400 })
  }

  const inventoryText = items
    .map(
      (item) =>
        `ID:${item.id} | ${item.name ?? "Unnamed"} (${item.category}/${item.subcategory ?? "unknown"}): Color=${item.color ?? "unknown"}, Pattern=${item.pattern ?? "unknown"}, Season=${item.season ?? "all"}, Vibes=[${(item.vibes ?? []).join(", ")}]`
    )
    .join("\n")

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: `You are a travel fashion stylist. Create a capsule wardrobe packing list. Maximize mix-and-match potential to minimize items while covering all ${days} days and occasions. Only use items from the provided wardrobe.

Return ONLY valid JSON:
{
  "packingList": ["item_id1", "item_id2", ...],
  "totalItems": number,
  "dailyOutfits": [
    { "day": 1, "occasion": "...", "itemIds": ["id1", "id2"], "note": "short styling note" }
  ],
  "mixMatchTips": ["2-3 tips for remixing these pieces"],
  "capsuleRatio": "e.g. 3 tops, 2 bottoms, 1 dress, 2 shoes"
}`,
      messages: [
        {
          role: "user",
          content: `Trip: ${days} days, Climate: ${climate}, Occasions: ${occasions.join(", ")}\n\nMy wardrobe:\n${inventoryText}\n\nCreate a capsule packing list. Return only valid JSON.`,
        },
      ],
    })

    const rawText =
      response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? ""

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: "AI did not return valid packing plan" }, { status: 500 })
    }

    const plan = JSON.parse(jsonMatch[0])
    const itemMap = new Map(items.map((i) => [i.id, i]))

    // Enrich packing list with item data
    plan.packingListItems = (plan.packingList ?? [])
      .map((id: string) => itemMap.get(id))
      .filter(Boolean)

    // Enrich daily outfits
    if (plan.dailyOutfits) {
      for (const day of plan.dailyOutfits) {
        day.items = (day.itemIds ?? []).map((id: string) => itemMap.get(id)).filter(Boolean)
      }
    }

    return Response.json(plan)
  } catch (error) {
    console.error("Packing error:", error)
    return Response.json({ error: "Failed to generate packing list" }, { status: 500 })
  }
}
