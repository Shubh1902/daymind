import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const USER_ID = "user_me"
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const { temperature, condition, humidity, windSpeed, location } = await request.json()

  if (temperature === undefined) {
    return Response.json({ error: "temperature is required" }, { status: 400 })
  }

  const items = await prisma.clothingItem.findMany({
    where: { userId: USER_ID },
    select: {
      id: true,
      name: true,
      category: true,
      subcategory: true,
      color: true,
      pattern: true,
      season: true,
      vibes: true,
      imageData: true,
    },
  })

  if (items.length < 2) {
    return Response.json({ error: "Not enough items in closet" }, { status: 400 })
  }

  const itemList = items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    subcategory: i.subcategory,
    color: i.color,
    pattern: i.pattern,
    season: i.season,
    vibes: i.vibes,
  }))

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `You are a fashion stylist. Based on the weather conditions and the user's wardrobe, suggest 2-3 complete outfits. Return ONLY valid JSON:

{
  "outfits": [
    {
      "name": "outfit name",
      "itemIds": ["id1", "id2"],
      "reason": "why this works for the weather",
      "layeringTip": "optional tip about layering for this weather"
    }
  ],
  "weatherAdvice": "general dressing advice for this weather"
}

Rules:
- Only use item IDs from the provided wardrobe
- Each outfit should have 2-4 items covering different categories
- Consider temperature, wind, rain/sun for fabric and layering choices
- Cold (<10°C): suggest layers, warm fabrics, closed shoes
- Mild (10-20°C): light layers, versatile pieces
- Warm (20-30°C): breathable fabrics, lighter colors
- Hot (>30°C): minimal layers, very breathable fabrics
- Rainy: avoid delicate fabrics, suggest closed-toe shoes
- Return ONLY the JSON`,
    messages: [
      {
        role: "user",
        content: `Weather: ${temperature}°C, ${condition ?? "clear"}, humidity ${humidity ?? 50}%, wind ${windSpeed ?? 0} km/h${location ? `, location: ${location}` : ""}.

My wardrobe:
${JSON.stringify(itemList, null, 2)}

Suggest outfits appropriate for this weather.`,
      },
    ],
  })

  const rawText = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? ""
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return Response.json({ error: "AI did not return valid JSON" }, { status: 500 })
  }

  const result = JSON.parse(jsonMatch[0])

  // Attach image data to outfit items
  const itemMap = new Map(items.map((i) => [i.id, i]))
  for (const outfit of result.outfits) {
    outfit.items = outfit.itemIds
      .map((id: string) => itemMap.get(id))
      .filter(Boolean)
      .map((i: (typeof items)[0]) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        imageData: i.imageData,
      }))
  }

  return Response.json(result)
}
