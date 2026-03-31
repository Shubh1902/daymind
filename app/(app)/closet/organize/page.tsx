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
      imageData: true,
      category: true,
      subcategory: true,
      color: true,
      name: true,
      favorite: true,
    },
  })

  return (
    <div className="animate-fade-in pb-24">
      <div className="mb-4 animate-slide-up">
        <h1 className="text-3xl font-bold text-gradient">My Wardrobe</h1>
        <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
          Your closet, organized like a real wardrobe
        </p>
      </div>
      <ClosetSubNav />
      <div className="animate-slide-up delay-100">
        <ClosetOrgView
          items={items as unknown as Parameters<typeof ClosetOrgView>[0]["items"]}
        />
      </div>
    </div>
  )
}
