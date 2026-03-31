import { NextRequest } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const { imageData } = await request.json()

  if (!imageData) {
    return Response.json({ error: "imageData is required" }, { status: 400 })
  }

  // Extract base64 and media type from data URI
  const match = imageData.match(/^data:(image\/\w+);base64,(.+)$/)
  if (!match) {
    return Response.json({ error: "Invalid image data URI" }, { status: 400 })
  }

  const mediaType = match[1] as "image/jpeg" | "image/png" | "image/webp" | "image/gif"
  const base64 = match[2]

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: `You are a fashion and clothing analysis expert. Analyze the clothing item in the image and return ONLY valid JSON with these fields:

{
  "category": "tops" | "bottoms" | "dresses" | "shoes" | "accessories",
  "subcategory": "specific type like t-shirt, blouse, jeans, sneakers, handbag, etc.",
  "color": "primary color (e.g. navy blue, cream white, forest green)",
  "colorHex": "#hex code of the primary color (e.g. #1e3a5f)",
  "pattern": "solid" | "striped" | "plaid" | "floral" | "polka-dot" | "graphic" | "abstract" | "animal-print",
  "season": "spring" | "summer" | "fall" | "winter" | "all",
  "name": "a short descriptive name like 'Navy Linen Blazer' or 'White Cotton T-Shirt'",
  "vibes": ["array of 1-4 occasion/vibe tags from this list: office, nightlife, party, date, casual, gym, brunch, modest, sexy, streetwear, vacation"]
}

Rules:
- "tops" includes t-shirts, blouses, shirts, sweaters, jackets, blazers, tank tops, hoodies
- "bottoms" includes jeans, trousers, skirts, shorts, leggings
- "dresses" includes all one-piece garments: dresses, jumpsuits, rompers
- "shoes" includes all footwear: sneakers, heels, boots, sandals, flats
- "accessories" includes bags, scarves, hats, belts, jewelry
- Assign vibes based on the item's style, cut, fabric, and overall look
- colorHex must be a valid CSS hex color
- Return ONLY the JSON, no explanation`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: "Analyze this clothing item. Return only valid JSON.",
            },
          ],
        },
      ],
    })

    const rawText =
      response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? ""

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: "AI did not return valid JSON" }, { status: 500 })
    }

    const classification = JSON.parse(jsonMatch[0])
    return Response.json(classification)
  } catch (error) {
    console.error("Categorization error:", error)
    return Response.json({ error: "Failed to categorize clothing" }, { status: 500 })
  }
}
