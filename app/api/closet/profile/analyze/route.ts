import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const USER_ID = "user_me"

export async function POST() {
  const items = await prisma.clothingItem.findMany({
    where: { userId: USER_ID },
  })

  if (items.length < 3) {
    return Response.json(
      { error: "Add at least 3 items to analyze your style" },
      { status: 400 }
    )
  }

  const inventoryText = items
    .map(
      (item) =>
        `${item.name ?? "Unnamed"} (${item.category}/${item.subcategory ?? "unknown"}): Color=${item.color ?? "unknown"}, Pattern=${item.pattern ?? "unknown"}, Season=${item.season ?? "all"}, Vibes=[${(item.vibes ?? []).join(", ")}]`
    )
    .join("\n")

  const categorySummary = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] ?? 0) + 1
    return acc
  }, {})

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are a fashion analyst. Analyze this complete wardrobe and determine the owner's style DNA. Return ONLY valid JSON:
{
  "primary": "dominant style (e.g. minimalist, bohemian, classic, streetwear, romantic, edgy, preppy, athleisure)",
  "secondary": "secondary style influence",
  "breakdown": { "style_name": percentage, ... } (must sum to 100),
  "colorPalette": { "dominant": ["top 3 colors"], "accent": ["1-2 accent colors"] },
  "patternProfile": "1 sentence about pattern preferences",
  "seasonCoverage": { "spring": count, "summer": count, "fall": count, "winter": count, "all": count },
  "strengths": ["2-3 wardrobe strengths"],
  "personality": "2-3 sentences describing the person's fashion personality based on their closet",
  "styleIcon": "A celebrity or fashion icon whose style is closest to this wardrobe"
}`,
      messages: [
        {
          role: "user",
          content: `Wardrobe (${items.length} items):\n${inventoryText}\n\nCategory counts: ${JSON.stringify(categorySummary)}\n\nAnalyze my style DNA. Return only valid JSON.`,
        },
      ],
    })

    const rawText =
      response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? ""

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: "AI did not return valid analysis" }, { status: 500 })
    }

    const styleDna = JSON.parse(jsonMatch[0])

    // Upsert style profile
    const profile = await prisma.styleProfile.upsert({
      where: { userId: USER_ID },
      update: { styleDna, analyzedAt: new Date() },
      create: { userId: USER_ID, styleDna },
    })

    return Response.json(profile)
  } catch (error) {
    console.error("Style profile error:", error)
    return Response.json({ error: "Failed to analyze style" }, { status: 500 })
  }
}
