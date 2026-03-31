import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const USER_ID = "user_me"

export async function POST() {
  const items = await prisma.clothingItem.findMany({
    where: { userId: USER_ID },
  })

  if (items.length < 3) {
    return Response.json({ error: "Add at least 3 items for analysis" }, { status: 400 })
  }

  const categoryCounts = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] ?? 0) + 1
    return acc
  }, {})

  const colorCounts = items.reduce<Record<string, number>>((acc, i) => {
    const c = i.color ?? "unknown"
    acc[c] = (acc[c] ?? 0) + 1
    return acc
  }, {})

  const vibeCounts = items.reduce<Record<string, number>>((acc, i) => {
    for (const v of i.vibes ?? []) {
      acc[v] = (acc[v] ?? 0) + 1
    }
    return acc
  }, {})

  const summaryText = `Wardrobe: ${items.length} items total.
Categories: ${JSON.stringify(categoryCounts)}
Colors: ${JSON.stringify(colorCounts)}
Vibes: ${JSON.stringify(vibeCounts)}
Favorite count: ${items.filter((i) => i.favorite).length}
Avg wear count: ${(items.reduce((s, i) => s + i.wearCount, 0) / items.length).toFixed(1)}
Never worn: ${items.filter((i) => i.wearCount === 0).length}`

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: `You are a wardrobe consultant. Analyze this wardrobe summary and identify gaps and imbalances. Return ONLY valid JSON:
{
  "balance": { "category": "verdict string for each category - e.g. 'Well stocked', 'Lacking', 'Excessive'" },
  "gaps": ["3-5 specific items that would improve this wardrobe, e.g. 'A neutral blazer for office looks'"],
  "strengths": ["2-3 things this wardrobe does well"],
  "diversityScore": 1-10,
  "versatilityScore": 1-10,
  "summary": "2-3 sentence overall assessment"
}`,
      messages: [{ role: "user", content: summaryText }],
    })

    const rawText =
      response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? ""

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: "AI analysis failed" }, { status: 500 })
    }

    const analysis = JSON.parse(jsonMatch[0])

    // Save to style profile
    await prisma.styleProfile.upsert({
      where: { userId: USER_ID },
      update: { gapAnalysis: analysis },
      create: { userId: USER_ID, styleDna: {}, gapAnalysis: analysis },
    })

    return Response.json({
      ...analysis,
      raw: { categoryCounts, colorCounts, vibeCounts, totalItems: items.length },
    })
  } catch (error) {
    console.error("Gap analysis error:", error)
    return Response.json({ error: "Failed to run gap analysis" }, { status: 500 })
  }
}
