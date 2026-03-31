import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const USER_ID = "user_me"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { occasion, count = 3 } = body

  const items = await prisma.clothingItem.findMany({
    where: { userId: USER_ID },
    orderBy: { createdAt: "desc" },
  })

  if (items.length < 2) {
    return Response.json(
      { error: "Add at least 2 clothing items to get outfit suggestions" },
      { status: 400 }
    )
  }

  // Build a text-only inventory for the AI (no images to keep cost low)
  const inventoryText = items
    .map(
      (item) =>
        `- ID: ${item.id} | ${item.name ?? "Unnamed"} | Category: ${item.category} | Color: ${item.color ?? "unknown"} | Pattern: ${item.pattern ?? "unknown"} | Season: ${item.season ?? "all"} | Subcategory: ${item.subcategory ?? "unknown"}`
    )
    .join("\n")

  const occasionPrompt = occasion
    ? `The outfits should be suitable for: ${occasion}`
    : "Suggest versatile everyday outfits"

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: `You are a women's fashion stylist. Given a wardrobe inventory, suggest ${count} complete outfit combinations.

Rules:
- Each outfit MUST include items from different categories (e.g., a top + bottom, or a dress + shoes)
- Consider color harmony: complementary colors, analogous colors, or monochromatic schemes
- Consider pattern mixing: no more than one bold pattern per outfit
- Consider seasonality: don't mix heavy winter items with summer pieces
- Provide a short styling tip for each outfit

Return ONLY valid JSON array:
[
  {
    "name": "Creative descriptive outfit name",
    "itemIds": ["id1", "id2", "id3"],
    "occasion": "casual" | "work" | "date" | "party" | "weekend",
    "stylingTip": "One sentence styling advice",
    "colorStory": "Brief description of why these colors work together"
  }
]`,
      messages: [
        {
          role: "user",
          content: `My wardrobe:\n${inventoryText}\n\n${occasionPrompt}\n\nSuggest ${count} outfit combinations. Return only valid JSON.`,
        },
      ],
    })

    const rawText =
      response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? ""

    const jsonMatch = rawText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return Response.json({ error: "AI did not return valid suggestions" }, { status: 500 })
    }

    const suggestions = JSON.parse(jsonMatch[0]) as Array<{
      name: string
      itemIds: string[]
      occasion: string
      stylingTip: string
      colorStory: string
    }>

    // Enrich suggestions with actual item data
    const itemMap = new Map(items.map((i) => [i.id, i]))
    const enriched = suggestions.map((s) => ({
      ...s,
      items: s.itemIds
        .map((id) => itemMap.get(id))
        .filter(Boolean),
    }))

    return Response.json(enriched)
  } catch (error) {
    console.error("Outfit suggestion error:", error)
    return Response.json({ error: "Failed to generate outfit suggestions" }, { status: 500 })
  }
}
