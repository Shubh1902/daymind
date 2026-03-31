export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import ClosetStats from "@/components/closet/ClosetStats"
import ClosetSubNav from "@/components/closet/ClosetSubNav"
import Link from "next/link"

const USER_ID = "user_me"

export default async function StatsPage() {
  const items = await prisma.clothingItem.findMany({
    where: { userId: USER_ID },
  })

  return (
    <div className="animate-fade-in pb-24">
      <div className="flex items-center justify-between mb-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Closet Stats</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(249, 115, 22, 0.5)" }}>
            Your wardrobe at a glance
          </p>
        </div>
        <Link
          href="/closet/declutter"
          className="text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all duration-200"
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            color: "#f59e0b",
            border: "1px solid rgba(245, 158, 11, 0.2)",
          }}
        >
          🧹 Declutter
        </Link>
      </div>

      <ClosetSubNav />

      <div className="animate-slide-up delay-100">
        <ClosetStats items={items as unknown as Parameters<typeof ClosetStats>[0]["items"]} />
      </div>
    </div>
  )
}
