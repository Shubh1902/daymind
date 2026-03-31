import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const USER_ID = "user_me"

export async function POST(request: NextRequest) {
  const { itemIds } = await request.json()

  if (!Array.isArray(itemIds) || itemIds.length < 2) {
    return Response.json({ error: "Select at least 2 items" }, { status: 400 })
  }

  const items = await prisma.clothingItem.findMany({
    where: { id: { in: itemIds }, userId: USER_ID },
  })

  if (items.length < 2) {
    return Response.json({ error: "Items not found" }, { status: 404 })
  }

  const itemDescriptions = items
    .map(
      (item) =>
        `- ${item.name ?? "Unnamed"} (${item.category}/${item.subcategory ?? "unknown"}): Color=${item.color ?? "unknown"} (${item.colorHex ?? "?"}), Pattern=${item.pattern ?? "unknown"}, Season=${item.season ?? "all"}, Vibes=[${(item.vibes ?? []).join(", ")}]`
    )
    .join("\n")

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: `You are a women's fashion stylist. Evaluate this outfit combination and return ONLY valid JSON:
{
  "colorHarmony": 1-10 score,
  "styleMatch": 1-10 score,
  "overallScore": 1-10 score,
  "occasions": ["list of suitable occasions"],
  "feedback": "2-3 sentences of specific, actionable style feedback. Mention what works and what could be improved.",
  "suggestedSwaps": ["1-2 suggestions like 'Try a white sneaker instead of the black heel for a more casual look'"]
}`,
      messages: [
        {
          role: "user",
          content: `Evaluate this outfit combination:\n${itemDescriptions}\n\nReturn only valid JSON.`,
        },
      ],
    })

    const rawText =
      response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? ""

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: "AI did not return valid feedback" }, { status: 500 })
    }

    return Response.json(JSON.parse(jsonMatch[0]))
  } catch (error) {
    console.error("Mix feedback error:", error)
    return Response.json({ error: "Failed to get outfit feedback" }, { status: 500 })
  }
}
