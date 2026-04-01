export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import ClosetSubNav from "@/components/closet/ClosetSubNav"
import OutfitCombos from "@/components/closet/OutfitCombos"

const USER_ID = "user_me"

export default async function CombosPage() {
  const items = await prisma.clothingItem.findMany({
    where: { userId: USER_ID },
    orderBy: [{ favorite: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      category: true,
      subcategory: true,
      color: true,
      colorHex: true,
      pattern: true,
      season: true,
      name: true,
      vibes: true,
      favorite: true,
      wearCount: true,
      createdAt: true,
    },
  })

  const itemsWithImageUrl = items.map((item) => ({
    ...item,
    imageData: `/api/closet/items/${item.id}/image`,
    createdAt: item.createdAt.toISOString(),
  }))

  const tops = itemsWithImageUrl.filter((i) => i.category === "tops")
  const bottoms = itemsWithImageUrl.filter((i) => i.category === "bottoms")
  const dresses = itemsWithImageUrl.filter((i) => i.category === "dresses")

  return (
    <div className="animate-fade-in pb-24">
      <div className="mb-4 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Outfit Combos</h1>
        <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
          {tops.length} tops &times; {bottoms.length} bottoms = {tops.length * bottoms.length} combos
        </p>
      </div>

      <ClosetSubNav />

      <div className="animate-slide-up delay-100">
        <OutfitCombos
          tops={tops as any}
          bottoms={bottoms as any}
          dresses={dresses as any}
        />
      </div>
    </div>
  )
}
