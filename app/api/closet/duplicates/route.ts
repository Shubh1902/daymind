import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

const USER_ID = "user_me"

// Check for similar items when uploading a new one
export async function POST(request: NextRequest) {
  const { category, subcategory, color, colorHex, pattern } = await request.json()

  if (!category) {
    return Response.json({ duplicates: [] })
  }

  const items = await prisma.clothingItem.findMany({
    where: { userId: USER_ID, category },
    select: {
      id: true,
      name: true,
      category: true,
      subcategory: true,
      color: true,
      colorHex: true,
      pattern: true,
      imageData: true,
    },
  })

  // Score similarity
  const scored = items.map((item) => {
    let score = 0

    // Same subcategory
    if (subcategory && item.subcategory && subcategory.toLowerCase() === item.subcategory.toLowerCase()) {
      score += 40
    }

    // Similar color (by name)
    if (color && item.color) {
      const c1 = color.toLowerCase()
      const c2 = item.color.toLowerCase()
      if (c1 === c2) score += 30
      else if (c1.includes(c2) || c2.includes(c1)) score += 15
    }

    // Similar hex color (within threshold)
    if (colorHex && item.colorHex) {
      const dist = hexDistance(colorHex, item.colorHex)
      if (dist < 30) score += 25
      else if (dist < 60) score += 12
    }

    // Same pattern
    if (pattern && item.pattern && pattern.toLowerCase() === item.pattern.toLowerCase()) {
      score += 15
    }

    return { ...item, similarityScore: score }
  })

  const duplicates = scored
    .filter((s) => s.similarityScore >= 40) // threshold
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 5)

  return Response.json({ duplicates })
}

function hexDistance(hex1: string, hex2: string): number {
  const r1 = parseInt(hex1.slice(1, 3), 16)
  const g1 = parseInt(hex1.slice(3, 5), 16)
  const b1 = parseInt(hex1.slice(5, 7), 16)
  const r2 = parseInt(hex2.slice(1, 3), 16)
  const g2 = parseInt(hex2.slice(3, 5), 16)
  const b2 = parseInt(hex2.slice(5, 7), 16)
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}
