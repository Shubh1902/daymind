import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const USER_ID = "user_me"
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST() {
  const items = await prisma.clothingItem.findMany({
    where: { userId: USER_ID },
    select: { id: true, name: true, category: true, subcategory: true, color: true, pattern: true, vibes: true, imageData: true },
  })

  const itemSummary = items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    subcategory: i.subcategory,
    color: i.color,
    pattern: i.pattern,
    vibes: i.vibes,
  }))

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: `You are a fashion stylist generating trending outfit ideas. Based on the user's wardrobe, generate 5-6 trending outfit looks they can recreate with their items. Return ONLY valid JSON:

{
  "looks": [
    {
      "title": "catchy trend name (e.g. Quiet Luxury, Coastal Grandmother, Clean Girl)",
      "description": "2-3 sentences describing the trend and how to nail it",
      "itemIds": ["ids from wardrobe that match this trend"],
      "missingPieces": ["items they'd need to buy to complete the look"],
      "trendScore": 8,
      "tags": ["#quietluxury", "#minimal", "#2024trend"]
    }
  ]
}

Rules:
- Use ONLY item IDs from the provided wardrobe for itemIds
- Each look should use 2-4 items
- Include currently trending aesthetics (quiet luxury, old money, clean girl, coastal, dark academia, streetwear, etc.)
- trendScore is 1-10 based on how well user's wardrobe matches the trend
- missingPieces should be specific and helpful, not generic
- Return ONLY the JSON`,
    messages: [
      {
        role: "user",
        content: `My wardrobe:\n${JSON.stringify(itemSummary, null, 2)}\n\nGenerate trending outfit looks I can recreate.`,
      },
    ],
  })

  const rawText = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? ""
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return Response.json({ error: "AI did not return valid JSON" }, { status: 500 })
  }

  const result = JSON.parse(jsonMatch[0])

  // Attach image data
  const itemMap = new Map(items.map((i) => [i.id, i]))
  for (const look of result.looks) {
    look.items = (look.itemIds ?? [])
      .map((id: string) => itemMap.get(id))
      .filter(Boolean)
      .map((i: (typeof items)[0]) => ({ id: i.id, name: i.name, category: i.category, imageData: i.imageData }))
  }

  return Response.json(result)
}
