import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const USER_ID = "user_me"

export async function POST() {
  // Find items missing vibes or colorHex
  const items = await prisma.clothingItem.findMany({
    where: {
      userId: USER_ID,
      OR: [
        { colorHex: null },
        { vibes: { isEmpty: true } },
      ],
    },
  })

  if (items.length === 0) {
    return Response.json({ message: "All items are up to date", updated: 0 })
  }

  let updated = 0

  for (const item of items) {
    try {
      // Use text-only classification for backfill (cheaper, no image re-analysis needed)
      const description = `${item.name ?? ""} - ${item.category} / ${item.subcategory ?? "unknown"} - Color: ${item.color ?? "unknown"} - Pattern: ${item.pattern ?? "unknown"} - Season: ${item.season ?? "all"}`

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 128,
        system: `Given a clothing item description, return ONLY valid JSON:
{
  "colorHex": "#hex code matching the described color",
  "vibes": ["1-4 tags from: office, nightlife, party, date, casual, gym, brunch, modest, sexy, streetwear, vacation"]
}
Return ONLY JSON.`,
        messages: [{ role: "user", content: description }],
      })

      const rawText = response.content.find(
        (b): b is Anthropic.TextBlock => b.type === "text"
      )?.text ?? ""

      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) continue

      const data = JSON.parse(jsonMatch[0])

      await prisma.clothingItem.update({
        where: { id: item.id },
        data: {
          colorHex: data.colorHex ?? item.colorHex,
          vibes: Array.isArray(data.vibes) && data.vibes.length > 0 ? data.vibes : item.vibes,
        },
      })
      updated++
    } catch {
      // Skip failed items silently
    }
  }

  return Response.json({ message: `Backfilled ${updated} of ${items.length} items`, updated })
}
