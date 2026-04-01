export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import ClosetSubNav from "@/components/closet/ClosetSubNav"
import ClosetOrgView from "@/components/closet/ClosetOrgView"

const USER_ID = "user_me"

export default async function OrganizePage() {
  const items = await prisma.clothingItem.findMany({
    where: { userId: USER_ID },
    orderBy: [{ category: "asc" }, { favorite: "desc" }, { createdAt: "desc" }],
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
      lastWornAt: true,
      createdAt: true,
      // imageData deliberately excluded — served via /api/closet/items/[id]/image
    },
  })

  const itemsWithImageUrl = items.map((item) => ({
    ...item,
    imageData: `/api/closet/items/${item.id}/image`,
    lastWornAt: item.lastWornAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
  }))

  return (
    <div className="animate-fade-in pb-24">
      <div className="mb-4 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">My Wardrobe</h1>
        <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
          Your closet, beautifully organized by category
        </p>
      </div>
      <ClosetSubNav />
      <div className="animate-slide-up delay-100">
        <ClosetOrgView
          items={itemsWithImageUrl as unknown as Parameters<typeof ClosetOrgView>[0]["items"]}
        />
      </div>
    </div>
  )
}
