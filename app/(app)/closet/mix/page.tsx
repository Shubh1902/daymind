export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import OutfitMixer from "@/components/closet/OutfitMixer"
import ClosetSubNav from "@/components/closet/ClosetSubNav"

const USER_ID = "user_me"

export default async function MixPage() {
  const items = await prisma.clothingItem.findMany({
    where: { userId: USER_ID },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
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

  return (
    <div className="animate-fade-in pb-24">
      <div className="mb-4 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">Outfit Mixer</h1>
        <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          Pick items from each category to build your look
        </p>
      </div>

      <ClosetSubNav />

      <div className="animate-slide-up delay-100">
        <OutfitMixer items={itemsWithImageUrl as unknown as Parameters<typeof OutfitMixer>[0]["items"]} />
      </div>
    </div>
  )
}
